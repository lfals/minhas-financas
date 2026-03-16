import "server-only"

import type { ReopenTransactionInput } from "@/modules/transactions/domain/types"
import { TransactionsRepository } from "@/modules/transactions/infrastructure/transactions-repository"
import { reopenTransactionInputSchema } from "@/schemas/transactions.schemas"

const repository = new TransactionsRepository()

export async function reopenTransactionUseCase(
  input: ReopenTransactionInput & { clerkUserId: string }
) {
  const parsed = reopenTransactionInputSchema.parse(input)

  return repository.reopenTransaction({
    clerkUserId: input.clerkUserId,
    transactionId: parsed.transactionId,
  })
}
