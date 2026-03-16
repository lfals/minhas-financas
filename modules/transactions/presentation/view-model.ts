import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import type { AccountRecord } from "@/modules/accounts/domain/types"
import type {
  TransactionAccountOption,
  TransactionCategoryBreakdown,
  TransactionListRecord,
  TransactionsPageData,
} from "@/modules/transactions/domain/types"

function getStatusLabel(status: TransactionListRecord["status"]) {
  if (status === "compensated") return "Compensado"
  if (status === "pending") return "Pendente"
  return "Agendado"
}

function buildCategoryBreakdown(
  transactions: TransactionListRecord[]
): TransactionCategoryBreakdown[] {
  const expenseTotals = new Map<string, number>()

  for (const transaction of transactions) {
    if (transaction.kind !== "expense") {
      continue
    }

    expenseTotals.set(
      transaction.category,
      (expenseTotals.get(transaction.category) ?? 0) + transaction.amountCents
    )
  }

  const totalExpenses = [...expenseTotals.values()].reduce((sum, amount) => sum + amount, 0)

  return [...expenseTotals.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([name, amountCents]) => ({
      id: name,
      name,
      amountCents,
      share: totalExpenses > 0 ? Math.max(4, Math.round((amountCents / totalExpenses) * 100)) : 0,
    }))
}

export function buildTransactionAccountOptions(accounts: AccountRecord[]): TransactionAccountOption[] {
  return accounts.map((account) => ({
    id: account.id,
    label: `${account.name} • ${account.institution}`,
  }))
}

export function buildTransactionsPageData(
  transactions: TransactionListRecord[]
): TransactionsPageData {
  const compensatedIncomeCents = transactions
    .filter((transaction) => transaction.kind === "income" && transaction.status === "compensated")
    .reduce((sum, transaction) => sum + transaction.amountCents, 0)

  const compensatedExpenseCents = transactions
    .filter((transaction) => transaction.kind === "expense" && transaction.status === "compensated")
    .reduce((sum, transaction) => sum + transaction.amountCents, 0)

  const pendingAmountCents = transactions
    .filter((transaction) => transaction.status !== "compensated")
    .reduce((sum, transaction) => sum + transaction.amountCents, 0)

  const latestDate = transactions[0]?.occurredOn
  const periodLabel = latestDate
    ? format(new Date(`${latestDate}T00:00:00`), "MMMM yyyy", { locale: ptBR })
    : format(new Date(), "MMMM yyyy", { locale: ptBR })

  const weekly = new Map<string, { label: string; incomeCents: number; expenseCents: number }>()

  for (const transaction of transactions) {
    const date = new Date(`${transaction.occurredOn}T00:00:00`)
    const weekIndex = Math.min(3, Math.floor((date.getDate() - 1) / 7))
    const key = `${date.getFullYear()}-${date.getMonth()}-${weekIndex}`

    if (!weekly.has(key)) {
      const weekStart = weekIndex * 7 + 1
      const weekEnd = Math.min(weekStart + 6, 31)
      weekly.set(key, {
        label: `${String(weekStart).padStart(2, "0")}-${String(weekEnd).padStart(2, "0")} ${format(date, "MMM", { locale: ptBR })}`,
        incomeCents: 0,
        expenseCents: 0,
      })
    }

    const current = weekly.get(key)!
    if (transaction.kind === "income") {
      current.incomeCents += transaction.amountCents
    } else {
      current.expenseCents += transaction.amountCents
    }
  }

  return {
    periodLabel: periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1),
    summary: {
      title: "Controle o fluxo diário sem perder contexto do mês.",
      description:
        "Cadastre lançamentos por conta, acompanhe o que já impactou saldo e mantenha a leitura do caixa organizada em um só lugar.",
    },
    metrics: [
      {
        label: "Entradas",
        valueCents: compensatedIncomeCents,
        detail: "Receitas compensadas no período",
        tone: "income",
      },
      {
        label: "Saídas",
        valueCents: compensatedExpenseCents,
        detail: "Pagamentos já refletidos no saldo",
        tone: "expense",
      },
      {
        label: "Pendente",
        valueCents: pendingAmountCents,
        detail: "Lançamentos ainda não compensados",
        tone: "neutral",
      },
      {
        label: "Saldo líquido",
        valueCents: compensatedIncomeCents - compensatedExpenseCents,
        detail: "Resultado líquido do que já foi compensado",
        tone: compensatedIncomeCents - compensatedExpenseCents >= 0 ? "income" : "expense",
      },
    ],
    transactions: transactions.map((transaction) => ({
      id: transaction.id,
      title: transaction.title,
      category: transaction.category,
      accountName: transaction.accountName,
      accountInstitution: transaction.accountInstitution,
      dateLabel: format(new Date(`${transaction.occurredOn}T00:00:00`), "dd MMM", { locale: ptBR }),
      amountCents: transaction.amountCents,
      statusLabel: getStatusLabel(transaction.status),
      kind: transaction.kind,
    })),
    categories: buildCategoryBreakdown(transactions),
    cashflow: [...weekly.entries()].map(([id, point]) => ({
      id,
      label: point.label,
      incomeCents: point.incomeCents,
      expenseCents: point.expenseCents,
    })),
  }
}
