import "server-only"

import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

import type { Pool } from "pg"

let bootstrapPromise: Promise<void> | undefined
let bootstrapVersion: string | undefined

async function loadMigrationStatements() {
  const migrationsDir = path.join(process.cwd(), "db", "migrations")

  const entries = await readdir(migrationsDir, { withFileTypes: true })
  const migrationFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right))

  const statements = await Promise.all(
    migrationFiles.map(async (fileName) => {
      const filePath = path.join(migrationsDir, fileName)
      const statement = await readFile(filePath, "utf8")
      return { fileName, statement }
    })
  )

  const version = statements
    .map(({ fileName, statement }) => `${fileName}:${statement}`)
    .join("\n---\n")

  return { statements, version }
}

function splitSqlStatements(sql: string): string[] {
  return sql
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
}

export async function ensureDatabaseBootstrap(pool: Pool) {
  const { statements, version } = await loadMigrationStatements()

  if (bootstrapPromise && bootstrapVersion === version) {
    await bootstrapPromise
    return
  }

  if (!bootstrapPromise || bootstrapVersion !== version) {
    bootstrapVersion = version
    bootstrapPromise = (async () => {
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
      bootstrapVersion = undefined
      throw error
    })
  }

  await bootstrapPromise
}
