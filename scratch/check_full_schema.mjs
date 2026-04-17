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
    const tablesResult = await client.execute("SELECT name, sql FROM sqlite_master WHERE type='table'")
    for (const row of tablesResult.rows) {
      console.log(`--- Table: ${row.name} ---`)
      console.log(row.sql)
    }
  } finally {
    await client.close()
  }
}

main()
