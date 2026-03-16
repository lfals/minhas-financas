import "server-only"

import { randomUUID } from "node:crypto"

import { ensureCreditCardDoesNotConflict } from "@/modules/credit-cards/domain/credit-card-rules"
import type { CreateCreditCardInput } from "@/modules/credit-cards/domain/types"
import { CreditCardsRepository } from "@/modules/credit-cards/infrastructure/credit-cards-repository"
import { createCreditCardInputSchema } from "@/schemas/credit-cards.schemas"

const repository = new CreditCardsRepository()

export async function createCreditCardUseCase(input: CreateCreditCardInput & { clerkUserId: string }) {
  const parsed = createCreditCardInputSchema.parse(input)

  const existingCard = await repository.findByNickname(input.clerkUserId, parsed.nickname)
  ensureCreditCardDoesNotConflict(existingCard, parsed.nickname)

  return repository.create({
    ...parsed,
    clerkUserId: input.clerkUserId,
    clientRequestId: parsed.clientRequestId ?? randomUUID(),
  })
}
