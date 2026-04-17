import { createClient } from "@libsql/client"
import * as dotenv from "dotenv"
import path from "node:path"

dotenv.config({ path: path.join(process.cwd(), ".env.local") })

async function main() {
  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN
  
  // Como não sabemos o ID do usuário que está testando, vamos buscar um que tenha dados
  const client = createClient({
    url,
    authToken,
  })

  try {
    const userResult = await client.execute("SELECT clerk_user_id FROM accounts LIMIT 1")
    if (userResult.rows.length === 0) {
      console.log("Nenhum usuário com contas encontrado para teste.")
      return
    }
    const clerkUserId = userResult.rows[0].clerk_user_id
    console.log(`Testando reset para o usuário: ${clerkUserId}`)

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
        console.log(`Tentando excluir de ${table.name}...`)
        // Executamos fora de uma transação global para ver qual falha individualmente com FK ON
        await client.execute("PRAGMA foreign_keys = ON")
        await client.execute({ sql: table.sql, args: [clerkUserId] })
        console.log(`Sucesso em ${table.name}`)
      } catch (e) {
        console.error(`ERRO em ${table.name}:`, e.message)
        // Se falhou, vamos tentar ver QUEM referencia esta tabela
        const fkList = await client.execute(`PRAGMA foreign_key_check(${table.name})`)
        console.log(`FK Check para ${table.name}:`, fkList.rows)
      }
    }

  } catch (error) {
    console.error("Erro no diagnóstico:", error)
  } finally {
    await client.close()
  }
}

main()
