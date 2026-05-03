import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { formatCompactCurrency } from "@/lib/formatters"
import type { AccountRecord } from "@/modules/accounts/domain/types"
import type { CreditCardRecord } from "@/modules/credit-cards/domain/types"
import type {
  CreditCardInvoiceExpenseRecord,
  FixedExpenseFrequency,
  TransactionAccountOption,
  TransactionCategoryRecord,
  TransactionCategoryOption,
  TransactionCategoryBreakdown,
  TransactionCreditCardOption,
  TransactionListRecord,
  TransactionPageItem,
  TransactionTitleSuggestion,
  TransactionsPageData,
} from "@/modules/transactions/domain/types"

function getStatusLabel(status: TransactionListRecord["status"]) {
  if (status === "compensated") return "Compensado"
  if (status === "pending") return null
  return "Agendado"
}

function buildInvoiceExpenses(
  invoiceExpenses: CreditCardInvoiceExpenseRecord[]
): TransactionsPageData["invoiceExpenses"] {
  return invoiceExpenses.reduce<TransactionsPageData["invoiceExpenses"]>((accumulator, expense) => {
    const item = {
      id: expense.id,
      invoiceTransactionId: expense.invoiceTransactionId,
      seriesId: expense.seriesId,
      cardId: expense.cardId,
      title: expense.title,
      category: expense.category,
      cardName: expense.cardName,
      isFixed: expense.isFixed,
      occurredOn: expense.occurredOn,
      invoiceMonth: expense.invoiceMonth?.slice(0, 7) ?? expense.occurredOn.slice(0, 7),
      dateLabel: format(new Date(`${expense.occurredOn}T00:00:00`), "dd MMM", { locale: ptBR }),
      amountCents: expense.amountCents,
      isEffective: expense.isEffective,
      installmentNumber: expense.installmentNumber,
      installmentTotal: expense.installmentTotal,
      supportsFutureRemoval: expense.seriesId !== null && expense.seriesId !== undefined,
      notes: expense.notes,
    }

    if (!accumulator[item.invoiceTransactionId]) {
      accumulator[item.invoiceTransactionId] = []
    }

    accumulator[item.invoiceTransactionId].push(item)

    return accumulator
  }, {})
}

export function getFixedExpenseFrequencyLabel(frequency?: FixedExpenseFrequency | null) {
  if (frequency === "daily") return "Diária"
  if (frequency === "weekly") return "Semanal"
  if (frequency === "fortnightly") return "Quinzenal"
  if (frequency === "monthly") return "Mensal"
  if (frequency === "yearly") return "Anual"
  return null
}

export function getInstallmentLabel(
  installmentNumber?: number | null,
  installmentTotal?: number | null
) {
  if (!installmentNumber || !installmentTotal) {
    return null
  }

  return `${installmentNumber}/${installmentTotal}`
}

function buildCategoryBreakdown(
  transactions: TransactionListRecord[]
): TransactionCategoryBreakdown[] {
  const expenseTotals = new Map<string, number>()

  for (const transaction of transactions) {
    if (transaction.kind !== "expense") {
      continue
    }

    expenseTotals.set(
      transaction.category,
      (expenseTotals.get(transaction.category) ?? 0) + transaction.amountCents
    )
  }

  const totalExpenses = [...expenseTotals.values()].reduce((sum, amount) => sum + amount, 0)

  return [...expenseTotals.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([name, amountCents]) => ({
      id: name,
      name,
      amountCents,
      share: totalExpenses > 0 ? Math.max(4, Math.round((amountCents / totalExpenses) * 100)) : 0,
    }))
}

function getTransactionDisplayGroup(transaction: TransactionListRecord) {
  const isPending = transaction.status !== "compensated"
  const isInvoice = transaction.sourceType === "credit_card_invoice"

  if (transaction.kind === "income" && isPending) return 0
  if (transaction.kind === "expense" && !isInvoice && isPending) return 1
  if (transaction.kind === "expense" && isInvoice && isPending) return 2
  if (transaction.kind === "income" && !isPending) return 3
  if (transaction.kind === "expense" && !isInvoice && !isPending) return 4
  return 5
}

function sortTransactionsForDisplay(transactions: TransactionListRecord[]) {
  return [...transactions].sort((left, right) => {
    const groupDifference =
      getTransactionDisplayGroup(left) - getTransactionDisplayGroup(right)

    if (groupDifference !== 0) {
      return groupDifference
    }

    const occurredOnDifference = left.occurredOn.localeCompare(right.occurredOn)

    if (occurredOnDifference !== 0) {
      return occurredOnDifference
    }

    return left.createdAt.localeCompare(right.createdAt)
  })
}

export function buildTransactionPageItem(
  transaction: TransactionListRecord
): TransactionPageItem {
  const today = format(new Date(), "yyyy-MM-dd")

  return {
    id: transaction.id,
    accountId: transaction.accountId,
    title: transaction.title,
    category: transaction.category,
    sourceType: transaction.sourceType,
    isFixed: transaction.isFixed,
    fixedExpenseFrequency: transaction.fixedExpenseFrequency,
    installmentNumber: transaction.installmentNumber,
    installmentTotal: transaction.installmentTotal,
    occurredOn: transaction.occurredOn,
    accountName: transaction.accountName,
    dateLabel: format(new Date(`${transaction.occurredOn}T00:00:00`), "dd MMM", { locale: ptBR }),
    amountCents: transaction.amountCents,
    settledAmountCents: transaction.settledAmountCents,
    notes: transaction.notes,
    displayAmountCents: transaction.settledAmountCents ?? transaction.amountCents,
    isAmountOverridden:
      transaction.settledAmountCents !== null &&
      transaction.settledAmountCents !== undefined &&
      transaction.settledAmountCents !== transaction.amountCents,
    seriesId: transaction.seriesId,
    supportsFutureRemoval: transaction.seriesId !== null && transaction.seriesId !== undefined,
    status: transaction.status,
    statusLabel: getStatusLabel(transaction.status),
    kind: transaction.kind,
    isOverdue: transaction.status !== "compensated" && transaction.occurredOn < today,
  }
}

export function buildTransactionAccountOptions(accounts: AccountRecord[]): TransactionAccountOption[] {
  return accounts.map((account) => ({
    id: account.id,
    label: account.name,
  }))
}

export function buildTransactionCategoryOptions(
  categories: TransactionCategoryRecord[]
): TransactionCategoryOption[] {
  const categoryMap = new Map<string, string>()

  for (const category of categories) {
    const trimmed = category.name.trim()
    const normalized = trimmed.toLocaleLowerCase("pt-BR")

    if (!normalized || categoryMap.has(normalized)) {
      continue
    }

    categoryMap.set(normalized, trimmed)
  }

  return [...categoryMap.values()]
    .sort((left, right) => left.localeCompare(right, "pt-BR"))
    .map((value) => ({ value }))
}

export function buildTransactionCreditCardOptions(
  cards: CreditCardRecord[]
): TransactionCreditCardOption[] {
  return cards
    .filter((card) => !card.isArchived)
    .map((card) => ({
      id: card.id,
      label: card.finalDigits ? `${card.nickname} • ${card.finalDigits}` : card.nickname,
    }))
}

export function buildTransactionTitleSuggestions(
  transactions: TransactionListRecord[]
): TransactionTitleSuggestion[] {
  const suggestionsMap = new Map<string, { title: string; category: string; occurredOn: string }>()

  // Sort by date descending to get the most recent category for each title
  const sortedTransactions = [...transactions].sort((left, right) =>
    right.occurredOn.localeCompare(left.occurredOn)
  )

  for (const transaction of sortedTransactions) {
    const title = transaction.title.trim()
    const normalizedTitle = title.toLocaleLowerCase("pt-BR")

    if (!normalizedTitle || suggestionsMap.has(normalizedTitle)) {
      continue
    }

    suggestionsMap.set(normalizedTitle, {
      title,
      category: transaction.category,
      occurredOn: transaction.occurredOn,
    })
  }

  return [...suggestionsMap.values()]
    .sort((left, right) => left.title.localeCompare(right.title, "pt-BR"))
    .map(({ title, category }) => ({ title, category }))
}

export function buildTransactionsPageData(
  transactions: TransactionListRecord[],
  invoiceExpenses: CreditCardInvoiceExpenseRecord[],
  options?: {
    selectedDate?: string
    previousTransactions?: TransactionListRecord[]
    totalAccountBalanceCents?: number
  }
): TransactionsPageData {
  const getEffectiveAmount = (transaction: TransactionListRecord) =>
    transaction.settledAmountCents ?? transaction.amountCents

  const getSignedAmount = (transaction: TransactionListRecord) =>
    transaction.kind === "income" ? getEffectiveAmount(transaction) : -getEffectiveAmount(transaction)

  const previousTransactions = options?.previousTransactions ?? []

  const previousPendingProjectedBalanceCents = previousTransactions
    .filter((transaction) => transaction.status !== "compensated")
    .reduce((sum, transaction) => sum + getSignedAmount(transaction), 0)

  const compensatedIncomeCents = transactions
    .filter((transaction) => transaction.kind === "income" && transaction.status === "compensated")
    .reduce((sum, transaction) => sum + getEffectiveAmount(transaction), 0)

  const compensatedExpenseCents = transactions
    .filter((transaction) => transaction.kind === "expense" && transaction.status === "compensated")
    .reduce((sum, transaction) => sum + getEffectiveAmount(transaction), 0)

  const pendingIncomeCents = transactions
    .filter((transaction) => transaction.kind === "income" && transaction.status !== "compensated")
    .reduce((sum, transaction) => sum + transaction.amountCents, 0)

  const pendingExpenseCents = transactions
    .filter((transaction) => transaction.kind === "expense" && transaction.status !== "compensated")
    .reduce((sum, transaction) => sum + transaction.amountCents, 0)

  const projectedPendingBalanceCents = transactions
    .filter((transaction) => transaction.status !== "compensated")
    .reduce((sum, transaction) => sum + getSignedAmount(transaction), 0)

  const totalAccountBalanceCents = options?.totalAccountBalanceCents ?? 0
  const estimatedBalanceCents =
    totalAccountBalanceCents + previousPendingProjectedBalanceCents + projectedPendingBalanceCents

  const sortedTransactions = sortTransactionsForDisplay(transactions)
  const selectedDate = options?.selectedDate ?? format(new Date(), "yyyy-MM-dd")
  const periodLabel = format(new Date(`${selectedDate}T00:00:00`), "MMMM yyyy", { locale: ptBR })

  const weekly = new Map<string, { label: string; incomeCents: number; expenseCents: number }>()

  for (const transaction of transactions) {
    const date = new Date(`${transaction.occurredOn}T00:00:00`)
    const weekIndex = Math.min(3, Math.floor((date.getDate() - 1) / 7))
    const key = `${date.getFullYear()}-${date.getMonth()}-${weekIndex}`

    if (!weekly.has(key)) {
      const weekStart = weekIndex * 7 + 1
      const weekEnd = Math.min(weekStart + 6, 31)
      weekly.set(key, {
        label: `${String(weekStart).padStart(2, "0")}-${String(weekEnd).padStart(2, "0")} ${format(date, "MMM", { locale: ptBR })}`,
        incomeCents: 0,
        expenseCents: 0,
      })
    }

    const current = weekly.get(key)!
    if (transaction.kind === "income") {
      current.incomeCents += getEffectiveAmount(transaction)
    } else {
      current.expenseCents += getEffectiveAmount(transaction)
    }
  }

  return {
    periodLabel: periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1),
    summary: {
      title: "Controle financeiro",
      description:
        "Cadastre lançamentos por conta, acompanhe o que já impactou saldo e mantenha a leitura do caixa organizada em um só lugar.",
    },
    metrics: [
      {
        label: "Entradas",
        valueCents: compensatedIncomeCents,
        detail: `${formatCompactCurrency(pendingIncomeCents / 100)} pendentes`,
        tone: "income",
      },
      {
        label: "Saídas",
        valueCents: compensatedExpenseCents,
        detail: `${formatCompactCurrency(pendingExpenseCents / 100)} pendentes`,
        tone: "expense",
      },
      {
        label: "Saldo atual",
        valueCents: totalAccountBalanceCents,
        detail: "",
        tone: totalAccountBalanceCents >= 0 ? "income" : "expense",
      },
      {
        label: "Saldo previsto",
        valueCents: estimatedBalanceCents,
        detail: "",
        tone: estimatedBalanceCents >= 0 ? "income" : "expense",
      },
    ],
    transactions: sortedTransactions.map((transaction) => {
      const effectiveAmount = getEffectiveAmount(transaction)
      const item = buildTransactionPageItem(transaction)

      return {
        ...item,
        displayAmountCents: effectiveAmount,
        isAmountOverridden:
          transaction.settledAmountCents !== null &&
          transaction.settledAmountCents !== undefined &&
          transaction.settledAmountCents !== effectiveAmount,
      }
    }),
    invoiceExpenses: buildInvoiceExpenses(invoiceExpenses),
    categories: buildCategoryBreakdown(transactions),
    cashflow: [...weekly.entries()].sort((left, right) => left[0].localeCompare(right[0])).map(([id, point]) => ({
      id,
      label: point.label,
      incomeCents: point.incomeCents,
      expenseCents: point.expenseCents,
    })),
  }
}
