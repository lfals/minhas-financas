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
      return readFile(filePath, "utf8")
    })
  )
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
        for (const statement of statements) {
          await client.query(statement)
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
