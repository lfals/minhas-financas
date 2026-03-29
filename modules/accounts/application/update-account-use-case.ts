import "server-only"

import { ensureAccountDoesNotConflict, ensureAccountExists, ensureAccountIsActive } from "@/modules/accounts/domain/account-rules"
import type { UpdateAccountInput } from "@/modules/accounts/domain/types"
import { AccountsRepository } from "@/modules/accounts/infrastructure/accounts-repository"
import { updateAccountInputSchema } from "@/schemas/accounts.schemas"

const repository = new AccountsRepository()

export async function updateAccountUseCase(input: UpdateAccountInput & { clerkUserId: string }) {
  const parsed = updateAccountInputSchema.parse(input)

  const existingAccount = await repository.findById(input.clerkUserId, parsed.accountId)

  ensureAccountExists(existingAccount)
  ensureAccountIsActive(existingAccount)

  const conflictingAccount = await repository.findByName(input.clerkUserId, parsed.name)

  if (conflictingAccount && conflictingAccount.id !== parsed.accountId) {
    ensureAccountDoesNotConflict(conflictingAccount)
  }

  return repository.update({
    ...parsed,
    clerkUserId: input.clerkUserId,
  })
}
