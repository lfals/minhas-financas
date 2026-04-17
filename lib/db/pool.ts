import "server-only"

import {
  createClient,
  type Client as LibsqlClient,
  type InArgs,
  type InStatement,
  type InValue,
} from "@libsql/client"

import { toQueryResult } from "@/lib/db/sql"
import { getServerEnv } from "@/lib/env/server"
import { ConfigurationAppError } from "@/lib/errors/app-error"
import type { DatabaseClient, QueryResult, QueryResultRow } from "@/lib/db/types"

let dbPromise: Promise<LibsqlClient> | undefined

type QueryExecutor = {
  execute(statement: InStatement): Promise<{
    columns: string[]
    lastInsertRowid: bigint | undefined
    rows: unknown[]
    rowsAffected: number
  }>
}

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

function createDatabaseClient(executor: QueryExecutor): DatabaseClient {
  return {
    async query<T extends QueryResultRow>(text: string, params: readonly unknown[] = []): Promise<QueryResult<T>> {
      let result

      try {
        result = await executor.execute({
          sql: text,
          args: normalizeArgs(params),
        })
      } catch (error) {
        throw wrapLibsqlError(error)
      }

      return toQueryResult<T>(result)
    },
    release() {},
  }
}

export async function createRawLibsqlClient() {
  const env = getServerEnv()
  return createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
    concurrency: 5,
  })
}

export async function getLibsqlClient() {
  if (!dbPromise) {
    const env = getServerEnv()

    dbPromise = (async () => {
      const client = createClient({
        url: env.TURSO_DATABASE_URL,
        authToken: env.TURSO_AUTH_TOKEN,
        concurrency: 10,
      })

      try {
        await client.execute("PRAGMA foreign_keys = ON")
      } catch (error) {
        throw wrapLibsqlError(error)
      }

      return client
    })().catch((error) => {
      dbPromise = undefined
      throw wrapLibsqlError(error)
    })
  }

  return dbPromise
}

export async function queryDb<T extends QueryResultRow>(
  text: string,
  params: readonly unknown[] = []
): Promise<QueryResult<T>> {
  const client = createDatabaseClient(await getLibsqlClient())
  return client.query<T>(text, params)
}

export async function getDbClient(): Promise<DatabaseClient> {
  return createDatabaseClient(await getLibsqlClient())
}
