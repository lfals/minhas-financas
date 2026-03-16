import "server-only"

import { ensureCreditCardDoesNotConflict, ensureCreditCardExists } from "@/modules/credit-cards/domain/credit-card-rules"
import type { UpdateCreditCardInput } from "@/modules/credit-cards/domain/types"
import { CreditCardsRepository } from "@/modules/credit-cards/infrastructure/credit-cards-repository"
import { updateCreditCardInputSchema } from "@/schemas/credit-cards.schemas"

const repository = new CreditCardsRepository()

export async function updateCreditCardUseCase(input: UpdateCreditCardInput & { clerkUserId: string }) {
  const parsed = updateCreditCardInputSchema.parse(input)

  const existingCard = await repository.findById(input.clerkUserId, parsed.cardId)
  ensureCreditCardExists(existingCard, parsed.cardId)

  const conflictingCard = await repository.findByNickname(input.clerkUserId, parsed.nickname)
  ensureCreditCardDoesNotConflict(conflictingCard, parsed.nickname, parsed.cardId)

  return repository.update({
    ...parsed,
    clerkUserId: input.clerkUserId,
  })
}
