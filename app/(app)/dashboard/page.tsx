import { DashboardView } from "@/components/rsc/dashboard-view"
import {
  getDashboardAccounts,
  getDashboardCategories,
  getDashboardInvestments,
  getDashboardMetrics,
  getDashboardObligations,
  getDashboardSnapshot,
  getDashboardTransactions,
} from "@/modules/dashboard/infrastructure/mock-dashboard"

export default async function DashboardPage() {
  const [snapshot, metrics, accounts, transactions, obligations, categories, investments] =
    await Promise.all([
      getDashboardSnapshot(),
      getDashboardMetrics(),
      getDashboardAccounts(),
      getDashboardTransactions(),
      getDashboardObligations(),
      getDashboardCategories(),
      getDashboardInvestments(),
    ])

  return (
    <DashboardView
      snapshot={snapshot}
      metrics={metrics}
      accounts={accounts}
      transactions={transactions}
      obligations={obligations}
      categories={categories}
      investments={investments}
    />
  )
}
