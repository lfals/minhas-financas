import Link from "next/link"
import { ArrowLeft, ReceiptText } from "lucide-react"

import { CreditCardExpenseChangeCardDialog } from "@/components/client/credit-card-expense-change-card-dialog.client"
import { CreditCardExpenseDetailsDialog } from "@/components/client/credit-card-expense-details-dialog.client"
import { CreditCardExpenseRemoveButton } from "@/components/client/credit-card-expense-remove-button.client"
import { CreditCardExpenseSettleButton } from "@/components/client/credit-card-expense-settle-button.client"
import { ClickPropagationStopper } from "@/components/client/click-propagation-stopper.client"
import { TransactionListItem } from "@/components/transaction-list-item"
import { formatCompactCurrency } from "@/lib/formatters"
import { CREDIT_CARD_INVOICE_SETTLEMENT_ADJUSTMENT_NOTE } from "@/modules/transactions/domain/credit-card-invoice-notes"
import { sumInvoiceExpenseDebitSplit } from "@/modules/transactions/presentation/invoice-expense-debit-split"
import type {
  CreditCardInvoiceExpensePageItem,
  TransactionCategoryOption,
  TransactionCreditCardOption,
  TransactionPageItem,
} from "@/modules/transactions/domain/types"

function InvoiceExpenseSections({
  expenses,
  cardOptions,
  categoryOptions,
}: {
  expenses: CreditCardInvoiceExpensePageItem[]
  cardOptions: TransactionCreditCardOption[]
  categoryOptions: TransactionCategoryOption[]
}) {
  if (!expenses.length) {
    return (
      <div className="border border-dashed border-white/10 bg-[#121212] p-6 text-sm leading-7 text-white/60">
        Nenhum lançamento foi encontrado para esta fatura.
      </div>
    )
  }

  const variableExpenses = expenses.filter((expense) => !expense.isFixed)
  const fixedExpenses = expenses.filter((expense) => expense.isFixed)

  function renderExpenseRow(expense: CreditCardInvoiceExpensePageItem, keySuffix: string) {
    const listItem = (
      <TransactionListItem
        title={expense.title}
        metadata={`${expense.category} • ${expense.cardName} • ${expense.dateLabel}${expense.isEffective ? "" : " • Não contabilizado no limite"}${expense.isFixed ? " • Assinatura ou fixo" : ""}`}
        amountCents={Math.abs(expense.amountCents)}
        kind={expense.amountCents < 0 ? "income" : "expense"}
        badgeLabel={
          expense.isEffective
            ? expense.isFixed
              ? "Fixa"
              : null
            : expense.isFixed
              ? "Fixa aguardando"
              : "Agendado"
        }
        className="transition-colors hover:bg-[#161616]"
        actions={
          expense.notes === CREDIT_CARD_INVOICE_SETTLEMENT_ADJUSTMENT_NOTE ? null : (
            <ClickPropagationStopper>
              <div className="flex items-center gap-2">
                <CreditCardExpenseChangeCardDialog
                  expenseId={expense.id}
                  expenseTitle={expense.title}
                  currentCardId={expense.cardId}
                  cardOptions={cardOptions}
                />
                {expense.isEffective ? null : <CreditCardExpenseSettleButton expenseId={expense.id} />}
                <CreditCardExpenseRemoveButton
                  expenseId={expense.id}
                  expenseTitle={expense.title}
                  installmentTotal={expense.installmentTotal}
                  supportsFutureRemoval={expense.supportsFutureRemoval}
                />
              </div>
            </ClickPropagationStopper>
          )
        }
      />
    )

    if (expense.notes === CREDIT_CARD_INVOICE_SETTLEMENT_ADJUSTMENT_NOTE) {
      return <div key={`${expense.id}:${keySuffix}`}>{listItem}</div>
    }

    return (
      <CreditCardExpenseDetailsDialog key={`${expense.id}:${keySuffix}`} expense={expense} categoryOptions={categoryOptions}>
        {listItem}
      </CreditCardExpenseDetailsDialog>
    )
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/35">
          Variável na fatura ({variableExpenses.length})
        </h3>
        {variableExpenses.length ? (
          <div className="space-y-3">{variableExpenses.map((e) => renderExpenseRow(e, "var"))}</div>
        ) : (
          <p className="rounded-none border border-dashed border-white/10 bg-[#121212]/80 px-4 py-3 text-xs text-white/45">
            Nenhuma compra pontual registrada nesta fatura.
          </p>
        )}
      </div>
      <div className="space-y-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#c4b5fd]/70">
          Assinaturas e recorrências ({fixedExpenses.length})
        </h3>
        {fixedExpenses.length ? (
          <div className="space-y-3">{fixedExpenses.map((e) => renderExpenseRow(e, "fix"))}</div>
        ) : (
          <p className="rounded-none border border-dashed border-white/10 bg-[#121212]/80 px-4 py-3 text-xs text-white/45">
            Nenhuma despesa fixa de cartão nesta fatura.
          </p>
        )}
      </div>
    </div>
  )
}

export function CreditCardInvoiceDetailView({
  transaction,
  expenses,
  cardOptions,
  categoryOptions,
}: {
  transaction: TransactionPageItem
  expenses: CreditCardInvoiceExpensePageItem[]
  cardOptions: TransactionCreditCardOption[]
  categoryOptions: TransactionCategoryOption[]
}) {
  const totalInvoiceAmount = transaction.displayAmountCents
  const { fixed, variable } = sumInvoiceExpenseDebitSplit(expenses)

  return (
    <div className="space-y-0">
      <Link
        href="/lancamentos"
        className="mb-6 mt-8 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-white/45 transition-colors hover:text-white/80"
      >
        <ArrowLeft className="size-4" />
        Voltar para lançamentos
      </Link>

      <section className="border border-white/10 bg-[#141414] text-white">
        <div className="flex flex-col gap-4 border-b border-white/10 px-6 pb-6 pt-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-2">
            <h1 className="text-2xl font-semibold uppercase tracking-[-0.06em] text-white sm:text-3xl">
              {transaction.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/45">
              <span>{transaction.category}</span>
              <span>•</span>
              <span>{transaction.accountName}</span>
              <span>•</span>
              <span>{transaction.dateLabel}</span>
              {transaction.statusLabel ? (
                <>
                  <span>•</span>
                  <span>{transaction.statusLabel}</span>
                </>
              ) : null}
            </div>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">Total a pagar</p>
            <p className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-[#ff9c7a]">
              -{formatCompactCurrency(totalInvoiceAmount / 100)}
            </p>
            <p className="mt-1 text-[11px] text-white/40">
              Variável −{formatCompactCurrency(variable / 100)}
              <span className="px-1.5 text-white/20">·</span>
              <span className="text-[#c4b5fd]/70">Fixas −{formatCompactCurrency(fixed / 100)}</span>
            </p>
          </div>
        </div>
        <div className="px-6 py-6">
          <div className="mb-6 flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-white/45">
            <ReceiptText className="size-4" />
            {expenses.length} lançamentos na fatura
          </div>
          <InvoiceExpenseSections expenses={expenses} cardOptions={cardOptions} categoryOptions={categoryOptions} />
        </div>
      </section>
    </div>
  )
}
