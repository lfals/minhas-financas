import type {
  CreateTransactionFormInput,
  CreateCreditCardExpenseInput,
  CreditCardInvoiceExpenseRecord,
  CreateTransactionInput,
  FixedExpenseFrequency,
  InstallmentAmountInputMode,
  RemoveTransactionInput,
  RemoveTransactionScope,
  SettleTransactionInput,
  TransactionFormKind,
  TransactionKind,
  TransactionListRecord,
  TransactionRecord,
  TransactionSourceType,
  TransactionStatus,
} from "@/schemas/transactions.schemas"

export type {
  CreateTransactionFormInput,
  CreateCreditCardExpenseInput,
  CreditCardInvoiceExpenseRecord,
  CreateTransactionInput,
  FixedExpenseFrequency,
  InstallmentAmountInputMode,
  RemoveTransactionInput,
  RemoveTransactionScope,
  SettleTransactionInput,
  TransactionFormKind,
  TransactionKind,
  TransactionListRecord,
  TransactionRecord,
  TransactionSourceType,
  TransactionStatus,
}

export type CreateTransactionCommand = CreateTransactionInput & {
  clerkUserId: string
  seriesId?: string | null
}

export type CreateCreditCardExpenseCommand = CreateCreditCardExpenseInput & {
  clerkUserId: string
}

export type TransactionListCommand = {
  clerkUserId: string
}

export type SettleTransactionCommand = SettleTransactionInput & {
  clerkUserId: string
  amountCents?: number
}

export type RemoveTransactionCommand = RemoveTransactionInput & {
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
  sourceType: TransactionSourceType
  isFixed: boolean
  fixedExpenseFrequency?: FixedExpenseFrequency | null
  installmentNumber?: number | null
  installmentTotal?: number | null
  accountName: string
  accountInstitution: string
  dateLabel: string
  amountCents: number
  settledAmountCents?: number | null
  displayAmountCents: number
  isAmountOverridden: boolean
  seriesId?: string | null
  supportsFutureRemoval: boolean
  status: TransactionStatus
  statusLabel: "Compensado" | "Pendente" | "Agendado"
  kind: TransactionKind
}

export type CreditCardInvoiceExpensePageItem = {
  id: string
  invoiceTransactionId: string
  title: string
  category: string
  cardName: string
  dateLabel: string
  amountCents: number
  notes?: string | null
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

export type TransactionCategoryOption = {
  value: string
}

export type TransactionCreditCardOption = {
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
  invoiceExpenses: Record<string, CreditCardInvoiceExpensePageItem[]>
  categories: TransactionCategoryBreakdown[]
  cashflow: CashflowPoint[]
}

export type CreateTransactionResult = {
  transaction: TransactionRecord
  created: boolean
}

export type TransactionsListResult = {
  transactions: TransactionListRecord[]
  invoiceExpenses: CreditCardInvoiceExpenseRecord[]
}
