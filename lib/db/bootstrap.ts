import "server-only"

import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

import type { Pool } from "pg"

let bootstrapPromise: Promise<void> | undefined

async function loadMigrationStatements() {
  const migrationsDir = path.join(process.cwd(), "db", "migrations")

  const entries = await readdir(migrationsDir, { withFileTypes: true })
  const migrationFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right))

  return Promise.all(
    migrationFiles.map(async (fileName) => {
      const filePath = path.join(migrationsDir, fileName)
      const statement = await readFile(filePath, "utf8")
      return { fileName, statement }
    })
  )
}

function splitSqlStatements(sql: string): string[] {
  return sql
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
}

export async function ensureDatabaseBootstrap(pool: Pool) {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const statements = await loadMigrationStatements()

      if (!statements.length) {
        return
      }

      const client = await pool.connect()

      try {
        for (const { fileName, statement } of statements) {
          const parts = splitSqlStatements(statement)
          for (const [index, part] of parts.entries()) {
            try {
              await client.query(part)
            } catch (error) {
              const statementLabel = `#${index + 1}`
              const message = `migration ${fileName} (${statementLabel}) failed`
              if (error instanceof Error) {
                error.message = `${message}: ${error.message}`
              }
              throw error
            }
          }
        }
      } finally {
        client.release()
      }
    })().catch((error) => {
      bootstrapPromise = undefined
      throw error
    })
  }

  await bootstrapPromise
}
