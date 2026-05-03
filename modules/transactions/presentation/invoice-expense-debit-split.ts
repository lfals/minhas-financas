/** Agrupa apenas valores de compra a débito (positive amountCents) para composição visual. */
export function sumInvoiceExpenseDebitSplit<T extends { amountCents: number; isFixed: boolean }>(
  expenses: readonly T[]
): { fixed: number; variable: number; totalDebit: number } {
  let fixed = 0
  let variable = 0

  for (const expense of expenses) {
    if (expense.amountCents <= 0) {
      continue
    }

    if (expense.isFixed) {
      fixed += expense.amountCents
    } else {
      variable += expense.amountCents
    }
  }

  return { fixed, variable, totalDebit: fixed + variable }
}
