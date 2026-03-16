import "server-only"

import { parseCurrencyInputToCents } from "@/lib/money"
import type { SettleTransactionInput } from "@/modules/transactions/domain/types"
import { TransactionsRepository } from "@/modules/transactions/infrastructure/transactions-repository"
import { settleTransactionInputSchema } from "@/schemas/transactions.schemas"

const repository = new TransactionsRepository()

export async function settleTransactionUseCase(
  input: SettleTransactionInput & { clerkUserId: string }
) {
  const parsed = settleTransactionInputSchema.parse(input)

  return repository.settleTransaction({
    clerkUserId: input.clerkUserId,
    transactionId: parsed.transactionId,
    amountCents: parsed.amount ? parseCurrencyInputToCents(parsed.amount) : undefined,
  })
}
