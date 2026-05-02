import "server-only"

import { randomUUID } from "node:crypto"

import { NotFoundAppError, ValidationAppError } from "@/lib/errors/app-error"
import { TransactionsRepository } from "@/modules/transactions/infrastructure/transactions-repository"
import type { ConvertManualExpenseToCreditCardExpenseFormInput } from "@/schemas/transactions.schemas"
import {
  convertManualExpenseToCreditCardExpenseFormSchema,
  createCreditCardExpenseInputSchema,
} from "@/schemas/transactions.schemas"

const repository = new TransactionsRepository()

export async function convertManualExpenseToCreditCardExpenseUseCase(
  input: { clerkUserId: string; amountCents: number } & ConvertManualExpenseToCreditCardExpenseFormInput
) {
  const form = convertManualExpenseToCreditCardExpenseFormSchema.parse(input)
  const existing = await repository.findById(input.clerkUserId, form.transactionId)

  if (!existing) {
    throw new NotFoundAppError("Lançamento não encontrado.")
  }

  if (existing.kind !== "expense") {
    throw new ValidationAppError("Somente despesas podem virar compra no cartão.")
  }

  if (existing.sourceType !== "manual") {
    throw new ValidationAppError("Somente lançamentos manuais podem ser convertidos.")
  }

  let title = form.title.trim()
  if (
    existing.installmentNumber != null &&
    existing.installmentTotal != null &&
    existing.installmentTotal > 1
  ) {
    const hint = `${existing.installmentNumber}/${existing.installmentTotal}`
    if (!title.includes(hint)) {
      title = `${title} ${hint}`.trim().slice(0, 120)
    }
  }

  const cardExpense = createCreditCardExpenseInputSchema.parse({
    cardId: form.cardId!,
    title,
    category: form.category,
    amountCents: input.amountCents,
    occurredOn: form.occurredOn,
    isFixed: false,
    fixedExpenseFrequency: null,
    installmentNumber: null,
    installmentTotal: null,
    installmentAmountInputMode: "installment",
    targetInvoiceMonth: form.targetInvoiceMonth,
    notes: existing.notes ?? undefined,
  })

  return repository.convertManualExpenseToCreditCardExpense({
    clerkUserId: input.clerkUserId,
    transactionId: form.transactionId,
    cardExpense: {
      ...cardExpense,
      clerkUserId: input.clerkUserId,
      clientRequestId: randomUUID(),
    },
  })
}
