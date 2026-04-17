import "server-only"

import { randomUUID } from "node:crypto"

import { queryDb } from "@/lib/db/pool"
import { withTransaction } from "@/lib/db/tx"
import { NotFoundAppError, ValidationAppError } from "@/lib/errors/app-error"
import type { DatabaseClient } from "@/lib/db/types"
import type {
  CreditCardInvoiceExpenseRecord,
  CreateCreditCardExpenseCommand,
  RemoveCreditCardExpenseCommand,
  SettleCreditCardExpenseCommand,
  ChangeCreditCardExpenseCardCommand,
  UpdateCreditCardExpenseCommand,
  CreateTransactionCommand,
  CreateTransactionResult,
  ReopenTransactionCommand,
  RemoveTransactionCommand,
  TransactionCategoryRecord,
  SettleTransactionCommand,
  UpdateTransactionCommand,
  TransactionListCommand,
  TransactionListRecord,
  TransactionsListResult,
  TransactionRecord,
} from "@/modules/transactions/domain/types"
import {
  compensateTransactionSql,
  deleteCreditCardInvoiceSettlementAdjustmentsSql,
  deleteCreditCardExpenseSql,
  deleteFutureCreditCardExpensesBySeriesSql,
  deleteFutureTransactionsBySeriesSql,
  deleteTransactionSql,
  findAccountForTransactionSql,
  findCreditCardExpenseByClientRequestSql,
  findCreditCardExpenseByIdForUpdateSql,
  findCreditCardForExpenseSql,
  findCreditCardInvoiceByMonthForUpdateSql,
  findTransactionByClientRequestSql,
  findTransactionByIdForUpdateSql,
  insertCreditCardExpenseSql,
  insertTransactionAuditLogSql,
  insertTransactionSql,
  listCreditCardInvoiceExpensesSql,
  listFutureCreditCardExpensesBySeriesForUpdateSql,
  listCreditCardExpensesBySeriesForUpdateSql,
  listFutureTransactionsBySeriesForUpdateSql,
  listTransactionsSql,
  listTransactionCategoriesSql,
  findTransactionCategoryByNormalizedNameSql,
  reopenTransactionSql,
  settleCreditCardExpenseSql,
  upsertTransactionCategorySql,
  updateCreditCardInvoiceTotalsSql,
  updateCreditCardExpenseCardSql,
  updateCreditCardExpenseSql,
  updateAccountBalanceSql,
  updateCreditCardInvoiceSql,
  updateTransactionSql,
} from "@/modules/transactions/infrastructure/transactions-sql"
import {
  creditCardInvoiceExpenseRecordSchema,
  transactionListRecordSchema,
  transactionRecordSchema,
  transactionCategoryRecordSchema,
} from "@/schemas/transactions.schemas"
import { SalariesRepository } from "@/modules/salaries/infrastructure/salaries-repository"

type DbTransactionRow = {
  id: string
  clerk_user_id: string
  account_id: string
  title: string
  category: string
  category_id?: string | null
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
}

type DbAccountBalanceRow = {
  id: string
  clerk_user_id: string
  name: string
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

type DbCreditCardInvoiceExpenseListRow = {
  id: string
  card_id: string
  card_name: string
  invoice_transaction_id: string
  invoice_month: string | null
  series_id: string | null
  title: string
  category: string
  category_id?: string | null
  amount_cents: string
  occurred_on: string
  is_effective: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

type DbTransactionCategoryRow = {
  id: string
  name: string
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
    isFixed: Boolean(row.is_fixed),
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
  })
}

function mapCategoryRow(row: DbTransactionCategoryRow): TransactionCategoryRecord {
  return transactionCategoryRecordSchema.parse({
    id: row.id,
    name: row.name,
  })
}

function mapCreditCardInvoiceExpenseRow(
  row: DbCreditCardInvoiceExpenseListRow
): CreditCardInvoiceExpenseRecord {
  const installmentMatch = row.title.match(/ (\d+)\/(\d+)$/)

  return creditCardInvoiceExpenseRecordSchema.parse({
    id: row.id,
    cardId: row.card_id,
    cardName: row.card_name,
    invoiceTransactionId: row.invoice_transaction_id,
    invoiceMonth: row.invoice_month,
    seriesId: row.series_id,
    title: row.title,
    category: row.category,
    amountCents: row.amount_cents,
    occurredOn: row.occurred_on,
    isEffective: Boolean(row.is_effective),
    installmentNumber: installmentMatch ? Number(installmentMatch[1]) : null,
    installmentTotal: installmentMatch ? Number(installmentMatch[2]) : null,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

function buildCreditCardFixedOccurrences(command: CreateCreditCardExpenseCommand) {
  if (!command.isFixed) {
    return [{ ...command }]
  }

  const [year] = command.occurredOn.split("-").map(Number)
  const startMonthIndex = Number(command.occurredOn.split("-")[1]) - 1
  const occurrences: CreateCreditCardExpenseCommand[] = []

  for (let monthIndex = startMonthIndex; monthIndex < 12; monthIndex += 1) {
    occurrences.push({
      ...command,
      clientRequestId: monthIndex === startMonthIndex ? command.clientRequestId : randomUUID(),
      occurredOn: addMonthsToIsoDate(command.occurredOn, monthIndex - startMonthIndex),
    })
  }

  return occurrences.filter((occurrence) => occurrence.occurredOn.startsWith(`${year}-`))
}

function getNextCreditCardInvoiceEffectiveAmount(
  transaction: TransactionRecord,
  removedAmountCents: number
) {
  const currentEffectiveAmount = transaction.settledAmountCents ?? transaction.amountCents
  const nextEffectiveAmount = currentEffectiveAmount - removedAmountCents

  if (nextEffectiveAmount < 0) {
    throw new ValidationAppError("Não foi possível recalcular o total da fatura após remover o lançamento.")
  }

  return nextEffectiveAmount
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

function buildCreditCardExpenseTitle(
  title: string,
  installmentNumber?: number | null,
  installmentTotal?: number | null
) {
  if (!installmentNumber || !installmentTotal) {
    return title
  }

  return `${title} ${installmentNumber}/${installmentTotal}`
}

async function removeAmountFromCreditCardInvoice(
  client: DatabaseClient,
  clerkUserId: string,
  invoiceTransactionId: string,
  removedAmountCents: number,
  options?: {
    preserveEmptyTransaction?: boolean
  }
) {
  const preserveEmptyTransaction = options?.preserveEmptyTransaction ?? false
  const invoiceTransaction = await queryOne(client, findTransactionByIdForUpdateSql, [
    clerkUserId,
    invoiceTransactionId,
  ])

  if (!invoiceTransaction) {
    throw new NotFoundAppError("Fatura vinculada não encontrada.")
  }

  const currentEffectiveAmount = invoiceTransaction.settledAmountCents ?? invoiceTransaction.amountCents
  const nextAmountCents = invoiceTransaction.amountCents - removedAmountCents

  if (nextAmountCents < 0) {
    throw new ValidationAppError("Não foi possível recalcular o valor da fatura.")
  }

  if (nextAmountCents === 0) {
    if (invoiceTransaction.status === "compensated") {
      const accountResult = await client.query<DbAccountBalanceRow>(findAccountForTransactionSql, [
        clerkUserId,
        invoiceTransaction.accountId,
      ])
      const account = accountResult.rows[0]

      if (!account || account.is_archived) {
        throw new NotFoundAppError("Selecione uma conta válida para o lançamento.")
      }

      await client.query(updateAccountBalanceSql, [
        clerkUserId,
        invoiceTransaction.accountId,
        Number(account.current_balance_cents) + currentEffectiveAmount,
      ])

      await client.query(deleteCreditCardInvoiceSettlementAdjustmentsSql, [
        clerkUserId,
        invoiceTransaction.id,
        CREDIT_CARD_INVOICE_SETTLEMENT_ADJUSTMENT_NOTE,
      ])
    }

    if (preserveEmptyTransaction) {
      return {
        transaction: invoiceTransaction,
        shouldDelete: true,
      }
    }

    await client.query(deleteTransactionSql, [clerkUserId, invoiceTransaction.id])

    await client.query(insertTransactionAuditLogSql, [
      clerkUserId,
      "user",
      "credit_card_invoice.removed",
      "transactions",
      invoiceTransaction.id,
      JSON.stringify(invoiceTransaction),
      null,
      null,
      null,
    ])

    return {
      transaction: invoiceTransaction,
      shouldDelete: false,
    }
  }

  let updatedTransaction: TransactionRecord

  if (invoiceTransaction.status === "compensated") {
    const accountResult = await client.query<DbAccountBalanceRow>(findAccountForTransactionSql, [
      clerkUserId,
      invoiceTransaction.accountId,
    ])
    const account = accountResult.rows[0]

    if (!account || account.is_archived) {
      throw new NotFoundAppError("Selecione uma conta válida para o lançamento.")
    }

    const nextEffectiveAmount = getNextCreditCardInvoiceEffectiveAmount(
      invoiceTransaction,
      removedAmountCents
    )

    const updatedRow = await client.query<DbTransactionRow>(updateCreditCardInvoiceTotalsSql, [
      clerkUserId,
      invoiceTransaction.id,
      nextAmountCents,
      nextEffectiveAmount,
    ])

    if (nextEffectiveAmount === 0) {
      await client.query(reopenTransactionSql, [clerkUserId, invoiceTransaction.id])
    }

    updatedTransaction = mapTransactionRow(updatedRow.rows[0])

    await client.query(updateAccountBalanceSql, [
      clerkUserId,
      invoiceTransaction.accountId,
      Number(account.current_balance_cents) + (currentEffectiveAmount - nextEffectiveAmount),
    ])
  } else {
    const updatedRow = await client.query<DbTransactionRow>(updateCreditCardInvoiceTotalsSql, [
      clerkUserId,
      invoiceTransaction.id,
      nextAmountCents,
      null,
    ])

    updatedTransaction = mapTransactionRow(updatedRow.rows[0])
  }

  await client.query(insertTransactionAuditLogSql, [
    clerkUserId,
    "user",
    "credit_card_invoice.updated",
    "transactions",
    updatedTransaction.id,
    JSON.stringify(invoiceTransaction),
    JSON.stringify(updatedTransaction),
    null,
    null,
  ])

  return {
    transaction: updatedTransaction,
    shouldDelete: false,
  }
}

async function addAmountToCreditCardInvoice(
  client: DatabaseClient,
  clerkUserId: string,
  card: DbCreditCardExpenseRow,
  invoiceMonth: string,
  amountCents: number,
  invoiceCategory: string,
  invoiceCategoryId: string
) {
  const invoiceKey = `${invoiceMonth}-01`
  const invoiceTitle = buildCreditCardInvoiceTitle(card.nickname, invoiceMonth)
  const invoiceDate = buildInvoiceDate(invoiceMonth, card.due_day)

  const existingInvoice = await queryOne(client, findCreditCardInvoiceByMonthForUpdateSql, [
    clerkUserId,
    card.id,
    invoiceKey,
  ])

  if (existingInvoice?.status === "compensated") {
    throw new ValidationAppError("A fatura deste cartão já foi compensada para este mês.")
  }

  if (existingInvoice) {
    const updatedRow = await client.query<DbTransactionRow>(updateCreditCardInvoiceSql, [
      clerkUserId,
      existingInvoice.id,
      card.expense_account_id,
      invoiceTitle,
      invoiceCategory,
      invoiceCategoryId,
      amountCents,
      invoiceDate,
    ])

    const updatedTransaction = mapTransactionRow(updatedRow.rows[0])

    await client.query(insertTransactionAuditLogSql, [
      clerkUserId,
      "user",
      "credit_card_invoice.updated",
      "transactions",
      updatedTransaction.id,
      JSON.stringify(existingInvoice),
      JSON.stringify(updatedTransaction),
      null,
      null,
    ])

    return updatedTransaction
  }

  const inserted = await client.query<DbTransactionRow>(insertTransactionSql, [
    clerkUserId,
    randomUUID(),
    card.expense_account_id,
    invoiceTitle,
    invoiceCategory,
    invoiceCategoryId,
    "expense",
    "pending",
    "credit_card_invoice",
    card.id,
    invoiceKey,
    null,
    false,
    null,
    null,
    null,
    amountCents,
    invoiceDate,
    "",
  ])

  const insertedTransaction = mapTransactionRow(inserted.rows[0])

  await client.query(insertTransactionAuditLogSql, [
    clerkUserId,
    "user",
    "credit_card_invoice.created",
    "transactions",
    insertedTransaction.id,
    null,
    JSON.stringify(insertedTransaction),
    null,
    null,
  ])

  return insertedTransaction
}

async function queryOne(client: DatabaseClient, text: string, params: readonly unknown[]) {
  const result = await client.query<DbTransactionRow>(text, params as unknown[])
  return result.rows[0] ? mapTransactionRow(result.rows[0]) : null
}

async function queryMany(client: DatabaseClient, text: string, params: readonly unknown[]) {
  const result = await client.query<DbTransactionRow>(text, params as unknown[])
  return result.rows.map(mapTransactionRow)
}

async function resolveTransactionCategoryId(
  client: DatabaseClient,
  clerkUserId: string,
  category: string
) {
  const normalizedCategory = category.trim()
  try {
    const result = await client.query<{ id: string }>(upsertTransactionCategorySql, [
      clerkUserId,
      normalizedCategory,
    ])

    if (result.rows[0]) {
      return result.rows[0].id
    }
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
    ) {
      // fallback for rare race condition when two inserts for same normalized category run together
    } else {
      throw error
    }
  }

  const existing = await client.query<{ id: string }>(
    findTransactionCategoryByNormalizedNameSql,
    [clerkUserId, normalizedCategory]
  )

  return existing.rows[0]!.id
}

const CREDIT_CARD_INVOICE_SETTLEMENT_ADJUSTMENT_NOTE = "__credit_card_invoice_settlement_adjustment__"
const salariesRepository = new SalariesRepository()

async function syncCreditCardInvoiceSettlementAdjustment(
  client: DatabaseClient,
  transaction: TransactionRecord,
  adjustedAmountCents: number
) {
  await client.query(deleteCreditCardInvoiceSettlementAdjustmentsSql, [
    transaction.clerkUserId,
    transaction.id,
    CREDIT_CARD_INVOICE_SETTLEMENT_ADJUSTMENT_NOTE,
  ])

  const differenceCents = adjustedAmountCents - transaction.amountCents

  if (differenceCents === 0) {
    return
  }

  const invoiceCategory = "Cartão de crédito"
  const invoiceCategoryId = await resolveTransactionCategoryId(
    client,
    transaction.clerkUserId,
    invoiceCategory
  )

  await client.query(insertCreditCardExpenseSql, [
    transaction.clerkUserId,
    randomUUID(),
    transaction.creditCardId,
    transaction.id,
    null,
    differenceCents > 0 ? "Ajuste" : "Estorno",
    invoiceCategory,
    invoiceCategoryId,
    differenceCents,
    transaction.occurredOn,
    true,
    CREDIT_CARD_INVOICE_SETTLEMENT_ADJUSTMENT_NOTE,
  ])
}

export class TransactionsRepository {
  async listByUser(command: TransactionListCommand): Promise<TransactionsListResult> {
    const [transactionsResult, invoiceExpensesResult] = await Promise.all([
      queryDb<DbTransactionListRow>(listTransactionsSql, [command.clerkUserId]),
      queryDb<DbCreditCardInvoiceExpenseListRow>(listCreditCardInvoiceExpensesSql, [command.clerkUserId]),
    ])

    return {
      transactions: transactionsResult.rows.map(mapTransactionListRow),
      invoiceExpenses: invoiceExpensesResult.rows.map(mapCreditCardInvoiceExpenseRow),
    }
  }

  async listCategories(clerkUserId: string): Promise<TransactionCategoryRecord[]> {
    const result = await queryDb<DbTransactionCategoryRow>(listTransactionCategoriesSql, [clerkUserId])

    return result.rows.map(mapCategoryRow)
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
      const categoryId = await resolveTransactionCategoryId(
        client,
        command.clerkUserId,
        command.category
      )
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
          categoryId,
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

      const occurrences =
        command.installmentNumber != null && command.installmentTotal != null
          ? buildCreditCardInstallmentOccurrences(command)
          : buildCreditCardFixedOccurrences(command)
      const shouldCreateSeries =
        command.isFixed || (command.installmentNumber != null && command.installmentTotal != null)
      const seriesId = shouldCreateSeries ? randomUUID() : null
      let firstInvoiceTransaction: TransactionRecord | null = null
      const categoryId = await resolveTransactionCategoryId(
        client,
        command.clerkUserId,
        command.category
      )
      const invoiceCategory = "Cartão de crédito"
      const invoiceCategoryId = await resolveTransactionCategoryId(
        client,
        command.clerkUserId,
        invoiceCategory
      )

      for (let occurrenceIndex = 0; occurrenceIndex < occurrences.length; occurrenceIndex += 1) {
        const occurrence = occurrences[occurrenceIndex]
        const competenceMonth = getCreditCardInvoiceCompetenceMonth(occurrence.occurredOn, card.closing_day)
        const invoiceMonth =
          command.targetInvoiceMonth
            ? addMonthsToIsoDate(`${command.targetInvoiceMonth}-01`, occurrenceIndex).slice(0, 7)
            : getCreditCardInvoiceMonth(competenceMonth, card.closing_day, card.due_day)
        const invoiceDate = buildInvoiceDate(invoiceMonth, card.due_day)
        const invoiceKey = `${invoiceMonth}-01`
        const invoiceTitle = buildCreditCardInvoiceTitle(card.nickname, invoiceMonth)

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
                  invoiceCategoryId,
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
                  invoiceCategoryId,
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
          seriesId,
          occurrence.installmentTotal
            ? `${command.title} ${occurrence.installmentNumber}/${occurrence.installmentTotal}`
            : command.title,
          command.category,
          categoryId,
          occurrence.amountCents,
          occurrence.occurredOn,
          !command.isFixed,
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
    const result = await queryDb<DbTransactionRow>(findTransactionByIdForUpdateSql, [
      clerkUserId,
      transactionId,
    ])

    return result.rows[0] ? mapTransactionRow(result.rows[0]) : null
  }

  async findCreditCardExpenseById(clerkUserId: string, expenseId: string) {
    const result = await queryDb<DbCreditCardInvoiceExpenseListRow>(
      findCreditCardExpenseByIdForUpdateSql,
      [clerkUserId, expenseId]
    )

    return result.rows[0] ? mapCreditCardInvoiceExpenseRow(result.rows[0]) : null
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

      const effectiveAmountCents = command.amountCents ?? existingTransaction.amountCents

      if (effectiveAmountCents < 0) {
        throw new ValidationAppError("O valor efetivado não pode ser negativo.")
      }

      if (existingTransaction.sourceType === "credit_card_invoice") {
        if (!existingTransaction.creditCardId) {
          throw new ValidationAppError("A fatura selecionada não está vinculada a um cartão válido.")
        }

        await syncCreditCardInvoiceSettlementAdjustment(client, existingTransaction, effectiveAmountCents)
      }

      const nextBalanceCents =
        existingTransaction.kind === "income"
          ? Number(account.current_balance_cents) + effectiveAmountCents
          : Number(account.current_balance_cents) - effectiveAmountCents

      const updated = await client.query<DbTransactionRow>(compensateTransactionSql, [
        command.clerkUserId,
        command.transactionId,
        effectiveAmountCents,
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

  async update(command: UpdateTransactionCommand) {
    return withTransaction(async (client) => {
      const existingTransaction = await queryOne(client, findTransactionByIdForUpdateSql, [
        command.clerkUserId,
        command.transactionId,
      ])

      if (!existingTransaction) {
        throw new NotFoundAppError("Lançamento não encontrado.")
      }

      if (existingTransaction.sourceType === "credit_card_invoice") {
        throw new ValidationAppError("A fatura consolidada não pode ser editada por este fluxo.")
      }

      const categoryId = await resolveTransactionCategoryId(
        client,
        command.clerkUserId,
        command.category
      )

      const accountIds = new Set([existingTransaction.accountId, command.accountId])
      const accountsById = new Map<string, DbAccountBalanceRow>()

      for (const accountId of accountIds) {
        const accountResult = await client.query<DbAccountBalanceRow>(findAccountForTransactionSql, [
          command.clerkUserId,
          accountId,
        ])
        const account = accountResult.rows[0]

        if (!account || account.is_archived) {
          throw new NotFoundAppError("Selecione uma conta válida para o lançamento.")
        }

        accountsById.set(accountId, account)
      }

      const signedExistingAmount =
        existingTransaction.kind === "income"
          ? existingTransaction.settledAmountCents ?? existingTransaction.amountCents
          : -(existingTransaction.settledAmountCents ?? existingTransaction.amountCents)
      const signedNextAmount =
        command.kind === "income" ? command.amountCents : -command.amountCents
      const balanceDeltasByAccount = new Map<string, number>()

      if (existingTransaction.status === "compensated") {
        balanceDeltasByAccount.set(existingTransaction.accountId, -signedExistingAmount)
      }

      if (command.status === "compensated") {
        balanceDeltasByAccount.set(
          command.accountId,
          (balanceDeltasByAccount.get(command.accountId) ?? 0) + signedNextAmount
        )
      }

      for (const [accountId, delta] of balanceDeltasByAccount.entries()) {
        const account = accountsById.get(accountId)

        if (!account || delta === 0) {
          continue
        }

        await client.query(updateAccountBalanceSql, [
          command.clerkUserId,
          accountId,
          Number(account.current_balance_cents) + delta,
        ])
      }

      const updatedResult = await client.query<DbTransactionRow>(updateTransactionSql, [
        command.clerkUserId,
        command.transactionId,
        command.accountId,
        command.title,
        command.category,
        categoryId,
        command.kind,
        command.status,
        command.amountCents,
        command.status === "compensated" ? command.amountCents : null,
        command.occurredOn,
        command.notes ?? "",
      ])

      const updatedTransaction = mapTransactionRow(updatedResult.rows[0])

      await client.query(insertTransactionAuditLogSql, [
        command.clerkUserId,
        "user",
        "transaction.updated",
        "transactions",
        updatedTransaction.id,
        JSON.stringify(existingTransaction),
        JSON.stringify(updatedTransaction),
        null,
        null,
      ])

      return updatedTransaction
    })
  }

  async reopenTransaction(command: ReopenTransactionCommand) {
    return withTransaction(async (client) => {
      const existingTransaction = await queryOne(client, findTransactionByIdForUpdateSql, [
        command.clerkUserId,
        command.transactionId,
      ])

      if (!existingTransaction) {
        throw new NotFoundAppError("Lançamento não encontrado.")
      }

      if (existingTransaction.status !== "compensated") {
        throw new ValidationAppError("Somente lançamentos compensados podem ser reabertos.")
      }

      const accountResult = await client.query<DbAccountBalanceRow>(findAccountForTransactionSql, [
        command.clerkUserId,
        existingTransaction.accountId,
      ])

      const account = accountResult.rows[0]

      if (!account || account.is_archived) {
        throw new NotFoundAppError("Selecione uma conta válida para o lançamento.")
      }

      const effectiveAmountCents =
        existingTransaction.settledAmountCents ?? existingTransaction.amountCents

      const nextBalanceCents =
        existingTransaction.kind === "income"
          ? Number(account.current_balance_cents) - effectiveAmountCents
          : Number(account.current_balance_cents) + effectiveAmountCents

      const updated = await client.query<DbTransactionRow>(reopenTransactionSql, [
        command.clerkUserId,
        command.transactionId,
      ])

      const transaction = mapTransactionRow(updated.rows[0])

      if (existingTransaction.sourceType === "credit_card_invoice") {
        await client.query(deleteCreditCardInvoiceSettlementAdjustmentsSql, [
          command.clerkUserId,
          command.transactionId,
          CREDIT_CARD_INVOICE_SETTLEMENT_ADJUSTMENT_NOTE,
        ])
      }

      await client.query(updateAccountBalanceSql, [
        command.clerkUserId,
        existingTransaction.accountId,
        nextBalanceCents,
      ])

      await client.query(insertTransactionAuditLogSql, [
        command.clerkUserId,
        "user",
        "transaction.reopened",
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
        if (transaction.category === "Salário") {
          const match = transaction.title.match(/^Salário (\d{2})\/(\d{4})$/)
          if (match) {
            const [, month, year] = match
            const monthYear = `${year}-${month}`
            await salariesRepository.excludeMonth(command.clerkUserId, monthYear, client)
          }
        }

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

  async changeCreditCardExpenseCard(command: ChangeCreditCardExpenseCardCommand) {
    return withTransaction(async (client) => {
      const existingExpenseRow = await client.query<DbCreditCardInvoiceExpenseListRow>(
        findCreditCardExpenseByIdForUpdateSql,
        [command.clerkUserId, command.expenseId]
      )
      const existingExpenseRaw = existingExpenseRow.rows[0]

      if (!existingExpenseRaw) {
        throw new NotFoundAppError("Lançamento não encontrado.")
      }

      const expenses: CreditCardInvoiceExpenseRecord[] = existingExpenseRaw.series_id
        ? (
            await client.query<DbCreditCardInvoiceExpenseListRow>(
              listCreditCardExpensesBySeriesForUpdateSql,
              [command.clerkUserId, existingExpenseRaw.series_id]
            )
          ).rows.map(mapCreditCardInvoiceExpenseRow)
        : [mapCreditCardInvoiceExpenseRow(existingExpenseRaw)]

      const targetCardResult = await client.query<DbCreditCardExpenseRow>(findCreditCardForExpenseSql, [
        command.clerkUserId,
        command.targetCardId,
      ])
      const targetCard = targetCardResult.rows[0]

      if (!targetCard || targetCard.is_archived) {
        throw new NotFoundAppError("Selecione um cartão válido para a despesa.")
      }

      if (expenses.every((expense) => expense.cardId === command.targetCardId)) {
        return expenses
      }

      const invoiceCategory = "Cartão de crédito"
      const invoiceCategoryId = await resolveTransactionCategoryId(
        client,
        command.clerkUserId,
        invoiceCategory
      )

      const removalTotals = new Map<string, number>()
      const invoicesToDelete: TransactionRecord[] = []

      for (const expense of expenses) {
        removalTotals.set(
          expense.invoiceTransactionId,
          (removalTotals.get(expense.invoiceTransactionId) ?? 0) + expense.amountCents
        )
      }

      for (const [invoiceTransactionId, removedAmountCents] of removalTotals.entries()) {
        const result = await removeAmountFromCreditCardInvoice(
          client,
          command.clerkUserId,
          invoiceTransactionId,
          removedAmountCents,
          { preserveEmptyTransaction: true }
        )

        if (result.shouldDelete) {
          invoicesToDelete.push(result.transaction)
        }
      }

      type ExpenseGroup = {
        invoiceMonth: string
        amountCents: number
      }

      const groups = new Map<string, ExpenseGroup>()

      for (const expense of expenses) {
        const competenceMonth = getCreditCardInvoiceCompetenceMonth(expense.occurredOn, targetCard.closing_day)
        const invoiceMonth = getCreditCardInvoiceMonth(
          competenceMonth,
          targetCard.closing_day,
          targetCard.due_day
        )
        const key = `${targetCard.id}:${invoiceMonth}`
        const group = groups.get(key) ?? { invoiceMonth, amountCents: 0 }
        group.amountCents += Math.abs(expense.amountCents)
        groups.set(key, group)
      }

      const invoiceAssignments = new Map<string, TransactionRecord>()

      for (const [key, group] of groups) {
        const invoiceTransaction = await addAmountToCreditCardInvoice(
          client,
          command.clerkUserId,
          targetCard,
          group.invoiceMonth,
          group.amountCents,
          invoiceCategory,
          invoiceCategoryId
        )
        invoiceAssignments.set(key, invoiceTransaction)
      }

      for (const expense of expenses) {
        const competenceMonth = getCreditCardInvoiceCompetenceMonth(expense.occurredOn, targetCard.closing_day)
        const invoiceMonth = getCreditCardInvoiceMonth(
          competenceMonth,
          targetCard.closing_day,
          targetCard.due_day
        )
        const key = `${targetCard.id}:${invoiceMonth}`
        const invoiceTransaction = invoiceAssignments.get(key)

        if (!invoiceTransaction) {
          continue
        }

        await client.query(updateCreditCardExpenseCardSql, [
          command.clerkUserId,
          expense.id,
          targetCard.id,
          invoiceTransaction.id,
        ])
      }

      for (const invoice of invoicesToDelete) {
        await client.query(deleteTransactionSql, [command.clerkUserId, invoice.id])

        await client.query(insertTransactionAuditLogSql, [
          command.clerkUserId,
          "user",
          "credit_card_invoice.removed",
          "transactions",
          invoice.id,
          JSON.stringify(invoice),
          null,
          null,
          null,
        ])
      }

      return expenses
    })
  }

  async updateCreditCardExpense(command: UpdateCreditCardExpenseCommand) {
    return withTransaction(async (client) => {
      const existingExpenseRow = await client.query<DbCreditCardInvoiceExpenseListRow>(
        findCreditCardExpenseByIdForUpdateSql,
        [command.clerkUserId, command.expenseId]
      )
      const existingExpenseRaw = existingExpenseRow.rows[0]

      if (!existingExpenseRaw) {
        throw new NotFoundAppError("Lançamento não encontrado.")
      }

      const existingExpense = mapCreditCardInvoiceExpenseRow(existingExpenseRaw)

      if (existingExpense.notes === CREDIT_CARD_INVOICE_SETTLEMENT_ADJUSTMENT_NOTE) {
        throw new ValidationAppError("Esse lançamento não pode ser editado por este fluxo.")
      }

      const cardResult = await client.query<DbCreditCardExpenseRow>(findCreditCardForExpenseSql, [
        command.clerkUserId,
        existingExpense.cardId,
      ])
      const card = cardResult.rows[0]

      if (!card || card.is_archived) {
        throw new NotFoundAppError("Selecione um cartão válido para a despesa.")
      }

      const categoryId = await resolveTransactionCategoryId(
        client,
        command.clerkUserId,
        command.category
      )

      const previousAmountCents = existingExpense.amountCents
      const nextAmountCents = command.amountCents
      const previousCompetenceMonth = getCreditCardInvoiceCompetenceMonth(existingExpense.occurredOn, card.closing_day)
      const previousInvoiceMonth =
        existingExpense.invoiceMonth?.slice(0, 7) ??
        getCreditCardInvoiceMonth(previousCompetenceMonth, card.closing_day, card.due_day)
      const nextInvoiceMonth = command.targetInvoiceMonth
      const staysOnSameInvoice =
        existingExpense.invoiceTransactionId &&
        previousInvoiceMonth === nextInvoiceMonth
      const nextTitle = buildCreditCardExpenseTitle(
        command.title,
        existingExpense.installmentNumber,
        existingExpense.installmentTotal
      )

      if (staysOnSameInvoice) {
        const invoiceTransaction = await queryOne(client, findTransactionByIdForUpdateSql, [
          command.clerkUserId,
          existingExpense.invoiceTransactionId,
        ])

        if (!invoiceTransaction) {
          throw new NotFoundAppError("Fatura vinculada não encontrada.")
        }

        const amountDelta = nextAmountCents - previousAmountCents

        if (amountDelta !== 0) {
          if (invoiceTransaction.status === "compensated") {
            const accountResult = await client.query<DbAccountBalanceRow>(findAccountForTransactionSql, [
              command.clerkUserId,
              invoiceTransaction.accountId,
            ])
            const account = accountResult.rows[0]

            if (!account || account.is_archived) {
              throw new NotFoundAppError("Selecione uma conta válida para o lançamento.")
            }

            const nextEffectiveAmount =
              (invoiceTransaction.settledAmountCents ?? invoiceTransaction.amountCents) + amountDelta

            if (nextEffectiveAmount < 0) {
              throw new ValidationAppError("Não foi possível recalcular o valor da fatura.")
            }

            await client.query(updateCreditCardInvoiceTotalsSql, [
              command.clerkUserId,
              invoiceTransaction.id,
              invoiceTransaction.amountCents + amountDelta,
              nextEffectiveAmount,
            ])

            await client.query(updateAccountBalanceSql, [
              command.clerkUserId,
              invoiceTransaction.accountId,
              Number(account.current_balance_cents) - amountDelta,
            ])
          } else {
            await client.query(updateCreditCardInvoiceTotalsSql, [
              command.clerkUserId,
              invoiceTransaction.id,
              invoiceTransaction.amountCents + amountDelta,
              null,
            ])
          }
        }

        await client.query(updateCreditCardExpenseSql, [
          command.clerkUserId,
          command.expenseId,
          existingExpense.invoiceTransactionId,
          nextTitle,
          command.category,
          categoryId,
          nextAmountCents,
          command.occurredOn,
          command.notes ?? "",
        ])

        return existingExpense
      }

      const removalResult = await removeAmountFromCreditCardInvoice(
        client,
        command.clerkUserId,
        existingExpense.invoiceTransactionId,
        previousAmountCents,
        { preserveEmptyTransaction: true }
      )

      const invoiceCategory = "Cartão de crédito"
      const invoiceCategoryId = await resolveTransactionCategoryId(
        client,
        command.clerkUserId,
        invoiceCategory
      )
      const nextInvoiceTransaction = await addAmountToCreditCardInvoice(
        client,
        command.clerkUserId,
        card,
        nextInvoiceMonth,
        nextAmountCents,
        invoiceCategory,
        invoiceCategoryId
      )

      await client.query(updateCreditCardExpenseSql, [
        command.clerkUserId,
        command.expenseId,
        nextInvoiceTransaction.id,
        nextTitle,
        command.category,
        categoryId,
        nextAmountCents,
        command.occurredOn,
        command.notes ?? "",
      ])

      if (removalResult.shouldDelete) {
        await client.query(deleteTransactionSql, [command.clerkUserId, removalResult.transaction.id])

        await client.query(insertTransactionAuditLogSql, [
          command.clerkUserId,
          "user",
          "credit_card_invoice.removed",
          "transactions",
          removalResult.transaction.id,
          JSON.stringify(removalResult.transaction),
          null,
          null,
          null,
        ])
      }

      return existingExpense
    })
  }

  async settleCreditCardExpense(command: SettleCreditCardExpenseCommand) {
    return withTransaction(async (client) => {
      const existingExpenseRow = await client.query<DbCreditCardInvoiceExpenseListRow>(
        findCreditCardExpenseByIdForUpdateSql,
        [command.clerkUserId, command.expenseId]
      )
      const existingExpenseRaw = existingExpenseRow.rows[0]

      if (!existingExpenseRaw) {
        throw new NotFoundAppError("Lançamento não encontrado.")
      }

      const existingExpense = mapCreditCardInvoiceExpenseRow(existingExpenseRaw)

      if (existingExpense.isEffective) {
        throw new ValidationAppError("Esse lançamento já foi efetivado na fatura.")
      }

      await client.query(settleCreditCardExpenseSql, [
        command.clerkUserId,
        command.expenseId,
      ])

      return existingExpense
    })
  }

  async removeCreditCardExpense(command: RemoveCreditCardExpenseCommand) {
    return withTransaction(async (client) => {
      const existingExpenseRow = await client.query<DbCreditCardInvoiceExpenseListRow>(
        findCreditCardExpenseByIdForUpdateSql,
        [command.clerkUserId, command.expenseId]
      )
      const existingExpenseRaw = existingExpenseRow.rows[0]

      if (!existingExpenseRaw) {
        throw new NotFoundAppError("Lançamento não encontrado.")
      }

      const existingExpense = mapCreditCardInvoiceExpenseRow(existingExpenseRaw)
      const invoiceTransaction = await queryOne(client, findTransactionByIdForUpdateSql, [
        command.clerkUserId,
        existingExpense.invoiceTransactionId,
      ])

      if (!invoiceTransaction) {
        throw new NotFoundAppError("Fatura vinculada não encontrada.")
      }

      const expensesToRemove =
        command.scope === "future" && existingExpense.seriesId
          ? (
              await client.query<DbCreditCardInvoiceExpenseListRow>(
                listFutureCreditCardExpensesBySeriesForUpdateSql,
                [command.clerkUserId, existingExpense.seriesId, existingExpense.occurredOn]
              )
            ).rows.map(mapCreditCardInvoiceExpenseRow)
          : [existingExpense]

      const removedByInvoice = expensesToRemove.reduce<Map<string, number>>((accumulator, expense) => {
        accumulator.set(
          expense.invoiceTransactionId,
          (accumulator.get(expense.invoiceTransactionId) ?? 0) + expense.amountCents
        )
        return accumulator
      }, new Map())

      if (command.scope === "future" && existingExpense.seriesId) {
        await client.query(deleteFutureCreditCardExpensesBySeriesSql, [
          command.clerkUserId,
          existingExpense.seriesId,
          existingExpense.occurredOn,
        ])
      } else {
        await client.query(deleteCreditCardExpenseSql, [command.clerkUserId, command.expenseId])
      }

      for (const [affectedInvoiceTransactionId, removedInvoiceAmountCents] of removedByInvoice.entries()) {
        const affectedInvoiceTransaction = await queryOne(client, findTransactionByIdForUpdateSql, [
          command.clerkUserId,
          affectedInvoiceTransactionId,
        ])

        if (!affectedInvoiceTransaction) {
          throw new NotFoundAppError("Fatura vinculada não encontrada.")
        }

        const nextAmountCents = affectedInvoiceTransaction.amountCents - removedInvoiceAmountCents

        if (nextAmountCents < 0) {
          throw new ValidationAppError("Não foi possível recalcular o valor da fatura.")
        }

        const shouldDeleteInvoice = nextAmountCents === 0

        if (shouldDeleteInvoice) {
          if (affectedInvoiceTransaction.status === "compensated") {
            const accountResult = await client.query<DbAccountBalanceRow>(findAccountForTransactionSql, [
              command.clerkUserId,
              affectedInvoiceTransaction.accountId,
            ])
            const account = accountResult.rows[0]

            if (!account || account.is_archived) {
              throw new NotFoundAppError("Selecione uma conta válida para o lançamento.")
            }

            const currentEffectiveAmount = affectedInvoiceTransaction.settledAmountCents ?? affectedInvoiceTransaction.amountCents

            await client.query(updateAccountBalanceSql, [
              command.clerkUserId,
              affectedInvoiceTransaction.accountId,
              Number(account.current_balance_cents) + currentEffectiveAmount,
            ])

            await client.query(deleteCreditCardInvoiceSettlementAdjustmentsSql, [
              command.clerkUserId,
              affectedInvoiceTransaction.id,
              CREDIT_CARD_INVOICE_SETTLEMENT_ADJUSTMENT_NOTE,
            ])
          }

          await client.query(deleteTransactionSql, [
            command.clerkUserId,
            affectedInvoiceTransaction.id,
          ])

          continue
        }

        if (affectedInvoiceTransaction.status === "compensated") {
          const accountResult = await client.query<DbAccountBalanceRow>(findAccountForTransactionSql, [
            command.clerkUserId,
            affectedInvoiceTransaction.accountId,
          ])
          const account = accountResult.rows[0]

          if (!account || account.is_archived) {
            throw new NotFoundAppError("Selecione uma conta válida para o lançamento.")
          }

          const currentEffectiveAmount = affectedInvoiceTransaction.settledAmountCents ?? affectedInvoiceTransaction.amountCents
          const nextEffectiveAmount = getNextCreditCardInvoiceEffectiveAmount(
            affectedInvoiceTransaction,
            removedInvoiceAmountCents
          )

          await client.query(updateAccountBalanceSql, [
            command.clerkUserId,
            affectedInvoiceTransaction.accountId,
            Number(account.current_balance_cents) + (currentEffectiveAmount - nextEffectiveAmount),
          ])

          if (nextEffectiveAmount === 0) {
            await client.query(reopenTransactionSql, [
              command.clerkUserId,
              affectedInvoiceTransaction.id,
            ])

            await client.query(updateCreditCardInvoiceTotalsSql, [
              command.clerkUserId,
              affectedInvoiceTransaction.id,
              nextAmountCents,
              null,
            ])
          } else {
            await client.query(updateCreditCardInvoiceTotalsSql, [
              command.clerkUserId,
              affectedInvoiceTransaction.id,
              nextAmountCents,
              nextEffectiveAmount,
            ])
          }
        } else {
          await client.query(updateCreditCardInvoiceTotalsSql, [
            command.clerkUserId,
            affectedInvoiceTransaction.id,
            nextAmountCents,
            null,
          ])
        }
      }

      await client.query(insertTransactionAuditLogSql, [
        command.clerkUserId,
        "user",
        command.scope === "future" ? "credit_card_expense.future_removed" : "credit_card_expense.removed",
        "credit_card_expenses",
        existingExpense.id,
        JSON.stringify(expensesToRemove.length === 1 ? expensesToRemove[0] : expensesToRemove),
        null,
        null,
        null,
      ])

      return expensesToRemove
    })
  }
}
