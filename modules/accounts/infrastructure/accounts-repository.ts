import "server-only"

import type { PoolClient } from "pg"

import { queryDb } from "@/lib/db/pool"
import { withTransaction } from "@/lib/db/tx"
import type {
  AccountRecord,
  ArchiveAccountCommand,
  CreateAccountCommand,
  CreateAccountResult,
  ListAccountsCommand,
  UpdateAccountCommand,
} from "@/modules/accounts/domain/types"
import {
  archiveAccountSql,
  findAccountByIdSql,
  findAccountByClientRequestSql,
  findAccountByNameSql,
  insertAccountSql,
  insertAuditLogSql,
  listAccountsSql,
  listAllAccountsSql,
  updateAccountSql,
} from "@/modules/accounts/infrastructure/accounts-sql"
import { accountRecordSchema } from "@/schemas/accounts.schemas"

type DbAccountRow = {
  id: string
  clerk_user_id: string
  name: string
  type: string
  currency_code: string
  initial_balance_cents: string
  current_balance_cents: string
  include_in_net_worth: boolean
  is_archived: boolean
  display_order: number
  created_at: string
  updated_at: string
}

function mapAccountRow(row: DbAccountRow): AccountRecord {
  return accountRecordSchema.parse({
    id: row.id,
    clerkUserId: row.clerk_user_id,
    name: row.name,
    type: row.type,
    currencyCode: row.currency_code,
    initialBalanceCents: row.initial_balance_cents,
    currentBalanceCents: row.current_balance_cents,
    includeInNetWorth: row.include_in_net_worth,
    isArchived: row.is_archived,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

async function queryOne(
  client: PoolClient,
  text: string,
  params: readonly unknown[]
) {
  const result = await client.query<DbAccountRow>(text, params as unknown[])
  return result.rows[0] ? mapAccountRow(result.rows[0]) : null
}

export class AccountsRepository {
  async listByUser(command: ListAccountsCommand) {
    const result = command.includeArchived
      ? await queryDb<DbAccountRow>(listAllAccountsSql, [command.clerkUserId])
      : await queryDb<DbAccountRow>(listAccountsSql, [command.clerkUserId])

    return result.rows.map(mapAccountRow)
  }

  async findByName(clerkUserId: string, name: string) {
    const result = await queryDb<DbAccountRow>(findAccountByNameSql, [clerkUserId, name])

    return result.rows[0] ? mapAccountRow(result.rows[0]) : null
  }

  async findById(clerkUserId: string, accountId: string) {
    const result = await queryDb<DbAccountRow>(findAccountByIdSql, [clerkUserId, accountId])

    return result.rows[0] ? mapAccountRow(result.rows[0]) : null
  }

  async create(command: CreateAccountCommand): Promise<CreateAccountResult> {
    return withTransaction(async (client) => {
      const existingByRequest = await queryOne(client, findAccountByClientRequestSql, [
        command.clerkUserId,
        command.clientRequestId,
      ])

      if (existingByRequest) {
        return {
          account: existingByRequest,
          created: false,
        }
      }

      const inserted = await client.query<DbAccountRow>(insertAccountSql, [
        command.clerkUserId,
        command.clientRequestId,
        command.name,
        command.type,
        command.currencyCode,
        command.initialBalanceCents,
        command.initialBalanceCents,
        command.includeInNetWorth,
        command.displayOrder,
      ])

      const account = mapAccountRow(inserted.rows[0])

      await client.query(insertAuditLogSql, [
        command.clerkUserId,
        "user",
        "account.created",
        "accounts",
        account.id,
        null,
        JSON.stringify(account),
        command.clientRequestId,
        command.clientRequestId,
      ])

      return {
        account,
        created: true,
      }
    })
  }

  async archive(command: ArchiveAccountCommand) {
    return withTransaction(async (client) => {
      const existingAccount = await queryOne(client, findAccountByIdSql, [
        command.clerkUserId,
        command.accountId,
      ])

      if (!existingAccount) {
        return null
      }

      const archived = await client.query<DbAccountRow>(archiveAccountSql, [
        command.clerkUserId,
        command.accountId,
      ])

      const account = archived.rows[0] ? mapAccountRow(archived.rows[0]) : existingAccount

      await client.query(insertAuditLogSql, [
        command.clerkUserId,
        "user",
        "account.archived",
        "accounts",
        command.accountId,
        JSON.stringify(existingAccount),
        JSON.stringify(account),
        null,
        null,
      ])

      return archived.rows[0] ? account : existingAccount
    })
  }

  async update(command: UpdateAccountCommand) {
    return withTransaction(async (client) => {
      const existingAccount = await queryOne(client, findAccountByIdSql, [
        command.clerkUserId,
        command.accountId,
      ])

      if (!existingAccount) {
        return null
      }

      const updated = await client.query<DbAccountRow>(updateAccountSql, [
        command.clerkUserId,
        command.accountId,
        command.name,
        command.type,
        command.initialBalanceCents,
        command.includeInNetWorth,
      ])

      const account = updated.rows[0] ? mapAccountRow(updated.rows[0]) : existingAccount

      await client.query(insertAuditLogSql, [
        command.clerkUserId,
        "user",
        "account.updated",
        "accounts",
        command.accountId,
        JSON.stringify(existingAccount),
        JSON.stringify(account),
        null,
        null,
      ])

      return updated.rows[0] ? account : existingAccount
    })
  }
}
