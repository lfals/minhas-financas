import type {
  CreateTransactionFormInput,
  CreateTransactionInput,
  TransactionKind,
  TransactionListRecord,
  TransactionRecord,
  TransactionStatus,
} from "@/schemas/transactions.schemas"

export type {
  CreateTransactionFormInput,
  CreateTransactionInput,
  TransactionKind,
  TransactionListRecord,
  TransactionRecord,
  TransactionStatus,
}

export type CreateTransactionCommand = CreateTransactionInput & {
  clerkUserId: string
}

export type TransactionListCommand = {
  clerkUserId: string
}

export type TransactionMetric = {
  label: string
  valueCents: number
  detail: string
  tone: "income" | "expense" | "neutral"
}

export type TransactionPageItem = {
  id: string
  title: string
  category: string
  accountName: string
  accountInstitution: string
  dateLabel: string
  amountCents: number
  statusLabel: "Compensado" | "Pendente" | "Agendado"
  kind: TransactionKind
}

export type TransactionCategoryBreakdown = {
  id: string
  name: string
  amountCents: number
  share: number
}

export type CashflowPoint = {
  id: string
  label: string
  incomeCents: number
  expenseCents: number
}

export type TransactionAccountOption = {
  id: string
  label: string
}

export type TransactionsPageData = {
  periodLabel: string
  summary: {
    title: string
    description: string
  }
  metrics: TransactionMetric[]
  transactions: TransactionPageItem[]
  categories: TransactionCategoryBreakdown[]
  cashflow: CashflowPoint[]
}

export type CreateTransactionResult = {
  transaction: TransactionRecord
  created: boolean
}
