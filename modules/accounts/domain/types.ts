import type {
  AccountRecord,
  AccountType,
  ArchiveAccountInput,
  CreateAccountInput,
  ListAccountsQuery,
  UpdateAccountInput,
} from "@/schemas/accounts.schemas"

export type {
  AccountRecord,
  AccountType,
  ArchiveAccountInput,
  CreateAccountInput,
  ListAccountsQuery,
  UpdateAccountInput,
}

export type CreateAccountCommand = CreateAccountInput & {
  clerkUserId: string
}

export type ListAccountsCommand = ListAccountsQuery & {
  clerkUserId: string
}

export type ArchiveAccountCommand = ArchiveAccountInput & {
  clerkUserId: string
}

export type UpdateAccountCommand = UpdateAccountInput & {
  clerkUserId: string
}

export type AccountListItem = {
  id: string
  name: string
  type: AccountType
  typeLabel: string
  balanceCents: number
  initialBalanceCents: number
  includeInNetWorth: boolean
  createdAtLabel: string
  tone: string
}

export type AccountsPageData = {
  accounts: AccountListItem[]
  totalBalanceCents: number
  netWorthBalanceCents: number
  activeCount: number
}

export type CreateAccountResult = {
  account: AccountRecord
  created: boolean
}
