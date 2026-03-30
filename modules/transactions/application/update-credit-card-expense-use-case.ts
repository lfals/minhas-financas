"use server"

import type { UpdateCreditCardExpenseInput } from "@/modules/transactions/domain/types"
import { TransactionsRepository } from "@/modules/transactions/infrastructure/transactions-repository"
import { updateCreditCardExpenseInputSchema } from "@/schemas/transactions.schemas"

const repository = new TransactionsRepository()

export async function updateCreditCardExpenseUseCase(
  input: UpdateCreditCardExpenseInput & { clerkUserId: string }
) {
  const parsed = updateCreditCardExpenseInputSchema.parse(input)

  return repository.updateCreditCardExpense({
    clerkUserId: input.clerkUserId,
    ...parsed,
  })
}
