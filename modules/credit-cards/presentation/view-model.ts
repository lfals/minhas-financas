import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import type { CreditCardRecord, CreditCardsPageData } from "@/modules/credit-cards/domain/types"

export function buildCreditCardsPageData(cards: CreditCardRecord[]): CreditCardsPageData {
  const items = cards.map((card) => ({
    id: card.id,
    nickname: card.nickname,
    finalDigits: card.finalDigits,
    limitCents: card.limitCents,
    availableLimitCents: Math.max(card.limitCents - card.usedLimitCents, 0),
    closingDay: String(card.closingDay).padStart(2, "0"),
    dueDay: String(card.dueDay).padStart(2, "0"),
    expenseAccountId: card.expenseAccountId,
    expenseAccountLabel: card.expenseAccountName,
    autoCategorizationEnabled: card.autoCategorizationEnabled,
    createdAtLabel: format(new Date(card.createdAt), "dd MMM", { locale: ptBR }),
  }))

  const totalLimitCents = items.reduce((sum, card) => sum + card.limitCents, 0)
  const totalAvailableLimitCents = items.reduce((sum, card) => sum + card.availableLimitCents, 0)

  return {
    cards: items,
    activeCount: items.length,
    totalLimitCents,
    availableLimitCents: totalAvailableLimitCents,
  }
}
