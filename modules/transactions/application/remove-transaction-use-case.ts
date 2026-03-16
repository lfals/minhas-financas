import "server-only"

import { NotFoundAppError } from "@/lib/errors/app-error"
import type { RemoveTransactionInput } from "@/modules/transactions/domain/types"
import { TransactionsRepository } from "@/modules/transactions/infrastructure/transactions-repository"
import { removeTransactionInputSchema } from "@/schemas/transactions.schemas"

const repository = new TransactionsRepository()

export async function removeTransactionUseCase(input: RemoveTransactionInput & { clerkUserId: string }) {
  const parsed = removeTransactionInputSchema.parse(input)
  const existingTransaction = await repository.findById(input.clerkUserId, parsed.transactionId)

  if (!existingTransaction) {
    throw new NotFoundAppError("Lançamento não encontrado.")
  }

  return repository.remove({
    clerkUserId: input.clerkUserId,
    transactionId: parsed.transactionId,
    scope: parsed.scope,
  })
}
