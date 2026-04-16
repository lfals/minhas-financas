import "server-only"

import { NotFoundAppError } from "@/lib/errors/app-error"
import type { RemoveCreditCardExpenseInput } from "@/modules/transactions/domain/types"
import { TransactionsRepository } from "@/modules/transactions/infrastructure/transactions-repository"
import { removeCreditCardExpenseInputSchema } from "@/schemas/transactions.schemas"

const repository = new TransactionsRepository()

export async function removeCreditCardExpenseUseCase(
  input: RemoveCreditCardExpenseInput & { clerkUserId: string }
) {
  const parsed = removeCreditCardExpenseInputSchema.parse(input)
  const existingExpense = await repository.findCreditCardExpenseById(input.clerkUserId, parsed.expenseId)

  if (!existingExpense) {
    throw new NotFoundAppError("Lançamento não encontrado.")
  }

  return repository.removeCreditCardExpense({
    clerkUserId: input.clerkUserId,
    expenseId: parsed.expenseId,
    scope: parsed.scope,
  })
}
