import "server-only"

import type { SettleCreditCardExpenseInput } from "@/modules/transactions/domain/types"
import { TransactionsRepository } from "@/modules/transactions/infrastructure/transactions-repository"
import { settleCreditCardExpenseInputSchema } from "@/schemas/transactions.schemas"

const repository = new TransactionsRepository()

export async function settleCreditCardExpenseUseCase(
  input: SettleCreditCardExpenseInput & { clerkUserId: string }
) {
  const parsed = settleCreditCardExpenseInputSchema.parse(input)

  return repository.settleCreditCardExpense({
    clerkUserId: input.clerkUserId,
    ...parsed,
  })
}
