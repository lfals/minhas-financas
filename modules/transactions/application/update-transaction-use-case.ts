import "server-only"

import { NotFoundAppError, ValidationAppError } from "@/lib/errors/app-error"
import type { UpdateTransactionInput } from "@/modules/transactions/domain/types"
import { TransactionsRepository } from "@/modules/transactions/infrastructure/transactions-repository"
import { updateTransactionInputSchema } from "@/schemas/transactions.schemas"

const repository = new TransactionsRepository()

export async function updateTransactionUseCase(input: UpdateTransactionInput & { clerkUserId: string }) {
  const parsed = updateTransactionInputSchema.parse(input)
  const existingTransaction = await repository.findById(input.clerkUserId, parsed.transactionId)

  if (!existingTransaction) {
    throw new NotFoundAppError("Lançamento não encontrado.")
  }

  if (existingTransaction.sourceType === "credit_card_invoice") {
    throw new ValidationAppError("A fatura consolidada não pode ser editada por este fluxo.")
  }

  return repository.update({
    ...parsed,
    clerkUserId: input.clerkUserId,
  })
}
