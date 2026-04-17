import "server-only"

import { TransactionsRepository } from "@/modules/transactions/infrastructure/transactions-repository"


const repository = new TransactionsRepository()

export async function listTransactionsUseCase(input: { clerkUserId: string }) {


  return repository.listByUser({
    clerkUserId: input.clerkUserId,
  })
}
