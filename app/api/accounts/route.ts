import { NextResponse } from "next/server"

import { getClerkUserIdOrThrow } from "@/lib/auth/server"
import { isAppError } from "@/lib/errors/app-error"
import { listAccountsUseCase } from "@/modules/accounts/application/list-accounts-use-case"
import { createAccountUseCase } from "@/modules/accounts/application/create-account-use-case"
import { listAccountsQuerySchema } from "@/schemas/accounts.schemas"

function jsonError(error: { code: string; message: string; details?: unknown }, status: number) {
  return NextResponse.json(
    {
      ok: false,
      error,
    },
    { status }
  )
}

export async function GET(request: Request) {
  try {
    const clerkUserId = await getClerkUserIdOrThrow()
    const query = listAccountsQuerySchema.parse({
      includeArchived: new URL(request.url).searchParams.get("includeArchived") ?? undefined,
    })

    const data = await listAccountsUseCase({
      clerkUserId,
      includeArchived: query.includeArchived,
    })

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
        message: "Não foi possível carregar as contas.",
      },
      500
    )
  }
}

export async function POST(request: Request) {
  try {
    const clerkUserId = await getClerkUserIdOrThrow()
    const body = await request.json()
    const result = await createAccountUseCase({
      clerkUserId,
      ...body,
    })

    return NextResponse.json(
      {
        ok: true,
        data: result,
      },
      { status: result.created ? 201 : 200 }
    )
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
        message: "Não foi possível criar a conta.",
      },
      500
    )
  }
}
