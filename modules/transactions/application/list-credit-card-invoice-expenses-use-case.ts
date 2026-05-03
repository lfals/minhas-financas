import "server-only"

import { TransactionsRepository } from "@/modules/transactions/infrastructure/transactions-repository"

const repository = new TransactionsRepository()

export async function listCreditCardInvoiceExpensesUseCase(input: { clerkUserId: string }) {
  return repository.listCreditCardInvoiceExpensesByUser(input.clerkUserId)
}
