import "server-only"

import { randomUUID } from "node:crypto"

import { queryDb } from "@/lib/db/pool"
import { withTransaction } from "@/lib/db/tx"
import type { DatabaseClient } from "@/lib/db/types"
import type {
  SalaryConfig,
  ConfigureSalaryCommand,
} from "@/modules/salaries/domain/types"

export class SalariesRepository {
  async getByUserId(clerkUserId: string, client?: DatabaseClient): Promise<SalaryConfig | null> {
    const query = client ? client.query.bind(client) : queryDb

    const salaryResult = await query(
      `SELECT * FROM salaries WHERE clerk_user_id = ?`,
      [clerkUserId]
    )

    const salaryRow = salaryResult.rows[0] as any

    if (!salaryRow) {
      return null
    }

    const deductionsResult = await query(
      `SELECT * FROM salary_deductions WHERE salary_id = ?`,
      [salaryRow.id]
    )

    return {
      id: salaryRow.id,
      clerkUserId: salaryRow.clerk_user_id,
      amountCents: Number(salaryRow.amount_cents),
      dayOfMonth: salaryRow.day_of_month,
      accountId: salaryRow.account_id,
      deductions: deductionsResult.rows.map((d: any) => ({
        id: d.id,
        description: d.description,
        amountCents: Number(d.amount_cents),
      })),
      createdAt: salaryRow.created_at,
      updatedAt: salaryRow.updated_at,
    }
  }

  async configure(command: ConfigureSalaryCommand): Promise<SalaryConfig> {
    return withTransaction(async (client) => {
      const existing = await client.query<{ id: string }>(
        `SELECT id FROM salaries WHERE clerk_user_id = ?`,
        [command.clerkUserId]
      )

      let salaryId: string

      if (existing.rows[0]) {
        salaryId = existing.rows[0].id
        await client.query(
          `UPDATE salaries 
           SET amount_cents = ?, day_of_month = ?, account_id = ?, updated_at = (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
           WHERE id = ?`,
          [command.amountCents, command.dayOfMonth, command.accountId, salaryId]
        )

        // Remote old deductions to re-insert
        await client.query(`DELETE FROM salary_deductions WHERE salary_id = ?`, [salaryId])
      } else {
        salaryId = randomUUID()
        await client.query(
          `INSERT INTO salaries (id, clerk_user_id, amount_cents, day_of_month, account_id)
           VALUES (?, ?, ?, ?, ?)`,
          [salaryId, command.clerkUserId, command.amountCents, command.dayOfMonth, command.accountId]
        )
      }

      for (const deduction of command.deductions) {
        await client.query(
          `INSERT INTO salary_deductions (id, salary_id, description, amount_cents)
           VALUES (?, ?, ?, ?)`,
          [randomUUID(), salaryId, deduction.description, deduction.amountCents]
        )
      }

      const updated = await this.getByUserId(command.clerkUserId, client)
      if (!updated) throw new Error("Failed to retrieve updated salary config")
      return updated
    })
  }

  async isMonthExcluded(clerkUserId: string, monthYear: string): Promise<boolean> {
    const result = await queryDb<{ count: number }>(
      `SELECT COUNT(*) as count FROM salary_exclusions WHERE clerk_user_id = ? AND month_year = ?`,
      [clerkUserId, monthYear]
    )
    return Number(result.rows[0].count) > 0
  }

  async excludeMonth(clerkUserId: string, monthYear: string, client?: DatabaseClient): Promise<void> {
    const query = client ? client.query.bind(client) : queryDb
    await query(
      `INSERT OR IGNORE INTO salary_exclusions (clerk_user_id, month_year) VALUES (?, ?)`,
      [clerkUserId, monthYear]
    )
  }
}
