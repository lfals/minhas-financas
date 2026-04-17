import "server-only"

import { TransactionsRepository } from "@/modules/transactions/infrastructure/transactions-repository"
import { syncSalaryTransactionUseCase } from "@/modules/salaries/application/sync-salary-transaction-use-case"

const repository = new TransactionsRepository()

export async function listTransactionsUseCase(input: { clerkUserId: string }) {
  await syncSalaryTransactionUseCase({ clerkUserId: input.clerkUserId })

  return repository.listByUser({
    clerkUserId: input.clerkUserId,
  })
}
