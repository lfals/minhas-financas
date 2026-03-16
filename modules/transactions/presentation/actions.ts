"use server"

import { revalidatePath } from "next/cache"

import { getClerkUserIdOrThrow } from "@/lib/auth/server"
import { isAppError } from "@/lib/errors/app-error"
import { parseCurrencyInputToCents } from "@/lib/money"
import { createTransactionUseCase } from "@/modules/transactions/application/create-transaction-use-case"
import { createTransactionFormSchema } from "@/schemas/transactions.schemas"

export type CreateTransactionActionState = {
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
    title: formData.get("title"),
    category: formData.get("category"),
    kind: formData.get("kind"),
    status: formData.get("status"),
    amount: formData.get("amount"),
    occurredOn: formData.get("occurredOn"),
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

    await createTransactionUseCase({
      clerkUserId,
      accountId: parsed.data.accountId,
      title: parsed.data.title,
      category: parsed.data.category,
      kind: parsed.data.kind,
      status: parsed.data.status,
      amountCents: parseCurrencyInputToCents(parsed.data.amount),
      occurredOn: parsed.data.occurredOn,
      notes: parsed.data.notes,
    })

    revalidatePath("/lancamentos")
    revalidatePath("/contas")

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
