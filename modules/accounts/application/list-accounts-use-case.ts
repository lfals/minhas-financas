import "server-only"

import { AccountsRepository } from "@/modules/accounts/infrastructure/accounts-repository"
import { listAccountsQuerySchema } from "@/schemas/accounts.schemas"

const repository = new AccountsRepository()

export async function listAccountsUseCase(input: {
  clerkUserId: string
  includeArchived?: boolean
}) {
  const parsed = listAccountsQuerySchema.parse({
    includeArchived: input.includeArchived,
  })

  return repository.listByUser({
    clerkUserId: input.clerkUserId,
    includeArchived: parsed.includeArchived,
  })
}
