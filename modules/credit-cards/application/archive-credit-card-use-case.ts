import "server-only"

import { ensureCreditCardCanBeArchived } from "@/modules/credit-cards/domain/credit-card-rules"
import { CreditCardsRepository } from "@/modules/credit-cards/infrastructure/credit-cards-repository"
import { archiveCreditCardFormSchema } from "@/schemas/credit-cards.schemas"

const repository = new CreditCardsRepository()

export async function archiveCreditCardUseCase(input: { clerkUserId: string; cardId: string }) {
  const parsed = archiveCreditCardFormSchema.parse({ cardId: input.cardId })

  const existingCard = await repository.findById(input.clerkUserId, parsed.cardId)
  ensureCreditCardCanBeArchived(existingCard, parsed.cardId)

  return repository.archive({
    clerkUserId: input.clerkUserId,
    cardId: parsed.cardId,
  })
}
