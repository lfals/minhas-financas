import { format } from "date-fns"

import { TransactionsPageView } from "@/components/rsc/transactions-page-view"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getClerkUserIdOrThrow } from "@/lib/auth/server"
import { isAppError } from "@/lib/errors/app-error"
import { listAccountsUseCase } from "@/modules/accounts/application/list-accounts-use-case"
import { listCreditCardsUseCase } from "@/modules/credit-cards/application/list-credit-cards-use-case"
import { listTransactionsUseCase } from "@/modules/transactions/application/list-transactions-use-case"
import {
  buildTransactionAccountOptions,
  buildTransactionCategoryOptions,
  buildTransactionCreditCardOptions,
  buildTransactionsPageData,
} from "@/modules/transactions/presentation/view-model"

function getTodayIsoDate() {
  return format(new Date(), "yyyy-MM-dd")
}

function getSelectedDate(value?: string | string[]) {
  const rawValue = Array.isArray(value) ? value[0] : value

  if (!rawValue || !/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return getTodayIsoDate()
  }

  const parsedDate = new Date(`${rawValue}T00:00:00`)

  if (Number.isNaN(parsedDate.getTime())) {
    return getTodayIsoDate()
  }

  return rawValue
}

async function getTransactionsPageState(selectedDate: string) {
  try {
    const clerkUserId = await getClerkUserIdOrThrow()
    const [accounts, cards, transactions] = await Promise.all([
      listAccountsUseCase({ clerkUserId }),
      listCreditCardsUseCase({ clerkUserId }),
      listTransactionsUseCase({ clerkUserId }),
    ])
    const selectedMonth = selectedDate.slice(0, 7)
    const transactionsInMonth = transactions.filter((transaction) =>
      transaction.occurredOn.startsWith(selectedMonth)
    )

    return {
      data: buildTransactionsPageData(transactionsInMonth, { selectedDate }),
      accountOptions: buildTransactionAccountOptions(accounts),
      creditCardOptions: buildTransactionCreditCardOptions(cards),
      categoryOptions: buildTransactionCategoryOptions(transactions),
      error: null,
    }
  } catch (error) {
    if (isAppError(error)) {
      return {
        data: null,
        accountOptions: [],
        creditCardOptions: [],
        categoryOptions: [],
        error,
      }
    }

    throw error
  }
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string | string[] }>
}) {
  const resolvedSearchParams = await searchParams
  const selectedDate = getSelectedDate(resolvedSearchParams.date)
  const state = await getTransactionsPageState(selectedDate)

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
      creditCardOptions={state.creditCardOptions}
      categoryOptions={state.categoryOptions}
      defaultOccurredOn={selectedDate}
      selectedDate={selectedDate}
    />
  )
}
