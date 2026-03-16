import { TransactionsPageView } from "@/components/rsc/transactions-page-view"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getClerkUserIdOrThrow } from "@/lib/auth/server"
import { isAppError } from "@/lib/errors/app-error"
import { listAccountsUseCase } from "@/modules/accounts/application/list-accounts-use-case"
import { listTransactionsUseCase } from "@/modules/transactions/application/list-transactions-use-case"
import {
  buildTransactionAccountOptions,
  buildTransactionsPageData,
} from "@/modules/transactions/presentation/view-model"

async function getTransactionsPageState() {
  try {
    const clerkUserId = await getClerkUserIdOrThrow()
    const [accounts, transactions] = await Promise.all([
      listAccountsUseCase({ clerkUserId }),
      listTransactionsUseCase({ clerkUserId }),
    ])

    return {
      data: buildTransactionsPageData(transactions),
      accountOptions: buildTransactionAccountOptions(accounts),
      error: null,
    }
  } catch (error) {
    if (isAppError(error)) {
      return {
        data: null,
        accountOptions: [],
        error,
      }
    }

    throw error
  }
}

export default async function TransactionsPage() {
  const state = await getTransactionsPageState()

  if (state.error) {
    return (
      <div className="space-y-6">
        <Card className="border border-white/10 bg-[#141414] ring-0">
          <CardHeader className="gap-3">
            <CardDescription className="text-[11px] uppercase tracking-[0.35em] text-white/55">
              Lançamentos
            </CardDescription>
            <CardTitle className="text-3xl font-semibold uppercase tracking-[-0.07em] text-white">
              O módulo de lançamentos precisa de autenticação e banco configurados.
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm leading-7 text-white/65">
            {state.error.message}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <TransactionsPageView
      {...state.data}
      accountOptions={state.accountOptions}
      defaultOccurredOn={new Date().toISOString().slice(0, 10)}
    />
  )
}
