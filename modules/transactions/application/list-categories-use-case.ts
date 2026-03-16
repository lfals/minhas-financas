import "server-only"

import type { TransactionCategoryRecord } from "@/modules/transactions/domain/types"
import { TransactionsRepository } from "@/modules/transactions/infrastructure/transactions-repository"

const repository = new TransactionsRepository()

export async function listTransactionCategoriesUseCase(input: {
  clerkUserId: string
}): Promise<TransactionCategoryRecord[]> {
  return repository.listCategories(input.clerkUserId)
}
