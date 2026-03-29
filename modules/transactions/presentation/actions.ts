"use server"

import { revalidatePath } from "next/cache"

import { getClerkUserIdOrThrow } from "@/lib/auth/server"
import { isAppError } from "@/lib/errors/app-error"
import { parseCurrencyInputToCents } from "@/lib/money"
import { createCreditCardExpenseUseCase } from "@/modules/transactions/application/create-credit-card-expense-use-case"
import { changeCreditCardExpenseCardUseCase } from "@/modules/transactions/application/change-credit-card-expense-card-use-case"
import { removeCreditCardExpenseUseCase } from "@/modules/transactions/application/remove-credit-card-expense-use-case"
import { settleCreditCardExpenseUseCase } from "@/modules/transactions/application/settle-credit-card-expense-use-case"
import { createTransactionUseCase } from "@/modules/transactions/application/create-transaction-use-case"
import { reopenTransactionUseCase } from "@/modules/transactions/application/reopen-transaction-use-case"
import { removeTransactionUseCase } from "@/modules/transactions/application/remove-transaction-use-case"
import { settleTransactionUseCase } from "@/modules/transactions/application/settle-transaction-use-case"
import {
  createTransactionFormSchema,
  reopenTransactionInputSchema,
  removeTransactionInputSchema,
  removeCreditCardExpenseInputSchema,
  settleCreditCardExpenseInputSchema,
  changeCreditCardExpenseCardInputSchema,
  settleTransactionInputSchema,
} from "@/schemas/transactions.schemas"

export type CreateTransactionActionState = {
  status: "idle" | "success" | "error"
  message?: string
  fieldErrors?: Record<string, string[] | undefined>
}

export type SettleTransactionActionState = {
  status: "idle" | "success" | "error"
  message?: string
}

export type ReopenTransactionActionState = {
  status: "idle" | "success" | "error"
  message?: string
}

export type RemoveTransactionActionState = {
  status: "idle" | "success" | "error"
  message?: string
}

export type RemoveCreditCardExpenseActionState = {
  status: "idle" | "success" | "error"
  message?: string
}

export type SettleCreditCardExpenseActionState = {
  status: "idle" | "success" | "error"
  message?: string
}

export type ChangeCreditCardExpenseCardActionState = {
  status: "idle" | "success" | "error"
  message?: string
  fieldErrors?: Record<string, string[] | undefined>
}

export async function createTransactionAction(
  _previousState: CreateTransactionActionState,
  formData: FormData
): Promise<CreateTransactionActionState> {
  const parsed = createTransactionFormSchema.safeParse({
    accountId: formData.get("accountId"),
    cardId: formData.get("cardId"),
    title: formData.get("title"),
    category: formData.get("category"),
    kind: formData.get("kind"),
    status: formData.get("status"),
    amount: formData.get("amount"),
    occurredOn: formData.get("occurredOn"),
    isFixed: formData.get("isFixed"),
    fixedExpenseFrequency: formData.get("fixedExpenseFrequency"),
    installmentNumber: formData.get("installmentNumber"),
    installmentTotal: formData.get("installmentTotal"),
    installmentAmountInputMode: formData.get("installmentAmountInputMode"),
    notes: formData.get("notes"),
  })

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos obrigatórios.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const clerkUserId = await getClerkUserIdOrThrow()
    const amountCents = parseCurrencyInputToCents(parsed.data.amount)

    if (parsed.data.kind === "card-expense") {
      await createCreditCardExpenseUseCase({
        clerkUserId,
        cardId: parsed.data.cardId!,
        title: parsed.data.title,
        category: parsed.data.category,
        amountCents,
        occurredOn: parsed.data.occurredOn,
        isFixed: parsed.data.isFixed,
        fixedExpenseFrequency: parsed.data.fixedExpenseFrequency,
        installmentNumber: parsed.data.installmentNumber,
        installmentTotal: parsed.data.installmentTotal,
        installmentAmountInputMode: parsed.data.installmentAmountInputMode,
        notes: parsed.data.notes,
      })
    } else {
      await createTransactionUseCase({
        clerkUserId,
        accountId: parsed.data.accountId!,
        title: parsed.data.title,
        category: parsed.data.category,
        kind: parsed.data.kind,
        status: parsed.data.status!,
        sourceType: "manual",
        amountCents,
        occurredOn: parsed.data.occurredOn,
        isFixed: parsed.data.isFixed,
        fixedExpenseFrequency: parsed.data.fixedExpenseFrequency,
        installmentNumber: parsed.data.installmentNumber,
        installmentTotal: parsed.data.installmentTotal,
        installmentAmountInputMode: parsed.data.installmentAmountInputMode,
        notes: parsed.data.notes,
      })
    }

    revalidatePath("/lancamentos")
    revalidatePath("/contas")
    revalidatePath("/cartoes")

    return {
      status: "success",
      message: "Lançamento criado com sucesso.",
    }
  } catch (error) {
    if (isAppError(error)) {
      return {
        status: "error",
        message: error.message,
      }
    }

    return {
      status: "error",
      message: "Não foi possível criar o lançamento agora.",
    }
  }
}

export async function settleTransactionAction(
  _previousState: SettleTransactionActionState,
  formData: FormData
): Promise<SettleTransactionActionState> {
  const parsed = settleTransactionInputSchema.safeParse({
    transactionId: formData.get("transactionId"),
    amount: formData.get("amount"),
  })

  if (!parsed.success) {
    return {
      status: "error",
      message: "Lançamento inválido para efetivação.",
    }
  }

  try {
    const clerkUserId = await getClerkUserIdOrThrow()

    await settleTransactionUseCase({
      clerkUserId,
      transactionId: parsed.data.transactionId,
      amount: parsed.data.amount ?? undefined,
    })

    revalidatePath("/lancamentos")
    revalidatePath("/contas")
    revalidatePath("/cartoes")

    return {
      status: "success",
      message: "Lançamento efetivado com sucesso.",
    }
  } catch (error) {
    if (isAppError(error)) {
      return {
        status: "error",
        message: error.message,
      }
    }

    return {
      status: "error",
      message: "Não foi possível efetivar o lançamento agora.",
    }
  }
}

export async function reopenTransactionAction(
  _previousState: ReopenTransactionActionState,
  formData: FormData
): Promise<ReopenTransactionActionState> {
  const parsed = reopenTransactionInputSchema.safeParse({
    transactionId: formData.get("transactionId"),
  })

  if (!parsed.success) {
    return {
      status: "error",
      message: "Lançamento inválido para reabertura.",
    }
  }

  try {
    const clerkUserId = await getClerkUserIdOrThrow()

    await reopenTransactionUseCase({
      clerkUserId,
      transactionId: parsed.data.transactionId,
    })

    revalidatePath("/lancamentos")
    revalidatePath("/contas")
    revalidatePath("/cartoes")

    return {
      status: "success",
      message: "Pagamento reaberto com sucesso.",
    }
  } catch (error) {
    if (isAppError(error)) {
      return {
        status: "error",
        message: error.message,
      }
    }

    return {
      status: "error",
      message: "Não foi possível reabrir o pagamento agora.",
    }
  }
}

export async function removeTransactionAction(
  _previousState: RemoveTransactionActionState,
  formData: FormData
): Promise<RemoveTransactionActionState> {
  const parsed = removeTransactionInputSchema.safeParse({
    transactionId: formData.get("transactionId"),
    scope: formData.get("scope"),
  })

  if (!parsed.success) {
    return {
      status: "error",
      message: "Lançamento inválido para remoção.",
    }
  }

  try {
    const clerkUserId = await getClerkUserIdOrThrow()

    await removeTransactionUseCase({
      clerkUserId,
      transactionId: parsed.data.transactionId,
      scope: parsed.data.scope,
    })

    revalidatePath("/lancamentos")
    revalidatePath("/contas")
    revalidatePath("/cartoes")

    return {
      status: "success",
      message: "Lançamento removido com sucesso.",
    }
  } catch (error) {
    if (isAppError(error)) {
      return {
        status: "error",
        message: error.message,
      }
    }

    return {
      status: "error",
      message: "Não foi possível remover o lançamento agora.",
    }
  }
}

export async function removeCreditCardExpenseAction(
  _previousState: RemoveCreditCardExpenseActionState,
  formData: FormData
): Promise<RemoveCreditCardExpenseActionState> {
  const parsed = removeCreditCardExpenseInputSchema.safeParse({
    expenseId: formData.get("expenseId"),
    scope: formData.get("scope"),
  })

  if (!parsed.success) {
    return {
      status: "error",
      message: "Lançamento inválido para remoção.",
    }
  }

  try {
    const clerkUserId = await getClerkUserIdOrThrow()

    await removeCreditCardExpenseUseCase({
      clerkUserId,
      expenseId: parsed.data.expenseId,
      scope: parsed.data.scope,
    })

    revalidatePath("/lancamentos")
    revalidatePath("/contas")
    revalidatePath("/cartoes")

    return {
      status: "success",
      message: "Lançamento removido com sucesso.",
    }
  } catch (error) {
    if (isAppError(error)) {
      return {
        status: "error",
        message: error.message,
      }
    }

    return {
      status: "error",
      message: "Não foi possível remover o lançamento agora.",
    }
  }
}

export async function settleCreditCardExpenseAction(
  _previousState: SettleCreditCardExpenseActionState,
  formData: FormData
): Promise<SettleCreditCardExpenseActionState> {
  const parsed = settleCreditCardExpenseInputSchema.safeParse({
    expenseId: formData.get("expenseId"),
  })

  if (!parsed.success) {
    return {
      status: "error",
      message: "Lançamento inválido para efetivação.",
    }
  }

  try {
    const clerkUserId = await getClerkUserIdOrThrow()

    await settleCreditCardExpenseUseCase({
      clerkUserId,
      expenseId: parsed.data.expenseId,
    })

    revalidatePath("/lancamentos")
    revalidatePath("/contas")
    revalidatePath("/cartoes")

    return {
      status: "success",
      message: "Lançamento efetivado na fatura com sucesso.",
    }
  } catch (error) {
    if (isAppError(error)) {
      return {
        status: "error",
        message: error.message,
      }
    }

    return {
      status: "error",
      message: "Não foi possível efetivar o lançamento na fatura agora.",
    }
  }
}

export async function changeCreditCardExpenseCardAction(
  _previousState: ChangeCreditCardExpenseCardActionState,
  formData: FormData
): Promise<ChangeCreditCardExpenseCardActionState> {
  const parsed = changeCreditCardExpenseCardInputSchema.safeParse({
    expenseId: formData.get("expenseId"),
    targetCardId: formData.get("targetCardId"),
  })

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos obrigatórios.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const clerkUserId = await getClerkUserIdOrThrow()

    await changeCreditCardExpenseCardUseCase({
      clerkUserId,
      expenseId: parsed.data.expenseId,
      targetCardId: parsed.data.targetCardId,
    })

    revalidatePath("/lancamentos")
    revalidatePath("/contas")
    revalidatePath("/cartoes")

    return {
      status: "success",
      message: "Cartão atualizado com sucesso.",
    }
  } catch (error) {
    if (isAppError(error)) {
      return {
        status: "error",
        message: error.message,
      }
    }

    return {
      status: "error",
      message: "Não foi possivel alterar o cartão agora.",
    }
  }
}
