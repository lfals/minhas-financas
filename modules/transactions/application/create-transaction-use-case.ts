import "server-only"

import { randomUUID } from "node:crypto"

import type { CreateTransactionInput } from "@/modules/transactions/domain/types"
import { TransactionsRepository } from "@/modules/transactions/infrastructure/transactions-repository"
import { createTransactionInputSchema } from "@/schemas/transactions.schemas"

const repository = new TransactionsRepository()

export async function createTransactionUseCase(
  input: CreateTransactionInput & { clerkUserId: string }
) {
  const parsed = createTransactionInputSchema.parse(input)

  return repository.create({
    ...parsed,
    clerkUserId: input.clerkUserId,
    clientRequestId: parsed.clientRequestId ?? randomUUID(),
  })
}
