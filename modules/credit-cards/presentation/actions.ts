"use server"

import { revalidatePath } from "next/cache"

import { getClerkUserIdOrThrow } from "@/lib/auth/server"
import { isAppError } from "@/lib/errors/app-error"
import { parseCurrencyInputToCents } from "@/lib/money"
import { createCreditCardUseCase } from "@/modules/credit-cards/application/create-credit-card-use-case"
import { updateCreditCardUseCase } from "@/modules/credit-cards/application/update-credit-card-use-case"
import {
  createCreditCardFormSchema,
  updateCreditCardFormSchema,
} from "@/schemas/credit-cards.schemas"

export type CreditCardActionState = {
  status: "idle" | "success" | "error"
  message?: string
  fieldErrors?: Record<string, string[] | undefined>
}

export async function createCreditCardAction(
  _previousState: CreditCardActionState,
  formData: FormData
): Promise<CreditCardActionState> {
  const parsed = createCreditCardFormSchema.safeParse({
    nickname: formData.get("nickname"),
    finalDigits: formData.get("finalDigits"),
    limit: formData.get("limit"),
    closingDay: formData.get("closingDay"),
    dueDay: formData.get("dueDay"),
    expenseAccountId: formData.get("expenseAccountId"),
    autoCategorizationEnabled: formData.get("autoCategorizationEnabled"),
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

    await createCreditCardUseCase({
      clerkUserId,
      nickname: parsed.data.nickname,
      finalDigits: parsed.data.finalDigits,
      limitCents: parseCurrencyInputToCents(parsed.data.limit),
      closingDay: parsed.data.closingDay,
      dueDay: parsed.data.dueDay,
      expenseAccountId: parsed.data.expenseAccountId,
      autoCategorizationEnabled: parsed.data.autoCategorizationEnabled,
    })

    revalidatePath("/cartoes")

    return {
      status: "success",
      message: "Cartão criado com sucesso.",
    }
  } catch (error) {
    if (isAppError(error)) {
      return {
        status: "error",
        message: error.message,
      }
    }

    if (error instanceof Error && process.env.NODE_ENV !== "production") {
      return {
        status: "error",
        message: error.message,
      }
    }

    return {
      status: "error",
      message: "Não foi possível criar o cartão agora.",
    }
  }
}

export async function updateCreditCardAction(
  _previousState: CreditCardActionState,
  formData: FormData
): Promise<CreditCardActionState> {
  const parsed = updateCreditCardFormSchema.safeParse({
    cardId: formData.get("cardId"),
    nickname: formData.get("nickname"),
    finalDigits: formData.get("finalDigits"),
    limit: formData.get("limit"),
    closingDay: formData.get("closingDay"),
    dueDay: formData.get("dueDay"),
    expenseAccountId: formData.get("expenseAccountId"),
    autoCategorizationEnabled: formData.get("autoCategorizationEnabled"),
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

    await updateCreditCardUseCase({
      clerkUserId,
      cardId: parsed.data.cardId,
      nickname: parsed.data.nickname,
      finalDigits: parsed.data.finalDigits,
      limitCents: parseCurrencyInputToCents(parsed.data.limit),
      closingDay: parsed.data.closingDay,
      dueDay: parsed.data.dueDay,
      expenseAccountId: parsed.data.expenseAccountId,
      autoCategorizationEnabled: parsed.data.autoCategorizationEnabled,
    })

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

    if (error instanceof Error && process.env.NODE_ENV !== "production") {
      return {
        status: "error",
        message: error.message,
      }
    }

    return {
      status: "error",
      message: "Não foi possível atualizar o cartão agora.",
    }
  }
}
