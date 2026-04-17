import { createClient } from "@libsql/client"
import * as dotenv from "dotenv"
import path from "node:path"

dotenv.config({ path: path.join(process.cwd(), ".env.local") })

async function main() {
  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN
  const clerkUserId = "user_2ovqHbeK4HIdZ16TlyqCHrT39u1" // Exemplo de ID, pode ser qualquer um que exista

  const client = createClient({
    url,
    authToken,
  })

  try {
    const tx = await client.transaction("write")
    await tx.execute("PRAGMA foreign_keys = ON")
    
    const tables = [
      { name: "salary_deductions", sql: "delete from salary_deductions where salary_id in (select id from salaries where clerk_user_id = ?1)" },
      { name: "credit_card_expenses", sql: "delete from credit_card_expenses where clerk_user_id = ?1" },
      { name: "transactions", sql: "delete from transactions where clerk_user_id = ?1" },
      { name: "salaries", sql: "delete from salaries where clerk_user_id = ?1" },
      { name: "credit_cards", sql: "delete from credit_cards where clerk_user_id = ?1" },
      { name: "transaction_categories", sql: "delete from transaction_categories where clerk_user_id = ?1" },
      { name: "accounts", sql: "delete from accounts where clerk_user_id = ?1" },
      { name: "audit_log", sql: "delete from audit_log where clerk_user_id = ?1" },
      { name: "salary_exclusions", sql: "delete from salary_exclusions where clerk_user_id = ?1" }
    ]

    for (const table of tables) {
      try {
        console.log(`Deleting from ${table.name}...`)
        await tx.execute({ sql: table.sql, args: [clerkUserId] })
      } catch (e) {
        console.error(`FAILED deleting from ${table.name}:`, e.message)
        break
      }
    }

    await tx.rollback()
    console.log("Rolled back diagnostic transaction.")
  } catch (error) {
    console.error("Diagnostic error:", error)
  } finally {
    await client.close()
  }
}

main()
