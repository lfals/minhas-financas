import { DashboardView } from "@/components/rsc/dashboard-view"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getClerkUserIdOrThrow } from "@/lib/auth/server"
import { isAppError } from "@/lib/errors/app-error"
import { listAccountsUseCase } from "@/modules/accounts/application/list-accounts-use-case"
import { buildDashboardData, normalizeDashboardFilter } from "@/modules/dashboard/presentation/view-model"
import { listTransactionsUseCase } from "@/modules/transactions/application/list-transactions-use-case"

async function getDashboardPageState(
  searchParams?: Promise<{
    mode?: string | string[]
    month?: string | string[]
    startDate?: string | string[]
    endDate?: string | string[]
  }>
) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const filter = normalizeDashboardFilter(resolvedSearchParams)

  try {
    const clerkUserId = await getClerkUserIdOrThrow()
    const [accounts, transactions] = await Promise.all([
      listAccountsUseCase({ clerkUserId }),
      listTransactionsUseCase({ clerkUserId }),
    ])

    return {
      data: buildDashboardData({
        accounts,
        transactions: transactions.transactions,
        filter,
      }),
      error: null,
    }
  } catch (error) {
    if (isAppError(error)) {
      return {
        data: null,
        error,
      }
    }

    throw error
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{
    mode?: string | string[]
    month?: string | string[]
    startDate?: string | string[]
    endDate?: string | string[]
  }>
}) {
  const state = await getDashboardPageState(searchParams)

  if (state.error) {
    return (
      <div className="space-y-0">
        <Card className="border border-white/10 bg-[#141414] ring-0">
          <CardHeader className="gap-3">
            <CardDescription className="text-[11px] uppercase tracking-[0.35em] text-white/55">
              Dashboard
            </CardDescription>
            <CardTitle className="text-3xl font-semibold uppercase tracking-[-0.07em] text-white">
              O dashboard precisa de autenticação e banco configurados.
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm leading-7 text-white/65">
            {state.error.message}
          </CardContent>
        </Card>
      </div>
    )
  }

  return <DashboardView {...state.data} />
}
