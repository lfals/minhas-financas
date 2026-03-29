import "server-only"

import { randomUUID } from "node:crypto"

import { ensureAccountDoesNotConflict } from "@/modules/accounts/domain/account-rules"
import type { CreateAccountInput } from "@/modules/accounts/domain/types"
import { AccountsRepository } from "@/modules/accounts/infrastructure/accounts-repository"
import { createAccountInputSchema } from "@/schemas/accounts.schemas"

const repository = new AccountsRepository()

export async function createAccountUseCase(input: CreateAccountInput & { clerkUserId: string }) {
  const parsed = createAccountInputSchema.parse(input)

  const existingAccount = await repository.findByName(input.clerkUserId, parsed.name)

  ensureAccountDoesNotConflict(existingAccount)

  return repository.create({
    ...parsed,
    clerkUserId: input.clerkUserId,
    clientRequestId: parsed.clientRequestId ?? randomUUID(),
  })
}
