import "server-only"

import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg"

import { ensureDatabaseBootstrap } from "@/lib/db/bootstrap"
import { getServerEnv } from "@/lib/env/server"

let pool: Pool | undefined

function normalizeDatabaseUrl(connectionString: string) {
  const normalizedUrl = new URL(connectionString)
  const sslMode = normalizedUrl.searchParams.get("sslmode")

  if (
    sslMode === "prefer" ||
    sslMode === "require" ||
    sslMode === "verify-ca"
  ) {
    normalizedUrl.searchParams.set("sslmode", "verify-full")
  }

  return normalizedUrl.toString()
}

function getPool() {
  if (!pool) {
    const env = getServerEnv()

    pool = new Pool({
      connectionString: normalizeDatabaseUrl(env.DATABASE_URL),
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      statement_timeout: 10_000,
    })
  }

  return pool
}

export async function queryDb<T extends QueryResultRow>(
  text: string,
  params: readonly unknown[] = []
): Promise<QueryResult<T>> {
  const currentPool = getPool()
  await ensureDatabaseBootstrap(currentPool)
  return currentPool.query<T>(text, params as unknown[])
}

export async function getDbClient(): Promise<PoolClient> {
  const currentPool = getPool()
  await ensureDatabaseBootstrap(currentPool)
  return currentPool.connect()
}
