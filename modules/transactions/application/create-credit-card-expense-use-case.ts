import "server-only"

import { randomUUID } from "node:crypto"

import type { CreateCreditCardExpenseInput } from "@/modules/transactions/domain/types"
import { TransactionsRepository } from "@/modules/transactions/infrastructure/transactions-repository"
import { createCreditCardExpenseInputSchema } from "@/schemas/transactions.schemas"

const repository = new TransactionsRepository()

export async function createCreditCardExpenseUseCase(
  input: CreateCreditCardExpenseInput & { clerkUserId: string }
) {
  const parsed = createCreditCardExpenseInputSchema.parse(input)

  return repository.createCreditCardExpense({
    ...parsed,
    clerkUserId: input.clerkUserId,
    clientRequestId: parsed.clientRequestId ?? randomUUID(),
  })
}
