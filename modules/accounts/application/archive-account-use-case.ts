import "server-only"

import { ConflictAppError, NotFoundAppError } from "@/lib/errors/app-error"
import type { ArchiveAccountInput } from "@/modules/accounts/domain/types"
import { AccountsRepository } from "@/modules/accounts/infrastructure/accounts-repository"
import { archiveAccountInputSchema } from "@/schemas/accounts.schemas"

const repository = new AccountsRepository()

export async function archiveAccountUseCase(input: ArchiveAccountInput & { clerkUserId: string }) {
  const parsed = archiveAccountInputSchema.parse(input)

  const existingAccount = await repository.findById(input.clerkUserId, parsed.accountId)

  if (!existingAccount) {
    throw new NotFoundAppError("Conta não encontrada.")
  }

  if (existingAccount.isArchived) {
    throw new ConflictAppError("Essa conta já foi removida.")
  }

  return repository.archive({
    clerkUserId: input.clerkUserId,
    accountId: parsed.accountId,
  })
}
