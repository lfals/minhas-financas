import "server-only"

import { randomUUID } from "node:crypto"
import type { PoolClient } from "pg"

import { queryDb } from "@/lib/db/pool"
import { withTransaction } from "@/lib/db/tx"
import { NotFoundAppError, ValidationAppError } from "@/lib/errors/app-error"
import type {
  CreateCreditCardExpenseCommand,
  CreateTransactionCommand,
  CreateTransactionResult,
  RemoveTransactionCommand,
  SettleTransactionCommand,
  TransactionListCommand,
  TransactionListRecord,
  TransactionRecord,
} from "@/modules/transactions/domain/types"
import {
  compensateTransactionSql,
  deleteFutureTransactionsBySeriesSql,
  deleteTransactionSql,
  findAccountForTransactionSql,
  findCreditCardExpenseByClientRequestSql,
  findCreditCardForExpenseSql,
  findCreditCardInvoiceByMonthForUpdateSql,
  findTransactionByClientRequestSql,
  findTransactionByIdForUpdateSql,
  insertCreditCardExpenseSql,
  insertTransactionAuditLogSql,
  insertTransactionSql,
  listFutureTransactionsBySeriesForUpdateSql,
  listTransactionsSql,
  updateAccountBalanceSql,
  updateCreditCardInvoiceSql,
} from "@/modules/transactions/infrastructure/transactions-sql"
import { transactionListRecordSchema, transactionRecordSchema } from "@/schemas/transactions.schemas"

type DbTransactionRow = {
  id: string
  clerk_user_id: string
  account_id: string
  title: string
  category: string
  kind: string
  status: string
  source_type: string
  credit_card_id: string | null
  invoice_month: string | null
  series_id: string | null
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

type DbCreditCardExpenseRow = {
  id: string
  nickname: string
  closing_day: number
  due_day: number
  expense_account_id: string
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
    sourceType: row.source_type,
    creditCardId: row.credit_card_id,
    invoiceMonth: row.invoice_month,
    seriesId: row.series_id,
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
    return [{ ...command }]
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
    return [{ ...command }]
  }

  const remainingInstallments = command.installmentTotal - command.installmentNumber
  const occurrences: CreateTransactionCommand[] = []
  const baseAmountCents = Math.floor(command.amountCents / command.installmentTotal)
  const remainderCents = command.amountCents % command.installmentTotal

  for (let monthOffset = 0; monthOffset <= remainingInstallments; monthOffset += 1) {
    const installmentNumber = command.installmentNumber + monthOffset
    const amountCents =
      command.installmentAmountInputMode === "total"
        ? baseAmountCents + (installmentNumber <= remainderCents ? 1 : 0)
        : command.amountCents

    occurrences.push({
      ...command,
      clientRequestId: monthOffset === 0 ? command.clientRequestId : randomUUID(),
      occurredOn: addMonthsToIsoDate(command.occurredOn, monthOffset),
      installmentNumber,
      installmentTotal: command.installmentTotal,
      amountCents,
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

function buildCreditCardInstallmentOccurrences(command: CreateCreditCardExpenseCommand) {
  if (command.installmentNumber == null || command.installmentTotal == null) {
    return [
      {
        ...command,
      },
    ]
  }

  const remainingInstallments = command.installmentTotal - command.installmentNumber
  const occurrences: CreateCreditCardExpenseCommand[] = []
  const baseAmountCents = Math.floor(command.amountCents / command.installmentTotal)
  const remainderCents = command.amountCents % command.installmentTotal

  for (let monthOffset = 0; monthOffset <= remainingInstallments; monthOffset += 1) {
    const installmentNumber = command.installmentNumber + monthOffset
    const amountCents =
      command.installmentAmountInputMode === "total"
        ? baseAmountCents + (installmentNumber <= remainderCents ? 1 : 0)
        : command.amountCents

    occurrences.push({
      ...command,
      clientRequestId: monthOffset === 0 ? command.clientRequestId : randomUUID(),
      occurredOn: addMonthsToIsoDate(command.occurredOn, monthOffset),
      installmentNumber,
      installmentTotal: command.installmentTotal,
      amountCents,
    })
  }

  return occurrences
}

function getCreditCardInvoiceCompetenceMonth(occurredOn: string, closingDay: number) {
  const [, , purchaseDay] = occurredOn.split("-").map(Number)
  return purchaseDay <= closingDay ? occurredOn.slice(0, 7) : addMonthsToIsoDate(occurredOn, 1).slice(0, 7)
}

function getCreditCardInvoiceMonth(competenceMonth: string, closingDay: number, dueDay: number) {
  const baseDate = `${competenceMonth}-01`
  return dueDay > closingDay ? competenceMonth : addMonthsToIsoDate(baseDate, 1).slice(0, 7)
}

function buildInvoiceDate(invoiceMonth: string, dueDay: number) {
  const [year, month] = invoiceMonth.split("-").map(Number)
  const monthIndex = month - 1
  const clampedDay = Math.min(dueDay, getDaysInMonth(year, monthIndex))

  return new Date(Date.UTC(year, monthIndex, clampedDay)).toISOString().slice(0, 10)
}

function buildCreditCardInvoiceTitle(cardNickname: string, invoiceMonth: string) {
  const [year, month] = invoiceMonth.split("-")
  return `Fatura ${cardNickname} • ${month}/${year}`
}

async function queryOne(client: PoolClient, text: string, params: readonly unknown[]) {
  const result = await client.query<DbTransactionRow>(text, params as unknown[])
  return result.rows[0] ? mapTransactionRow(result.rows[0]) : null
}

async function queryMany(client: PoolClient, text: string, params: readonly unknown[]) {
  const result = await client.query<DbTransactionRow>(text, params as unknown[])
  return result.rows.map(mapTransactionRow)
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
      const shouldCreateSeries =
        command.isFixed || (command.installmentNumber != null && command.installmentTotal != null)
      const seriesId = command.seriesId ?? (shouldCreateSeries ? randomUUID() : null)
      const firstOccurrence = occurrences[0]
      const currentBalanceCents = Number(account.current_balance_cents)
      const signedAmountCents =
        firstOccurrence.kind === "income" ? firstOccurrence.amountCents : -firstOccurrence.amountCents
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
          occurrence.sourceType ?? "manual",
          occurrence.creditCardId ?? null,
          occurrence.invoiceMonth ?? null,
          seriesId,
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

  async createCreditCardExpense(command: CreateCreditCardExpenseCommand): Promise<CreateTransactionResult> {
    return withTransaction(async (client) => {
      const existingByRequest = await queryOne(client, findCreditCardExpenseByClientRequestSql, [
        command.clerkUserId,
        command.clientRequestId,
      ])

      if (existingByRequest) {
        return {
          transaction: existingByRequest,
          created: false,
        }
      }

      const cardResult = await client.query<DbCreditCardExpenseRow>(findCreditCardForExpenseSql, [
        command.clerkUserId,
        command.cardId,
      ])
      const card = cardResult.rows[0]

      if (!card || card.is_archived) {
        throw new NotFoundAppError("Selecione um cartão válido para a despesa.")
      }

      const occurrences = buildCreditCardInstallmentOccurrences(command)
      let firstInvoiceTransaction: TransactionRecord | null = null

      for (const occurrence of occurrences) {
        const competenceMonth = getCreditCardInvoiceCompetenceMonth(occurrence.occurredOn, card.closing_day)
        const invoiceMonth = getCreditCardInvoiceMonth(competenceMonth, card.closing_day, card.due_day)
        const invoiceDate = buildInvoiceDate(invoiceMonth, card.due_day)
        const invoiceKey = `${invoiceMonth}-01`
        const invoiceTitle = buildCreditCardInvoiceTitle(card.nickname, invoiceMonth)
        const invoiceCategory = "Cartão de crédito"

        const existingInvoice = await queryOne(client, findCreditCardInvoiceByMonthForUpdateSql, [
          command.clerkUserId,
          command.cardId,
          invoiceKey,
        ])

        if (existingInvoice?.status === "compensated") {
          throw new ValidationAppError("A fatura deste cartão já foi compensada para este mês.")
        }

        const invoiceTransaction = existingInvoice
          ? mapTransactionRow(
              (
                await client.query<DbTransactionRow>(updateCreditCardInvoiceSql, [
                  command.clerkUserId,
                  existingInvoice.id,
                  card.expense_account_id,
                  invoiceTitle,
                  invoiceCategory,
                  occurrence.amountCents,
                  invoiceDate,
                ])
              ).rows[0]
            )
          : mapTransactionRow(
              (
                await client.query<DbTransactionRow>(insertTransactionSql, [
                  command.clerkUserId,
                  randomUUID(),
                  card.expense_account_id,
                  invoiceTitle,
                  invoiceCategory,
                  "expense",
                  "pending",
                  "credit_card_invoice",
                  command.cardId,
                  invoiceKey,
                  null,
                  false,
                  null,
                  null,
                  null,
                  occurrence.amountCents,
                  invoiceDate,
                  "",
                ])
              ).rows[0]
            )

        await client.query(insertCreditCardExpenseSql, [
          command.clerkUserId,
          occurrence.clientRequestId,
          command.cardId,
          invoiceTransaction.id,
          occurrence.installmentTotal
            ? `${command.title} ${occurrence.installmentNumber}/${occurrence.installmentTotal}`
            : command.title,
          command.category,
          occurrence.amountCents,
          occurrence.occurredOn,
          command.notes ?? "",
        ])

        await client.query(insertTransactionAuditLogSql, [
          command.clerkUserId,
          "user",
          existingInvoice ? "credit_card_invoice.updated" : "credit_card_invoice.created",
          "transactions",
          invoiceTransaction.id,
          existingInvoice ? JSON.stringify(existingInvoice) : null,
          JSON.stringify(invoiceTransaction),
          occurrence.clientRequestId,
          occurrence.clientRequestId,
        ])

        if (!firstInvoiceTransaction) {
          firstInvoiceTransaction = invoiceTransaction
        }
      }

      return {
        transaction: firstInvoiceTransaction!,
        created: true,
      }
    })
  }

  async findById(clerkUserId: string, transactionId: string) {
    const result = await queryDb<DbTransactionRow>(
      `
        select
          id,
          clerk_user_id,
          account_id,
          title,
          category,
          kind,
          status,
          source_type,
          credit_card_id,
          invoice_month::text as invoice_month,
          series_id,
          is_fixed,
          fixed_expense_frequency,
          installment_number,
          installment_total,
          amount_cents::text as amount_cents,
          settled_amount_cents::text as settled_amount_cents,
          occurred_on::text as occurred_on,
          notes,
          created_at::text as created_at,
          updated_at::text as updated_at
        from transactions
        where clerk_user_id = $1
          and id = $2
        limit 1
      `,
      [clerkUserId, transactionId]
    )

    return result.rows[0] ? mapTransactionRow(result.rows[0]) : null
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

  async remove(command: RemoveTransactionCommand) {
    return withTransaction(async (client) => {
      const existingTransaction = await queryOne(client, findTransactionByIdForUpdateSql, [
        command.clerkUserId,
        command.transactionId,
      ])

      if (!existingTransaction) {
        throw new NotFoundAppError("Lançamento não encontrado.")
      }

      if (existingTransaction.sourceType === "credit_card_invoice") {
        throw new ValidationAppError("Remova compras do cartão pelo fluxo de fatura, não pelo lançamento consolidado.")
      }

      const transactionsToRemove =
        command.scope === "future" && existingTransaction.seriesId
          ? await queryMany(client, listFutureTransactionsBySeriesForUpdateSql, [
              command.clerkUserId,
              existingTransaction.seriesId,
              existingTransaction.occurredOn,
            ])
          : [existingTransaction]

      const balanceDeltasByAccount = new Map<string, number>()

      for (const transaction of transactionsToRemove) {
        if (transaction.status !== "compensated") {
          continue
        }

        const effectiveAmountCents = transaction.settledAmountCents ?? transaction.amountCents
        const balanceDelta = transaction.kind === "income" ? -effectiveAmountCents : effectiveAmountCents

        balanceDeltasByAccount.set(
          transaction.accountId,
          (balanceDeltasByAccount.get(transaction.accountId) ?? 0) + balanceDelta
        )
      }

      for (const [accountId, balanceDelta] of balanceDeltasByAccount.entries()) {
        const accountResult = await client.query<DbAccountBalanceRow>(findAccountForTransactionSql, [
          command.clerkUserId,
          accountId,
        ])
        const account = accountResult.rows[0]

        if (!account || account.is_archived) {
          throw new NotFoundAppError("Selecione uma conta válida para o lançamento.")
        }

        await client.query(updateAccountBalanceSql, [
          command.clerkUserId,
          accountId,
          Number(account.current_balance_cents) + balanceDelta,
        ])
      }

      if (command.scope === "future" && existingTransaction.seriesId) {
        await client.query(deleteFutureTransactionsBySeriesSql, [
          command.clerkUserId,
          existingTransaction.seriesId,
          existingTransaction.occurredOn,
        ])
      } else {
        await client.query(deleteTransactionSql, [command.clerkUserId, command.transactionId])
      }

      await client.query(insertTransactionAuditLogSql, [
        command.clerkUserId,
        "user",
        command.scope === "future" ? "transaction.future_removed" : "transaction.removed",
        "transactions",
        existingTransaction.id,
        JSON.stringify(
          transactionsToRemove.length === 1 ? transactionsToRemove[0] : transactionsToRemove
        ),
        null,
        null,
        null,
      ])

      return transactionsToRemove
    })
  }
}
