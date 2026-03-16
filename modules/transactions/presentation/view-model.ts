import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

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
      title: expense.title,
      category: expense.category,
      cardName: expense.cardName,
      dateLabel: format(new Date(`${expense.occurredOn}T00:00:00`), "dd MMM", { locale: ptBR }),
      amountCents: expense.amountCents,
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

export function buildTransactionAccountOptions(accounts: AccountRecord[]): TransactionAccountOption[] {
  return accounts.map((account) => ({
    id: account.id,
    label: `${account.name} • ${account.institution}`,
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
      label: `${card.nickname} • ${card.finalDigits}`,
    }))
}

export function buildTransactionsPageData(
  transactions: TransactionListRecord[],
  invoiceExpenses: CreditCardInvoiceExpenseRecord[],
  options?: {
    selectedDate?: string
  }
): TransactionsPageData {
  const getEffectiveAmount = (transaction: TransactionListRecord) =>
    transaction.settledAmountCents ?? transaction.amountCents

  const getSignedAmount = (transaction: TransactionListRecord) =>
    transaction.kind === "income" ? getEffectiveAmount(transaction) : -getEffectiveAmount(transaction)

  const compensatedIncomeCents = transactions
    .filter((transaction) => transaction.kind === "income" && transaction.status === "compensated")
    .reduce((sum, transaction) => sum + getEffectiveAmount(transaction), 0)

  const compensatedExpenseCents = transactions
    .filter((transaction) => transaction.kind === "expense" && transaction.status === "compensated")
    .reduce((sum, transaction) => sum + getEffectiveAmount(transaction), 0)

  const pendingAmountCents = transactions
    .filter((transaction) => transaction.status !== "compensated")
    .reduce((sum, transaction) => sum + transaction.amountCents, 0)

  const projectedBalanceCents = transactions.reduce(
    (sum, transaction) => sum + getSignedAmount(transaction),
    0
  )

  const selectedDate = options?.selectedDate ?? transactions[0]?.occurredOn ?? format(new Date(), "yyyy-MM-dd")
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
        detail: "Receitas compensadas no período",
        tone: "income",
      },
      {
        label: "Saídas",
        valueCents: compensatedExpenseCents,
        detail: "Pagamentos já refletidos no saldo",
        tone: "expense",
      },
      {
        label: "Pendente",
        valueCents: pendingAmountCents,
        detail: "Lançamentos ainda não compensados",
        tone: "neutral",
      },
      {
        label: "Saldo líquido",
        valueCents: compensatedIncomeCents - compensatedExpenseCents,
        detail: "Resultado líquido do que já foi compensado",
        tone: compensatedIncomeCents - compensatedExpenseCents >= 0 ? "income" : "expense",
      },
      {
        label: "Saldo previsto",
        valueCents: projectedBalanceCents,
        detail: "Inclui lançamentos pendentes e agendados do período",
        tone: projectedBalanceCents >= 0 ? "income" : "expense",
      },
    ],
    transactions: transactions.map((transaction) => ({
      id: transaction.id,
      title: transaction.title,
      category: transaction.category,
      sourceType: transaction.sourceType,
      isFixed: transaction.isFixed,
      fixedExpenseFrequency: transaction.fixedExpenseFrequency,
      installmentNumber: transaction.installmentNumber,
      installmentTotal: transaction.installmentTotal,
      accountName: transaction.accountName,
      accountInstitution: transaction.accountInstitution,
      dateLabel: format(new Date(`${transaction.occurredOn}T00:00:00`), "dd MMM", { locale: ptBR }),
      amountCents: transaction.amountCents,
      settledAmountCents: transaction.settledAmountCents,
      displayAmountCents: getEffectiveAmount(transaction),
      isAmountOverridden:
        transaction.settledAmountCents !== null &&
        transaction.settledAmountCents !== undefined &&
        transaction.settledAmountCents !== transaction.amountCents,
      seriesId: transaction.seriesId,
      supportsFutureRemoval: transaction.seriesId !== null && transaction.seriesId !== undefined,
      status: transaction.status,
      statusLabel: getStatusLabel(transaction.status),
      kind: transaction.kind,
    })),
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
