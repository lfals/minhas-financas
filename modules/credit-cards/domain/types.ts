import type {
  CreateCreditCardInput,
  CreditCardRecord,
  UpdateCreditCardInput,
} from "@/schemas/credit-cards.schemas"

export type { CreateCreditCardInput, CreditCardRecord, UpdateCreditCardInput }

export type CreateCreditCardCommand = CreateCreditCardInput & {
  clerkUserId: string
}

export type UpdateCreditCardCommand = UpdateCreditCardInput & {
  clerkUserId: string
}

export type ListCreditCardsCommand = {
  clerkUserId: string
}

export type CreditCardPageItem = {
  id: string
  nickname: string
  finalDigits: string
  limitCents: number
  availableLimitCents: number
  closingDay: string
  dueDay: string
  expenseAccountId: string
  expenseAccountLabel: string
  autoCategorizationEnabled: boolean
  createdAtLabel: string
}

export type CreditCardsPageData = {
  cards: CreditCardPageItem[]
  activeCount: number
  totalLimitCents: number
  availableLimitCents: number
}

export type CreateCreditCardResult = {
  card: CreditCardRecord
  created: boolean
}
