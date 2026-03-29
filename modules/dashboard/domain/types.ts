export type Metric = {
  label: string
  value: number
  deltaLabel: string
  trend: "up" | "down" | "neutral"
}

export type AccountSnapshot = {
  id: string
  name: string
  type: string
  balance: number
  tone: string
}

export type TransactionSnapshot = {
  id: string
  title: string
  category: string
  dateLabel: string
  amount: number
  kind: "income" | "expense"
}

export type ObligationSnapshot = {
  id: string
  title: string
  dueLabel: string
  amount: number
  status: string
}

export type BudgetCategory = {
  id: string
  name: string
  share: number
  amount: number
}

export type InvestmentSnapshot = {
  id: string
  name: string
  allocation: number
  result: number
}

export type DashboardSnapshot = {
  periodLabel: string
  totalBalance: number
  netWorth: number
  monthlyYield: number
  currentInvoice: number
}

export type DashboardData = {
  snapshot: DashboardSnapshot
  metrics: Metric[]
  accounts: AccountSnapshot[]
  transactions: TransactionSnapshot[]
  obligations: ObligationSnapshot[]
  categories: BudgetCategory[]
  investments: InvestmentSnapshot[]
}
