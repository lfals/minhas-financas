import "server-only"

import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg"

import { ensureDatabaseBootstrap } from "@/lib/db/bootstrap"
import { getServerEnv } from "@/lib/env/server"

let pool: Pool | undefined

function getPool() {
  if (!pool) {
    const env = getServerEnv()

    pool = new Pool({
      connectionString: env.DATABASE_URL,
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
