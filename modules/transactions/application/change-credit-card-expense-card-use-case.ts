"use server"

import type { ChangeCreditCardExpenseCardInput } from "@/modules/transactions/domain/types"
import { TransactionsRepository } from "@/modules/transactions/infrastructure/transactions-repository"
import { changeCreditCardExpenseCardInputSchema } from "@/schemas/transactions.schemas"

const repository = new TransactionsRepository()

export async function changeCreditCardExpenseCardUseCase(
  input: ChangeCreditCardExpenseCardInput & { clerkUserId: string }
) {
  const parsed = changeCreditCardExpenseCardInputSchema.parse(input)

  return repository.changeCreditCardExpenseCard({
    clerkUserId: input.clerkUserId,
    ...parsed,
  })
}
