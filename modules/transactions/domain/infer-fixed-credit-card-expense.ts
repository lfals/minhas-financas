import { CREDIT_CARD_INVOICE_SETTLEMENT_ADJUSTMENT_NOTE } from "@/modules/transactions/domain/credit-card-invoice-notes"

/**
 * Indica despesa cadastrada como fixa no cartão (assinatura/recorrência), alinhado a
 * `persistCreditCardExpenseOccurrences`: série sem parcelamento no título.
 */
export function inferIsFixedCreditCardExpense(input: {
  seriesId?: string | null
  title: string
  notes?: string | null
}): boolean {
  if (input.notes === CREDIT_CARD_INVOICE_SETTLEMENT_ADJUSTMENT_NOTE) {
    return false
  }

  if (!input.seriesId) {
    return false
  }

  if (/\s\d+\/\d+$/.test(input.title.trim())) {
    return false
  }

  return true
}
