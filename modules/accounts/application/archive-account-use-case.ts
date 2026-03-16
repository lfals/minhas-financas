import "server-only"

import { ensureAccountExists, ensureAccountIsActive } from "@/modules/accounts/domain/account-rules"
import type { ArchiveAccountInput } from "@/modules/accounts/domain/types"
import { AccountsRepository } from "@/modules/accounts/infrastructure/accounts-repository"
import { archiveAccountInputSchema } from "@/schemas/accounts.schemas"

const repository = new AccountsRepository()

export async function archiveAccountUseCase(input: ArchiveAccountInput & { clerkUserId: string }) {
  const parsed = archiveAccountInputSchema.parse(input)

  const existingAccount = await repository.findById(input.clerkUserId, parsed.accountId)

  ensureAccountExists(existingAccount)
  ensureAccountIsActive(existingAccount)

  return repository.archive({
    clerkUserId: input.clerkUserId,
    accountId: parsed.accountId,
  })
}
