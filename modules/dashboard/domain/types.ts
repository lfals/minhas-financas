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

export type DashboardData = {
  filter: DashboardFilter
  summary: DashboardSummary
  metrics: DashboardMetric[]
  accounts: DashboardAccountSnapshot[]
  transactions: DashboardTransactionSnapshot[]
  obligations: DashboardObligationSnapshot[]
  categories: DashboardCategorySnapshot[]
}
