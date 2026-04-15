import "server-only"

import type { InArgs, InValue } from "@libsql/client"

import { toQueryResult } from "@/lib/db/sql"
import { getLibsqlClient } from "@/lib/db/pool"
import { ConfigurationAppError } from "@/lib/errors/app-error"
import type { DatabaseClient } from "@/lib/db/types"

function normalizeArgs(params: readonly unknown[]): InArgs {
  return params.map((param) => {
    if (typeof param === "boolean") {
      return param ? 1 : 0
    }

    if (param instanceof Date) {
      return param.toISOString()
    }

    if (param === undefined) {
      return null
    }

    return param as InValue
  })
}

function wrapLibsqlError(error: unknown) {
  if (error instanceof Error && error.message === "fetch failed") {
    return new ConfigurationAppError(
      "Nao foi possivel conectar ao Turso. Verifique acesso de rede do processo, TURSO_DATABASE_URL e TURSO_AUTH_TOKEN.",
      {
        cause: error.message,
      }
    )
  }

  return error
}

export async function withTransaction<T>(
  callback: (client: DatabaseClient) => Promise<T>
): Promise<T> {
  const db = await getLibsqlClient()
  const transaction = await db.transaction("write")
  await transaction.execute("PRAGMA foreign_keys = ON")

  const client: DatabaseClient = {
    async query(text, params = []) {
      let result

      try {
        result = await transaction.execute({
          sql: text,
          args: normalizeArgs(params),
        })
      } catch (error) {
        throw wrapLibsqlError(error)
      }

      return toQueryResult(result)
    },
    async release() {
      await transaction.close()
    },
  }

  try {
    const result = await callback(client)
    await transaction.commit()
    return result
  } catch (error) {
    await transaction.rollback()
    throw wrapLibsqlError(error)
  } finally {
    await client.release()
  }
}
