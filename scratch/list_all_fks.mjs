import { createClient } from "@libsql/client"
import * as dotenv from "dotenv"
import path from "node:path"

dotenv.config({ path: path.join(process.cwd(), ".env.local") })

async function main() {
  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  const client = createClient({
    url,
    authToken,
  })

  try {
    const tablesResult = await client.execute("SELECT name FROM sqlite_master WHERE type='table'")
    const tables = tablesResult.rows.map(r => r.name)
    
    for (const table of tables) {
      if (table.startsWith("sqlite_")) continue
      const fkList = await client.execute(`PRAGMA foreign_key_list(${table})`)
      for (const fk of fkList.rows) {
        console.log(`Table '${table}' has FK on column '${fk.from}' pointing to '${fk.table}(${fk.to})'`)
      }
    }
  } finally {
    await client.close()
  }
}

main()
