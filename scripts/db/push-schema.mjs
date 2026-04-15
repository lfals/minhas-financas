import { readFile } from "node:fs/promises"
import path from "node:path"

import { createClient } from "@libsql/client"

import { loadProjectEnv, requireEnv } from "./_env.mjs"
import { splitSqlStatements } from "./_sql.mjs"

async function main() {
  loadProjectEnv()

  const schemaPath = path.join(process.cwd(), "db", "schema", "libsql-baseline.sql")
  const schemaSql = await readFile(schemaPath, "utf8")
  const statements = splitSqlStatements(schemaSql)
  const client = createClient({
    url: requireEnv("TURSO_DATABASE_URL"),
    authToken: requireEnv("TURSO_AUTH_TOKEN"),
  })

  try {
    await client.execute("PRAGMA foreign_keys = ON")

    for (const statement of statements) {
      await client.execute(statement)
    }

    console.log(`Schema aplicado com sucesso. Statements executados: ${statements.length}.`)
  } finally {
    await client.close()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
