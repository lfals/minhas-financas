import { endOfMonth, format, isAfter, isBefore, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

import { getAccountTone, getAccountTypeLabel } from "@/modules/accounts/domain/account-rules"
import type { AccountRecord } from "@/modules/accounts/domain/types"
import type { DashboardData, DashboardFilter, DashboardFilterMode } from "@/modules/dashboard/domain/types"
import type { TransactionListRecord } from "@/modules/transactions/domain/types"

type DashboardSearchParams = {
  mode?: string | string[]
  month?: string | string[]
  startDate?: string | string[]
  endDate?: string | string[]
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const ISO_MONTH_PATTERN = /^\d{4}-\d{2}$/

function getSingleValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

function getTodayIsoDate() {
  return format(new Date(), "yyyy-MM-dd")
}

function getMonthStart(month: string) {
  return `${month}-01`
}

function getMonthEnd(month: string) {
  return format(endOfMonth(parseISO(`${month}-01`)), "yyyy-MM-dd")
}

function isIsoMonth(value?: string) {
  if (!value || !ISO_MONTH_PATTERN.test(value)) {
    return false
  }

  const parsed = parseISO(`${value}-01`)
  return !Number.isNaN(parsed.getTime())
}

function isIsoDate(value?: string) {
  if (!value || !ISO_DATE_PATTERN.test(value)) {
    return false
  }

  const parsed = parseISO(value)
  return !Number.isNaN(parsed.getTime())
}

function formatPeriodLabel(mode: DashboardFilterMode, startDate: string, endDate: string) {
  if (mode === "month") {
    const monthLabel = format(parseISO(startDate), "MMMM yyyy", { locale: ptBR })
    return monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)
  }

  const start = parseISO(startDate)
  const end = parseISO(endDate)
  const sameYear = format(start, "yyyy") === format(end, "yyyy")

  if (startDate === endDate) {
    return format(start, "dd MMM yyyy", { locale: ptBR })
  }

  if (sameYear) {
    return `${format(start, "dd MMM", { locale: ptBR })} - ${format(end, "dd MMM yyyy", { locale: ptBR })}`
  }

  return `${format(start, "dd MMM yyyy", { locale: ptBR })} - ${format(end, "dd MMM yyyy", { locale: ptBR })}`
}

export function normalizeDashboardFilter(searchParams?: DashboardSearchParams): DashboardFilter {
  const today = getTodayIsoDate()
  const defaultMonth = today.slice(0, 7)
  const rawMode = getSingleValue(searchParams?.mode)
  const rawMonth = getSingleValue(searchParams?.month)
  const rawStartDate = getSingleValue(searchParams?.startDate)
  const rawEndDate = getSingleValue(searchParams?.endDate)
  const hasValidCustomRange =
    rawMode === "custom" &&
    typeof rawStartDate === "string" &&
    typeof rawEndDate === "string" &&
    isIsoDate(rawStartDate) &&
    isIsoDate(rawEndDate) &&
    !isAfter(parseISO(rawStartDate), parseISO(rawEndDate))

  if (hasValidCustomRange) {
    const startDate = rawStartDate
    const endDate = rawEndDate

    return {
      mode: "custom",
      month: startDate.slice(0, 7),
      startDate,
      endDate,
      periodLabel: formatPeriodLabel("custom", startDate, endDate),
    }
  }

  const month = rawMonth && isIsoMonth(rawMonth) ? rawMonth : defaultMonth
  const startDate = getMonthStart(month)
  const endDate = getMonthEnd(month)

  return {
    mode: "month",
    month,
    startDate,
    endDate,
    periodLabel: formatPeriodLabel("month", startDate, endDate),
  }
}

function getEffectiveAmount(transaction: TransactionListRecord) {
  return transaction.settledAmountCents ?? transaction.amountCents
}

function getSignedAmount(transaction: TransactionListRecord) {
  const effectiveAmount = getEffectiveAmount(transaction)
  return transaction.kind === "income" ? effectiveAmount : -effectiveAmount
}

function buildCategoryBreakdown(transactions: TransactionListRecord[]) {
  const totals = new Map<string, number>()

  for (const transaction of transactions) {
    if (transaction.kind !== "expense") {
      continue
    }

    totals.set(transaction.category, (totals.get(transaction.category) ?? 0) + getEffectiveAmount(transaction))
  }

  const totalExpenses = [...totals.values()].reduce((sum, amount) => sum + amount, 0)

  return [...totals.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([name, amountCents]) => ({
      id: name,
      name,
      amountCents,
      share: totalExpenses > 0 ? Math.max(4, Math.round((amountCents / totalExpenses) * 100)) : 0,
    }))
}

function buildObligationStatus(transaction: TransactionListRecord) {
  if (transaction.sourceType === "credit_card_invoice") {
    return transaction.status === "scheduled" ? "Fatura agendada" : "Fatura em aberto"
  }

  if (transaction.status === "scheduled") {
    return "Agendado"
  }

  return "Pendente"
}

export function buildDashboardData({
  accounts,
  transactions,
  filter,
}: {
  accounts: AccountRecord[]
  transactions: TransactionListRecord[]
  filter: DashboardFilter
}): Omit<DashboardData, "rawTransactions" | "rawInvoiceExpenses"> {
  const start = parseISO(filter.startDate)
  const end = parseISO(filter.endDate)

  const transactionsInPeriod = transactions.filter((transaction) => {
    const occurredOn = parseISO(transaction.occurredOn)
    return !isBefore(occurredOn, start) && !isAfter(occurredOn, end)
  })

  const pendingTransactionsThroughEnd = transactions.filter((transaction) => {
    if (transaction.status === "compensated") {
      return false
    }

    return transaction.occurredOn <= filter.endDate
  })

  const totalBalanceCents = accounts.reduce((sum, account) => sum + account.currentBalanceCents, 0)
  const netWorthBalanceCents = accounts
    .filter((account) => account.includeInNetWorth)
    .reduce((sum, account) => sum + account.currentBalanceCents, 0)

  const compensatedIncomeCents = transactionsInPeriod
    .filter((transaction) => transaction.kind === "income" && transaction.status === "compensated")
    .reduce((sum, transaction) => sum + getEffectiveAmount(transaction), 0)

  const compensatedExpenseCents = transactionsInPeriod
    .filter((transaction) => transaction.kind === "expense" && transaction.status === "compensated")
    .reduce((sum, transaction) => sum + getEffectiveAmount(transaction), 0)

  const pendingAmountCents = transactionsInPeriod
    .filter((transaction) => transaction.status !== "compensated")
    .reduce((sum, transaction) => sum + transaction.amountCents, 0)

  const projectedBalanceCents =
    totalBalanceCents +
    pendingTransactionsThroughEnd.reduce((sum, transaction) => sum + getSignedAmount(transaction), 0)

  const accountsSnapshot = accounts
    .map((account) => ({
      id: account.id,
      name: account.name,
      typeLabel: getAccountTypeLabel(account.type),
      balanceCents: account.currentBalanceCents,
      initialBalanceCents: account.initialBalanceCents,
      tone: getAccountTone(account.type),
      includeInNetWorth: account.includeInNetWorth,
    }))
    .sort((left, right) => right.balanceCents - left.balanceCents)

  const transactionsSnapshot = [...transactionsInPeriod]
    .sort((left, right) => {
      const occurredDifference = right.occurredOn.localeCompare(left.occurredOn)

      if (occurredDifference !== 0) {
        return occurredDifference
      }

      return right.createdAt.localeCompare(left.createdAt)
    })
    .slice(0, 6)
    .map((transaction) => ({
      id: transaction.id,
      title: transaction.title,
      category: transaction.category,
      dateLabel: format(parseISO(transaction.occurredOn), "dd MMM", { locale: ptBR }),
      amountCents: getEffectiveAmount(transaction),
      kind: transaction.kind,
    }))

  const obligations = transactionsInPeriod
    .filter((transaction) => transaction.kind === "expense" && transaction.status !== "compensated")
    .sort((left, right) => {
      const occurredDifference = left.occurredOn.localeCompare(right.occurredOn)

      if (occurredDifference !== 0) {
        return occurredDifference
      }

      return left.createdAt.localeCompare(right.createdAt)
    })
    .slice(0, 6)
    .map((transaction) => ({
      id: transaction.id,
      title: transaction.title,
      dueLabel: format(parseISO(transaction.occurredOn), "dd MMM", { locale: ptBR }),
      amountCents: transaction.amountCents,
      statusLabel: buildObligationStatus(transaction),
    }))

  return {
    filter,
    summary: {
      totalBalanceCents,
      netWorthBalanceCents,
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
        label: "Pendências",
        valueCents: pendingAmountCents,
        detail: "Lançamentos ainda não compensados no período",
        tone: "neutral",
      },
      {
        label: "Saldo atual",
        valueCents: totalBalanceCents,
        detail: "Saldo consolidado de todas as contas",
        tone: totalBalanceCents >= 0 ? "income" : "expense",
      },
      {
        label: "Saldo previsto",
        valueCents: projectedBalanceCents,
        detail: "Saldo atual mais impacto líquido das pendências até o fim do período",
        tone: projectedBalanceCents >= 0 ? "income" : "expense",
      },
    ],
    accounts: accountsSnapshot,
    transactions: transactionsSnapshot,
    obligations,
    categories: buildCategoryBreakdown(transactionsInPeriod),
  }
}
