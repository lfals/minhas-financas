import "server-only"

import { queryDb } from "@/lib/db/pool"
import { withTransaction } from "@/lib/db/tx"
import { NotFoundAppError } from "@/lib/errors/app-error"
import type { DatabaseClient } from "@/lib/db/types"
import type {
  ArchiveCreditCardCommand,
  CreateCreditCardCommand,
  CreateCreditCardResult,
  CreditCardRecord,
  ListCreditCardsCommand,
  UpdateCreditCardCommand,
} from "@/modules/credit-cards/domain/types"
import {
  findAccountForCreditCardSql,
  findCreditCardByClientRequestSql,
  archiveCreditCardSql,
  findCreditCardByIdSql,
  findCreditCardByNicknameSql,
  insertCreditCardAuditLogSql,
  insertCreditCardSql,
  listCreditCardsSql,
  updateCreditCardSql,
} from "@/modules/credit-cards/infrastructure/credit-cards-sql"
import { creditCardRecordSchema } from "@/schemas/credit-cards.schemas"

type DbCreditCardRow = {
  id: string
  clerk_user_id: string
  nickname: string
  final_digits: string
  limit_cents: string
  used_limit_cents: string
  closing_day: number
  due_day: number
  expense_account_id: string
  expense_account_name: string
  auto_categorization_enabled: boolean
  is_archived: boolean
  created_at: string
  updated_at: string
}

type DbAccountRow = {
  id: string
  name: string
}

type DbInsertedCreditCardRow = Omit<DbCreditCardRow, "expense_account_name">

function mapCreditCardRow(row: DbCreditCardRow): CreditCardRecord {
  return creditCardRecordSchema.parse({
    id: row.id,
    clerkUserId: row.clerk_user_id,
    nickname: row.nickname,
    finalDigits: row.final_digits,
    limitCents: row.limit_cents,
    usedLimitCents: row.used_limit_cents,
    closingDay: row.closing_day,
    dueDay: row.due_day,
    expenseAccountId: row.expense_account_id,
    expenseAccountName: row.expense_account_name,
    autoCategorizationEnabled: Boolean(row.auto_categorization_enabled),
    isArchived: Boolean(row.is_archived),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

async function loadAccount(client: DatabaseClient, clerkUserId: string, accountId: string) {
  const result = await client.query<DbAccountRow>(findAccountForCreditCardSql, [clerkUserId, accountId])
  const account = result.rows[0]

  if (!account) {
    throw new NotFoundAppError("Conta de pagamento não encontrada.", { accountId })
  }

  return account
}

async function hydrateCreditCard(
  client: DatabaseClient,
  row: DbInsertedCreditCardRow
): Promise<CreditCardRecord> {
  const account = await loadAccount(client, row.clerk_user_id, row.expense_account_id)

  return mapCreditCardRow({
    ...row,
    used_limit_cents: "0",
    expense_account_name: account.name,
  })
}

async function queryOne(
  client: DatabaseClient,
  text: string,
  params: readonly unknown[]
): Promise<CreditCardRecord | null> {
  const result = await client.query<DbCreditCardRow>(text, params as unknown[])
  return result.rows[0] ? mapCreditCardRow(result.rows[0]) : null
}

export class CreditCardsRepository {
  async listByUser(command: ListCreditCardsCommand) {
    const result = await queryDb<DbCreditCardRow>(listCreditCardsSql, [command.clerkUserId])
    return result.rows.map(mapCreditCardRow)
  }

  async findById(clerkUserId: string, cardId: string) {
    const result = await queryDb<DbCreditCardRow>(findCreditCardByIdSql, [clerkUserId, cardId])
    return result.rows[0] ? mapCreditCardRow(result.rows[0]) : null
  }

  async findByNickname(clerkUserId: string, nickname: string) {
    const result = await queryDb<DbCreditCardRow>(findCreditCardByNicknameSql, [clerkUserId, nickname])
    return result.rows[0] ? mapCreditCardRow(result.rows[0]) : null
  }

  async create(command: CreateCreditCardCommand): Promise<CreateCreditCardResult> {
    return withTransaction(async (client) => {
      const existingByRequest = await queryOne(client, findCreditCardByClientRequestSql, [
        command.clerkUserId,
        command.clientRequestId,
      ])

      if (existingByRequest) {
        return {
          card: existingByRequest,
          created: false,
        }
      }

      const inserted = await client.query<DbInsertedCreditCardRow>(insertCreditCardSql, [
        command.clerkUserId,
        command.clientRequestId,
        command.nickname,
        command.finalDigits,
        command.limitCents,
        command.closingDay,
        command.dueDay,
        command.expenseAccountId,
        command.autoCategorizationEnabled,
      ])

      const card = await hydrateCreditCard(client, inserted.rows[0])

      await client.query(insertCreditCardAuditLogSql, [
        command.clerkUserId,
        "user",
        "credit_card.created",
        "credit_cards",
        card.id,
        null,
        JSON.stringify(card),
        command.clientRequestId,
        command.clientRequestId,
      ])

      return {
        card,
        created: true,
      }
    })
  }

  async update(command: UpdateCreditCardCommand) {
    return withTransaction(async (client) => {
      const existingCard = await queryOne(client, findCreditCardByIdSql, [
        command.clerkUserId,
        command.cardId,
      ])

      if (!existingCard) {
        return null
      }

      const updated = await client.query<DbInsertedCreditCardRow>(updateCreditCardSql, [
        command.clerkUserId,
        command.cardId,
        command.nickname,
        command.finalDigits,
        command.limitCents,
        command.closingDay,
        command.dueDay,
        command.expenseAccountId,
        command.autoCategorizationEnabled,
      ])

      const updatedRow = updated.rows[0]

      if (!updatedRow) {
        return existingCard
      }

      const card = await hydrateCreditCard(client, updatedRow)

      await client.query(insertCreditCardAuditLogSql, [
        command.clerkUserId,
        "user",
        "credit_card.updated",
        "credit_cards",
        command.cardId,
        JSON.stringify(existingCard),
        JSON.stringify(card),
        null,
        null,
      ])

      return card
    })
  }

  async archive(command: ArchiveCreditCardCommand) {
    return withTransaction(async (client) => {
      const existingCard = await queryOne(client, findCreditCardByIdSql, [
        command.clerkUserId,
        command.cardId,
      ])

      if (!existingCard) {
        return null
      }

      const archived = await client.query<DbInsertedCreditCardRow>(archiveCreditCardSql, [
        command.clerkUserId,
        command.cardId,
      ])

      if (!archived.rows[0]) {
        return existingCard
      }

      const card = await hydrateCreditCard(client, archived.rows[0])

      await client.query(insertCreditCardAuditLogSql, [
        command.clerkUserId,
        "user",
        "credit_card.archived",
        "credit_cards",
        command.cardId,
        JSON.stringify(existingCard),
        JSON.stringify(card),
        null,
        null,
      ])

      return card
    })
  }
}
