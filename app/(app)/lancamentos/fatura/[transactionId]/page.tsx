import { format } from "date-fns"
import { notFound } from "next/navigation"

import { CreditCardInvoiceDetailView } from "@/components/rsc/credit-card-invoice-detail-view"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getClerkUserIdOrThrow } from "@/lib/auth/server"
import { isAppError } from "@/lib/errors/app-error"
import { listCreditCardsUseCase } from "@/modules/credit-cards/application/list-credit-cards-use-case"
import { listTransactionCategoriesUseCase } from "@/modules/transactions/application/list-categories-use-case"
import { listTransactionsUseCase } from "@/modules/transactions/application/list-transactions-use-case"
import {
  buildTransactionCategoryOptions,
  buildTransactionCreditCardOptions,
  buildTransactionPageItem,
  buildTransactionsPageData,
} from "@/modules/transactions/presentation/view-model"

async function getInvoiceDetailState(transactionId: string) {
  try {
    const clerkUserId = await getClerkUserIdOrThrow()
    const [cards, transactions, categories] = await Promise.all([
      listCreditCardsUseCase({ clerkUserId }),
      listTransactionsUseCase({ clerkUserId }),
      listTransactionCategoriesUseCase({ clerkUserId }),
    ])

    const record = transactions.transactions.find((item) => item.id === transactionId)

    if (!record) {
      return { notFound: true as const, error: null }
    }

    const pageData = buildTransactionsPageData(
      transactions.transactions,
      transactions.invoiceExpenses,
      {
        selectedDate: format(new Date(), "yyyy-MM-dd"),
        previousTransactions: [],
        totalAccountBalanceCents: 0,
      }
    )

    return {
      notFound: false as const,
      transaction: buildTransactionPageItem(record),
      expenses: pageData.invoiceExpenses[transactionId] ?? [],
      creditCardOptions: buildTransactionCreditCardOptions(cards),
      categoryOptions: buildTransactionCategoryOptions(categories),
      error: null,
    }
  } catch (error) {
    if (isAppError(error)) {
      return { notFound: false as const, error }
    }

    throw error
  }
}

export default async function CreditCardInvoiceDetailPage({
  params,
}: {
  params: Promise<{ transactionId: string }>
}) {
  const { transactionId } = await params
  const state = await getInvoiceDetailState(transactionId)

  if (state.notFound) {
    notFound()
  }

  if (state.error) {
    return (
      <div className="space-y-0">
        <Card className="border border-white/10 bg-[#141414] ring-0">
          <CardHeader className="gap-3">
            <CardDescription className="text-[11px] uppercase tracking-[0.35em] text-white/55">
              Fatura do cartão
            </CardDescription>
            <CardTitle className="text-3xl font-semibold uppercase tracking-[-0.07em] text-white">
              A fatura precisa de autenticação e banco configurados.
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
    <CreditCardInvoiceDetailView
      transaction={state.transaction}
      expenses={state.expenses}
      cardOptions={state.creditCardOptions}
      categoryOptions={state.categoryOptions}
    />
  )
}
