import "server-only"

import { SalariesRepository } from "@/modules/salaries/infrastructure/salaries-repository"
import { TransactionsRepository } from "@/modules/transactions/infrastructure/transactions-repository"
import { randomUUID } from "node:crypto"

const salariesRepository = new SalariesRepository()
const transactionsRepository = new TransactionsRepository()

export async function syncSalaryTransactionUseCase(input: { clerkUserId: string }) {
  const { clerkUserId } = input
  const salaryConfig = await salariesRepository.getByUserId(clerkUserId)

  if (!salaryConfig) {
    return
  }

  const allTransactions = await transactionsRepository.listByUser({ clerkUserId })
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // We will project the next 12 months (current + 11 future)
  const checkDate = new Date(currentMonthStart)
  const endDate = new Date(now.getFullYear(), now.getMonth() + 12, 1)

  while (checkDate < endDate) {
    const year = checkDate.getFullYear()
    const month = checkDate.getMonth() + 1
    const monthStr = month.toString().padStart(2, "0")
    const salaryTitle = `Salário ${monthStr}/${year}`
    const monthYear = `${year}-${monthStr}`

    // 1. Check if a salary transaction for this month already exists
    const alreadyExists = allTransactions.transactions.some(
      (t) => t.title === salaryTitle && t.occurredOn.startsWith(monthYear)
    )

    if (!alreadyExists) {
      // 1.1 Check if this month is intentionally excluded
      const isExcluded = await salariesRepository.isMonthExcluded(clerkUserId, monthYear)

      if (!isExcluded) {
        // 2. Calculate Transaction Details
        const lastDayOfMonth = new Date(year, month, 0).getDate()
        const effectiveDay = Math.min(salaryConfig.dayOfMonth, lastDayOfMonth)
        const paymentDateStr = `${year}-${monthStr}-${effectiveDay.toString().padStart(2, "0")}`
        const paymentDate = new Date(`${paymentDateStr}T12:00:00Z`) // Neutral time for comparison
        
        const isPastOrToday = paymentDate <= now

        // 3. Calculate Net Amount
        const deductionsTotal = salaryConfig.deductions.reduce((acc, d) => acc + d.amountCents, 0)
        const netAmountCents = salaryConfig.amountCents - deductionsTotal

        if (netAmountCents > 0) {
          // 4. Create the transaction
          await transactionsRepository.create({
            clerkUserId,
            clientRequestId: randomUUID(),
            accountId: salaryConfig.accountId,
            title: salaryTitle,
            category: "Salário",
            kind: "income",
            status: isPastOrToday ? "pending" : "scheduled",
            amountCents: netAmountCents,
            occurredOn: paymentDateStr,
            isFixed: false,
            installmentNumber: null,
            installmentTotal: null,
            installmentAmountInputMode: "installment",
            sourceType: "manual",
            notes: `Salário bruto: R$ ${(salaryConfig.amountCents / 100).toFixed(2)}\nDescontos: R$ ${(deductionsTotal / 100).toFixed(2)}`,
          })
        }
      }
    }

    // Move to next month
    checkDate.setMonth(checkDate.getMonth() + 1)
  }
}
