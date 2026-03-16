import { ConflictAppError, NotFoundAppError } from "@/lib/errors/app-error"
import type { CreditCardRecord } from "@/modules/credit-cards/domain/types"

export function ensureCreditCardDoesNotConflict(
  existingCard: CreditCardRecord | null,
  nickname: string,
  currentCardId?: string
) {
  if (!existingCard) {
    return
  }

  if (currentCardId && existingCard.id === currentCardId) {
    return
  }

  throw new ConflictAppError(`Já existe um cartão com o nome "${nickname}".`)
}

export function ensureCreditCardExists(card: CreditCardRecord | null, cardId: string) {
  if (!card) {
    throw new NotFoundAppError("Cartão não encontrado.", { cardId })
  }
}
