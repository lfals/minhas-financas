import "server-only"

import { CreditCardsRepository } from "@/modules/credit-cards/infrastructure/credit-cards-repository"

const repository = new CreditCardsRepository()

export async function listCreditCardsUseCase(input: { clerkUserId: string }) {
  return repository.listByUser({
    clerkUserId: input.clerkUserId,
  })
}
