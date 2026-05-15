export type DashboardFilterMode = "month" | "custom"

export type DashboardFilter = {
  mode: DashboardFilterMode
  month: string
  startDate: string
  endDate: string
  periodLabel: string
}

export type DashboardMetric = {
  label: string
  valueCents: number
  detail: string
  tone: "income" | "expense" | "neutral"
}

export type DashboardAccountSnapshot = {
  id: string
  name: string
  typeLabel: string
  balanceCents: number
  initialBalanceCents: number
  tone: string
  includeInNetWorth: boolean
}

export type DashboardTransactionSnapshot = {
  id: string
  title: string
  category: string
  dateLabel: string
  amountCents: number
  kind: "income" | "expense"
}

export type DashboardObligationSnapshot = {
  id: string
  title: string
  dueLabel: string
  amountCents: number
  statusLabel: string
}

export type DashboardCategorySnapshot = {
  id: string
  name: string
  amountCents: number
  share: number
}

export type DashboardSummary = {
  totalBalanceCents: number
  netWorthBalanceCents: number
}

/** Um dia no mês selecionado (foco em mês cheio): saldo previsto acumulado e pendências do dia. */
export type DashboardMonthDayForecastPoint = {
  dateIso: string
  /** Rótulo curto no eixo (ex.: "5"). */
  dayLabel: string
  balanceCents: number
  /** Entradas pendentes (não compensadas) com vencimento neste dia. */
  pendingIncomeCents: number
  /** Saídas pendentes (não compensadas) com vencimento neste dia. */
  pendingExpenseCents: number
}

export type DashboardData = {
  filter: DashboardFilter
  summary: DashboardSummary
  metrics: DashboardMetric[]
  accounts: DashboardAccountSnapshot[]
  transactions: DashboardTransactionSnapshot[]
  obligations: DashboardObligationSnapshot[]
  categories: DashboardCategorySnapshot[]
  /** Série diária do mês calendário; `null` fora do modo mês cheio. */
  monthDailyForecast: DashboardMonthDayForecastPoint[] | null
  rawTransactions: import("@/modules/transactions/domain/types").TransactionListRecord[]
  rawInvoiceExpenses: import("@/modules/transactions/domain/types").CreditCardInvoiceExpenseRecord[]
}
