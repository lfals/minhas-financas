import "server-only"

import { randomUUID } from "node:crypto"
import type { PoolClient } from "pg"

import { NotFoundAppError, ValidationAppError } from "@/lib/errors/app-error"
import { queryDb } from "@/lib/db/pool"
import { withTransaction } from "@/lib/db/tx"
import type {
  CreateTransactionCommand,
  CreateTransactionResult,
  SettleTransactionCommand,
  TransactionListCommand,
  TransactionListRecord,
  TransactionRecord,
} from "@/modules/transactions/domain/types"
import {
  compensateTransactionSql,
  findAccountForTransactionSql,
  findTransactionByClientRequestSql,
  findTransactionByIdForUpdateSql,
  insertTransactionAuditLogSql,
  insertTransactionSql,
  listTransactionsSql,
  updateAccountBalanceSql,
} from "@/modules/transactions/infrastructure/transactions-sql"
import {
  transactionListRecordSchema,
  transactionRecordSchema,
} from "@/schemas/transactions.schemas"

type DbTransactionRow = {
  id: string
  clerk_user_id: string
  account_id: string
  title: string
  category: string
  kind: string
  status: string
  is_fixed: boolean
  fixed_expense_frequency: string | null
  installment_number: number | null
  installment_total: number | null
  amount_cents: string
  settled_amount_cents: string | null
  occurred_on: string
  notes: string | null
  created_at: string
  updated_at: string
}

type DbTransactionListRow = DbTransactionRow & {
  account_name: string
  account_institution: string
}

type DbAccountBalanceRow = {
  id: string
  clerk_user_id: string
  name: string
  institution: string
  current_balance_cents: string
  is_archived: boolean
}

function mapTransactionRow(row: DbTransactionRow): TransactionRecord {
  return transactionRecordSchema.parse({
    id: row.id,
    clerkUserId: row.clerk_user_id,
    accountId: row.account_id,
    title: row.title,
    category: row.category,
    kind: row.kind,
    status: row.status,
    isFixed: row.is_fixed,
    fixedExpenseFrequency: row.fixed_expense_frequency,
    installmentNumber: row.installment_number,
    installmentTotal: row.installment_total,
    amountCents: row.amount_cents,
    settledAmountCents: row.settled_amount_cents,
    occurredOn: row.occurred_on,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

function mapTransactionListRow(row: DbTransactionListRow): TransactionListRecord {
  return transactionListRecordSchema.parse({
    ...mapTransactionRow(row),
    accountName: row.account_name,
    accountInstitution: row.account_institution,
  })
}

function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
}

function addMonthsToIsoDate(isoDate: string, monthOffset: number) {
  const [year, month, day] = isoDate.split("-").map(Number)
  const baseMonthIndex = month - 1
  const targetMonthIndex = baseMonthIndex + monthOffset
  const targetYear = year + Math.floor(targetMonthIndex / 12)
  const normalizedMonthIndex = ((targetMonthIndex % 12) + 12) % 12
  const targetDay = Math.min(day, getDaysInMonth(targetYear, normalizedMonthIndex))

  return new Date(Date.UTC(targetYear, normalizedMonthIndex, targetDay))
    .toISOString()
    .slice(0, 10)
}

function buildFixedOccurrences(command: CreateTransactionCommand) {
  if (!command.isFixed) {
    return [
      {
        ...command,
      },
    ]
  }

  const [year] = command.occurredOn.split("-").map(Number)
  const startMonthIndex = Number(command.occurredOn.split("-")[1]) - 1
  const occurrences: CreateTransactionCommand[] = []

  for (let monthIndex = startMonthIndex; monthIndex < 12; monthIndex += 1) {
    occurrences.push({
      ...command,
      clientRequestId: monthIndex === startMonthIndex ? command.clientRequestId : randomUUID(),
      occurredOn: addMonthsToIsoDate(command.occurredOn, monthIndex - startMonthIndex),
      status:
        monthIndex === startMonthIndex
          ? command.status
          : command.kind === "expense"
            ? "pending"
            : "scheduled",
    })
  }

  return occurrences.filter((occurrence) => occurrence.occurredOn.startsWith(`${year}-`))
}

function buildInstallmentOccurrences(command: CreateTransactionCommand) {
  if (command.installmentNumber == null || command.installmentTotal == null) {
    return [
      {
        ...command,
      },
    ]
  }

  const remainingInstallments = command.installmentTotal - command.installmentNumber
  const occurrences: CreateTransactionCommand[] = []

  for (let monthOffset = 0; monthOffset <= remainingInstallments; monthOffset += 1) {
    occurrences.push({
      ...command,
      clientRequestId: monthOffset === 0 ? command.clientRequestId : randomUUID(),
      occurredOn: addMonthsToIsoDate(command.occurredOn, monthOffset),
      installmentNumber: command.installmentNumber + monthOffset,
      installmentTotal: command.installmentTotal,
      status:
        monthOffset === 0
          ? command.status
          : command.kind === "expense"
            ? "pending"
            : "scheduled",
    })
  }

  return occurrences
}

async function queryOne(
  client: PoolClient,
  text: string,
  params: readonly unknown[]
) {
  const result = await client.query<DbTransactionRow>(text, params as unknown[])
  return result.rows[0] ? mapTransactionRow(result.rows[0]) : null
}

export class TransactionsRepository {
  async listByUser(command: TransactionListCommand) {
    const result = await queryDb<DbTransactionListRow>(listTransactionsSql, [command.clerkUserId])
    return result.rows.map(mapTransactionListRow)
  }

  async create(command: CreateTransactionCommand): Promise<CreateTransactionResult> {
    return withTransaction(async (client) => {
      const existingByRequest = await queryOne(client, findTransactionByClientRequestSql, [
        command.clerkUserId,
        command.clientRequestId,
      ])

      if (existingByRequest) {
        return {
          transaction: existingByRequest,
          created: false,
        }
      }

      const accountResult = await client.query<DbAccountBalanceRow>(findAccountForTransactionSql, [
        command.clerkUserId,
        command.accountId,
      ])

      const account = accountResult.rows[0]

      if (!account || account.is_archived) {
        throw new NotFoundAppError("Selecione uma conta válida para o lançamento.")
      }

      const occurrences =
        command.installmentNumber != null && command.installmentTotal != null
          ? buildInstallmentOccurrences(command)
          : buildFixedOccurrences(command)
      const firstOccurrence = occurrences[0]
      const currentBalanceCents = Number(account.current_balance_cents)
      const signedAmountCents = command.kind === "income" ? command.amountCents : -command.amountCents
      const shouldAffectBalance = firstOccurrence.status === "compensated"
      const nextBalanceCents = shouldAffectBalance
        ? currentBalanceCents + signedAmountCents
        : currentBalanceCents

      let transaction: TransactionRecord | null = null

      for (const occurrence of occurrences) {
        const inserted = await client.query<DbTransactionRow>(insertTransactionSql, [
          occurrence.clerkUserId,
          occurrence.clientRequestId,
          occurrence.accountId,
          occurrence.title,
          occurrence.category,
          occurrence.kind,
          occurrence.status,
          occurrence.isFixed,
          occurrence.fixedExpenseFrequency ?? null,
          occurrence.installmentNumber ?? null,
          occurrence.installmentTotal ?? null,
          occurrence.amountCents,
          occurrence.occurredOn,
          occurrence.notes ?? "",
        ])

        const insertedTransaction = mapTransactionRow(inserted.rows[0])

        await client.query(insertTransactionAuditLogSql, [
          occurrence.clerkUserId,
          "user",
          "transaction.created",
          "transactions",
          insertedTransaction.id,
          null,
          JSON.stringify(insertedTransaction),
          occurrence.clientRequestId,
          occurrence.clientRequestId,
        ])

        if (!transaction) {
          transaction = insertedTransaction
        }
      }

      if (shouldAffectBalance) {
        await client.query(updateAccountBalanceSql, [
          command.clerkUserId,
          command.accountId,
          nextBalanceCents,
        ])
      }

      return {
        transaction: transaction!,
        created: true,
      }
    })
  }

  async settleTransaction(command: SettleTransactionCommand) {
    return withTransaction(async (client) => {
      const existingTransaction = await queryOne(client, findTransactionByIdForUpdateSql, [
        command.clerkUserId,
        command.transactionId,
      ])

      if (!existingTransaction) {
        throw new NotFoundAppError("Lançamento não encontrado.")
      }

      if (existingTransaction.status === "compensated") {
        throw new ValidationAppError("Somente lançamentos não compensados podem ser efetivados.")
      }

      const accountResult = await client.query<DbAccountBalanceRow>(findAccountForTransactionSql, [
        command.clerkUserId,
        existingTransaction.accountId,
      ])

      const account = accountResult.rows[0]

      if (!account || account.is_archived) {
        throw new NotFoundAppError("Selecione uma conta válida para o lançamento.")
      }

      const nextBalanceCents =
        existingTransaction.kind === "income"
          ? Number(account.current_balance_cents) + (command.amountCents ?? existingTransaction.amountCents)
          : Number(account.current_balance_cents) - (command.amountCents ?? existingTransaction.amountCents)

      const updated = await client.query<DbTransactionRow>(compensateTransactionSql, [
        command.clerkUserId,
        command.transactionId,
        command.amountCents ?? existingTransaction.amountCents,
      ])

      const transaction = mapTransactionRow(updated.rows[0])

      await client.query(updateAccountBalanceSql, [
        command.clerkUserId,
        existingTransaction.accountId,
        nextBalanceCents,
      ])

      await client.query(insertTransactionAuditLogSql, [
        command.clerkUserId,
        "user",
        "transaction.compensated",
        "transactions",
        transaction.id,
        JSON.stringify(existingTransaction),
        JSON.stringify(transaction),
        null,
        null,
      ])

      return transaction
    })
  }
}
