"use server"

import { revalidatePath } from "next/cache"

import { getClerkUserIdOrThrow } from "@/lib/auth/server"
import { isAppError } from "@/lib/errors/app-error"
import { parseCurrencyInputToCents } from "@/lib/money"
import { archiveAccountUseCase } from "@/modules/accounts/application/archive-account-use-case"
import { createAccountUseCase } from "@/modules/accounts/application/create-account-use-case"
import { updateAccountUseCase } from "@/modules/accounts/application/update-account-use-case"
import {
  archiveAccountInputSchema,
  createAccountFormSchema,
  updateAccountFormSchema,
} from "@/schemas/accounts.schemas"

export type CreateAccountActionState = {
  status: "idle" | "success" | "error"
  message?: string
  fieldErrors?: Record<string, string[] | undefined>
}

export type ArchiveAccountActionState = {
  status: "idle" | "success" | "error"
  message?: string
}

export type UpdateAccountActionState = {
  status: "idle" | "success" | "error"
  message?: string
  fieldErrors?: Record<string, string[] | undefined>
}

export async function createAccountAction(
  _previousState: CreateAccountActionState,
  formData: FormData
): Promise<CreateAccountActionState> {
  const parsed = createAccountFormSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    initialBalance: formData.get("initialBalance"),
    includeInNetWorth: formData.get("includeInNetWorth"),
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

    await createAccountUseCase({
      clerkUserId,
      name: parsed.data.name,
      type: parsed.data.type,
      initialBalanceCents: parseCurrencyInputToCents(parsed.data.initialBalance),
      includeInNetWorth: parsed.data.includeInNetWorth,
      currencyCode: "BRL",
      displayOrder: 0,
    })

    revalidatePath("/contas")

    return {
      status: "success",
      message: "Conta criada com sucesso.",
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
      message: "Não foi possível criar a conta agora.",
    }
  }
}

export async function archiveAccountAction(
  _previousState: ArchiveAccountActionState,
  formData: FormData
): Promise<ArchiveAccountActionState> {
  const parsed = archiveAccountInputSchema.safeParse({
    accountId: formData.get("accountId"),
  })

  if (!parsed.success) {
    return {
      status: "error",
      message: "Conta inválida para remoção.",
    }
  }

  try {
    const clerkUserId = await getClerkUserIdOrThrow()

    await archiveAccountUseCase({
      clerkUserId,
      accountId: parsed.data.accountId,
    })

    revalidatePath("/contas")

    return {
      status: "success",
      message: "Conta removida com sucesso.",
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
      message: "Não foi possível remover a conta agora.",
    }
  }
}

export async function updateAccountAction(
  _previousState: UpdateAccountActionState,
  formData: FormData
): Promise<UpdateAccountActionState> {
  const parsed = updateAccountFormSchema.safeParse({
    accountId: formData.get("accountId"),
    name: formData.get("name"),
    type: formData.get("type"),
    initialBalance: formData.get("initialBalance"),
    includeInNetWorth: formData.get("includeInNetWorth"),
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

    await updateAccountUseCase({
      clerkUserId,
      accountId: parsed.data.accountId,
      name: parsed.data.name,
      type: parsed.data.type,
      initialBalanceCents: parseCurrencyInputToCents(parsed.data.initialBalance),
      includeInNetWorth: parsed.data.includeInNetWorth,
    })

    revalidatePath("/contas")

    return {
      status: "success",
      message: "Conta atualizada com sucesso.",
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
      message: "Não foi possível atualizar a conta agora.",
    }
  }
}
