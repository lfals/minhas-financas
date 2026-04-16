"use server"

import { revalidatePath } from "next/cache"

import { getClerkUserIdOrThrow } from "@/lib/auth/server"
import { withTransaction } from "@/lib/db/tx"
import { isAppError, ValidationAppError } from "@/lib/errors/app-error"

const resetScopes = ["all", "transactions", "invoices"] as const

type ResetScope = (typeof resetScopes)[number]

export type ResetAppActionState = {
  status: "idle" | "success" | "error"
  message?: string
}

function isResetScope(value: FormDataEntryValue | null): value is ResetScope {
  return typeof value === "string" && resetScopes.includes(value as ResetScope)
}

async function recalculateAccountBalances(clerkUserId: string) {
  await withTransaction(async (client) => {
    await client.query(
      `
        update accounts
        set current_balance_cents =
          initial_balance_cents +
          coalesce((
            select sum(
              case
                when t.kind = 'income' then t.amount_cents
                else -t.amount_cents
              end
            )
            from transactions t
            where t.clerk_user_id = accounts.clerk_user_id
              and t.account_id = accounts.id
              and t.status = 'compensated'
          ), 0),
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        where clerk_user_id = ?1
      `,
      [clerkUserId],
    )
  })
}

async function clearInvoices(clerkUserId: string) {
  await withTransaction(async (client) => {
    await client.query("delete from credit_card_expenses where clerk_user_id = ?1", [clerkUserId])
    await client.query(
      "delete from transactions where clerk_user_id = ?1 and source_type = 'credit_card_invoice'",
      [clerkUserId],
    )
  })

  await recalculateAccountBalances(clerkUserId)
}

async function clearTransactions(clerkUserId: string) {
  await withTransaction(async (client) => {
    await client.query("delete from credit_card_expenses where clerk_user_id = ?1", [clerkUserId])
    await client.query("delete from transactions where clerk_user_id = ?1", [clerkUserId])
  })

  await recalculateAccountBalances(clerkUserId)
}

async function resetAll(clerkUserId: string) {
  await withTransaction(async (client) => {
    await client.query("delete from credit_card_expenses where clerk_user_id = ?1", [clerkUserId])
    await client.query("delete from transactions where clerk_user_id = ?1", [clerkUserId])
    await client.query("delete from credit_cards where clerk_user_id = ?1", [clerkUserId])
    await client.query("delete from transaction_categories where clerk_user_id = ?1", [clerkUserId])
    await client.query("delete from accounts where clerk_user_id = ?1", [clerkUserId])
    await client.query("delete from audit_log where clerk_user_id = ?1", [clerkUserId])
  })
}

export async function resetAppAction(
  _previousState: ResetAppActionState,
  formData: FormData,
): Promise<ResetAppActionState> {
  const scope = formData.get("scope")

  if (!isResetScope(scope)) {
    return {
      status: "error",
      message: "Selecione uma opção válida para recomeçar.",
    }
  }

  try {
    const clerkUserId = await getClerkUserIdOrThrow()

    if (scope === "all") {
      await resetAll(clerkUserId)
    } else if (scope === "transactions") {
      await clearTransactions(clerkUserId)
    } else if (scope === "invoices") {
      await clearInvoices(clerkUserId)
    } else {
      throw new ValidationAppError("Selecione uma opção válida para recomeçar.")
    }

    revalidatePath("/configuracoes")
    revalidatePath("/dashboard")
    revalidatePath("/configuracoes/contas")
    revalidatePath("/lancamentos")
    revalidatePath("/configuracoes/cartoes")

    return {
      status: "success",
      message:
        scope === "all"
          ? "Todos os dados foram reiniciados com sucesso."
          : scope === "transactions"
            ? "Todos os lançamentos foram removidos com sucesso."
            : "As faturas e despesas de cartão foram removidas com sucesso.",
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
      message: "Não foi possível executar o recomeço agora.",
    }
  }
}
