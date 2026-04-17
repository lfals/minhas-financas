import { createClient } from "@libsql/client"
import * as dotenv from "dotenv"
import path from "node:path"

dotenv.config({ path: path.join(process.cwd(), ".env.local") })

async function main() {
  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (!url || !authToken) {
    console.error("TURSO_DATABASE_URL or TURSO_AUTH_TOKEN not found in .env.local")
    process.exit(1)
  }

  const client = createClient({
    url,
    authToken,
  })

  try {
    const tablesResult = await client.execute("SELECT name FROM sqlite_master WHERE type='table'")
    const tables = tablesResult.rows.map(r => r.name)
    console.log("Tables:", tables.join(", "))
    
    for (const name of tables) {
      if (name.startsWith("sqlite_") || name.startsWith("_") || name === "libsql_wasm_func_table") continue
      const fk = await client.execute(`PRAGMA foreign_key_list(${name})`)
      if (fk.rows.length > 0) {
        console.log(`Table ${name} FKs:`)
        console.table(fk.rows)
      }
    }

    const indexes = await client.execute("SELECT name, sql FROM sqlite_master WHERE type='index'")
    console.log("Indexes:")
    console.table(indexes.rows)

  } catch (error) {
    console.error("Error diagnostic:", error)
  } finally {
    await client.close()
  }
}

main()
