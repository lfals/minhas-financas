import "server-only"

import type { PoolClient } from "pg"

import { NotFoundAppError, ValidationAppError } from "@/lib/errors/app-error"
import { queryDb } from "@/lib/db/pool"
import { withTransaction } from "@/lib/db/tx"
import type {
  CreateTransactionCommand,
  CreateTransactionResult,
  TransactionListCommand,
  TransactionListRecord,
  TransactionRecord,
} from "@/modules/transactions/domain/types"
import {
  findAccountForTransactionSql,
  findTransactionByClientRequestSql,
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
  amount_cents: string
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
    amountCents: row.amount_cents,
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

      const currentBalanceCents = Number(account.current_balance_cents)
      const signedAmountCents = command.kind === "income" ? command.amountCents : -command.amountCents
      const shouldAffectBalance = command.status === "compensated"
      const nextBalanceCents = shouldAffectBalance
        ? currentBalanceCents + signedAmountCents
        : currentBalanceCents

      if (nextBalanceCents < 0) {
        throw new ValidationAppError("Esse lançamento deixaria a conta com saldo negativo.")
      }

      const inserted = await client.query<DbTransactionRow>(insertTransactionSql, [
        command.clerkUserId,
        command.clientRequestId,
        command.accountId,
        command.title,
        command.category,
        command.kind,
        command.status,
        command.amountCents,
        command.occurredOn,
        command.notes ?? "",
      ])

      const transaction = mapTransactionRow(inserted.rows[0])

      if (shouldAffectBalance) {
        await client.query(updateAccountBalanceSql, [
          command.clerkUserId,
          command.accountId,
          nextBalanceCents,
        ])
      }

      await client.query(insertTransactionAuditLogSql, [
        command.clerkUserId,
        "user",
        "transaction.created",
        "transactions",
        transaction.id,
        null,
        JSON.stringify(transaction),
        command.clientRequestId,
        command.clientRequestId,
      ])

      return {
        transaction,
        created: true,
      }
    })
  }
}
