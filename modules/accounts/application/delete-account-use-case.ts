import "server-only"

import { ensureAccountExists } from "@/modules/accounts/domain/account-rules"
import type { DeleteAccountCommand } from "@/modules/accounts/domain/types"
import { AccountsRepository } from "@/modules/accounts/infrastructure/accounts-repository"
import { deleteAccountInputSchema } from "@/schemas/accounts.schemas"
import { ValidationAppError } from "@/lib/errors/app-error"

const repository = new AccountsRepository()

export async function deleteAccountUseCase(input: DeleteAccountCommand) {
  const parsed = deleteAccountInputSchema.parse(input)

  const existingAccount = await repository.findById(input.clerkUserId, parsed.accountId)

  ensureAccountExists(existingAccount)

  const dependencies = await repository.countDependencies(input.clerkUserId, parsed.accountId)

  if (dependencies.total > 0 && !parsed.targetAccountId) {
    throw new ValidationAppError(
      "Esta conta possui despesas ou vínculos ativos. Selecione uma conta para onde deseja transferi-los."
    )
  }

  return repository.delete(input.clerkUserId, parsed.accountId, parsed.targetAccountId)
}
