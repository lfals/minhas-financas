// Mirrors the invoice-month resolution in
// modules/transactions/infrastructure/transactions-repository.ts
// (getCreditCardInvoiceCompetenceMonth + getCreditCardInvoiceMonth) so the UI
// can preview the same fatura the backend will assign. Keep both in sync.
export function resolveCreditCardInvoiceMonth(
  occurredOn: string,
  closingDay: number,
  dueDay: number
): string {
  const [year, month, day] = occurredOn.split("-").map(Number)

  if (!year || !month || !day) {
    return occurredOn.slice(0, 7)
  }

  let competenceYear = year
  let competenceMonth = month

  if (day > closingDay) {
    competenceMonth += 1
    if (competenceMonth > 12) {
      competenceMonth = 1
      competenceYear += 1
    }
  }

  let invoiceYear = competenceYear
  let invoiceMonth = competenceMonth

  if (dueDay <= closingDay) {
    invoiceMonth += 1
    if (invoiceMonth > 12) {
      invoiceMonth = 1
      invoiceYear += 1
    }
  }

  return `${invoiceYear}-${String(invoiceMonth).padStart(2, "0")}`
}
