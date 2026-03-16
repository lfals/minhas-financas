import "server-only"

import type { SettlePendingExpenseInput } from "@/modules/transactions/domain/types"
import { TransactionsRepository } from "@/modules/transactions/infrastructure/transactions-repository"
import { settlePendingExpenseInputSchema } from "@/schemas/transactions.schemas"

const repository = new TransactionsRepository()

export async function settlePendingExpenseUseCase(
  input: SettlePendingExpenseInput & { clerkUserId: string }
) {
  const parsed = settlePendingExpenseInputSchema.parse(input)

  return repository.settlePendingExpense({
    clerkUserId: input.clerkUserId,
    transactionId: parsed.transactionId,
  })
}
