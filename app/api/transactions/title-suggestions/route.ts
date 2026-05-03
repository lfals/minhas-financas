import { NextResponse } from "next/server"

import { getClerkUserIdOrThrow } from "@/lib/auth/server"
import { isAppError } from "@/lib/errors/app-error"
import { listTransactionsUseCase } from "@/modules/transactions/application/list-transactions-use-case"
import { buildTransactionTitleSuggestions } from "@/modules/transactions/presentation/view-model"

function jsonError(error: { code: string; message: string; details?: unknown }, status: number) {
  return NextResponse.json(
    {
      ok: false,
      error,
    },
    { status }
  )
}

export async function GET() {
  try {
    const clerkUserId = await getClerkUserIdOrThrow()
    const { transactions } = await listTransactionsUseCase({ clerkUserId })
    const data = buildTransactionTitleSuggestions(transactions)

    return NextResponse.json({
      ok: true,
      data,
    })
  } catch (error) {
    if (isAppError(error)) {
      return jsonError(
        {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        error.status
      )
    }

    return jsonError(
      {
        code: "unexpected_error",
        message: "Não foi possível carregar sugestões de descrição.",
      },
      500
    )
  }
}
