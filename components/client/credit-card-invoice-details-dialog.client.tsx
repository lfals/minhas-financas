"use client"

import { useState, type KeyboardEvent, type ReactNode } from "react"
import { ReceiptText } from "lucide-react"

import { CreditCardExpenseChangeCardDialog } from "@/components/client/credit-card-expense-change-card-dialog.client"
import { CreditCardExpenseDetailsDialog } from "@/components/client/credit-card-expense-details-dialog.client"
import { CreditCardExpenseRemoveButton } from "@/components/client/credit-card-expense-remove-button.client"
import { CreditCardExpenseSettleButton } from "@/components/client/credit-card-expense-settle-button.client"
import { ClickPropagationStopper } from "@/components/client/click-propagation-stopper.client"
import { TransactionSettleButton } from "@/components/client/transaction-settle-button.client"
import { TransactionListItem } from "@/components/transaction-list-item"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { formatCompactCurrency } from "@/lib/formatters"
import { cn } from "@/lib/utils"
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

export function CreditCardInvoiceDetailsDialog({
  transaction,
  badgeLabel,
  statusClassName,
  expenses,
  cardOptions,
  categoryOptions,
  children,
}: {
  transaction: TransactionPageItem
  badgeLabel?: string | null
  statusClassName: string
  expenses: CreditCardInvoiceExpensePageItem[]
  cardOptions: TransactionCreditCardOption[]
  categoryOptions: TransactionCategoryOption[]
  children?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const totalInvoiceAmount = transaction.displayAmountCents
  const { fixed, variable, totalDebit } = sumInvoiceExpenseDebitSplit(expenses)
  const barTotal = fixed + variable
  const fixedPct = barTotal > 0 ? Math.round((fixed / barTotal) * 100) : 0
  const variablePct = barTotal > 0 ? Math.max(0, 100 - fixedPct) : 0

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") {
      return
    }

    event.preventDefault()
    setOpen(true)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        >
          {children}
        </div>
      ) : (
        <DialogTrigger asChild>
          <button
            type="button"
            className="inline-flex h-8 shrink-0 items-center justify-center rounded-none border border-white/10 bg-white/5 px-3 text-[10px] uppercase tracking-[0.2em] text-white transition-all hover:bg-white/10"
          >
            Detalhes
          </button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-4xl border border-white/10 bg-[#141414] p-0 pt-10 text-white ring-0">
        <DialogHeader className="shrink-0 border-b border-white/10 px-6 pb-5">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-3">
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/55">Fatura do cartão</p>
              <DialogTitle className="text-3xl font-semibold uppercase tracking-[-0.07em] text-white">
                {transaction.title}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2 text-sm text-white/60">
                {badgeLabel ? (
                  <span className="border border-[#c4f1ff]/30 bg-[#c4f1ff]/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[#c4f1ff]">
                    {badgeLabel}
                  </span>
                ) : null}
                <span
                  className={`border px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${statusClassName}`}
                >
                  {transaction.statusLabel}
                </span>
                <span>{transaction.category}</span>
                <span>•</span>
                <span>{transaction.accountName}</span>
                <span>•</span>
                <span>{transaction.dateLabel}</span>
              </div>
            </div>
            <div className="w-full shrink-0 space-y-4 lg:w-72 lg:text-right">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/45">Total a pagar (fatura)</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[#ff9c7a]">
                  -{formatCompactCurrency(totalInvoiceAmount / 100)}
                </p>
              </div>
              <div className="grid gap-2 rounded-none border border-white/10 bg-black/35 px-4 py-3 text-left lg:text-right">
                <div className="flex flex-row items-center justify-between gap-3 lg:flex-col-reverse lg:items-end lg:gap-1">
                  <span className="text-[9px] uppercase tracking-[0.22em] text-white/38">Variável na fatura</span>
                  <span className="font-mono text-sm font-semibold text-white/80 tabular-nums">
                    −{formatCompactCurrency(variable / 100)}
                  </span>
                </div>
                <div className="flex flex-row items-center justify-between gap-3 border-t border-white/5 pt-2 lg:flex-col-reverse lg:items-end lg:gap-1 lg:pt-2">
                  <span className="text-[9px] uppercase tracking-[0.22em] text-[#c4b5fd]/70">
                    Assinaturas / fixas
                  </span>
                  <span className="font-mono text-sm font-semibold text-[#c4b5fd]/95 tabular-nums">
                    −{formatCompactCurrency(fixed / 100)}
                  </span>
                </div>
                {totalDebit > 0 ? (
                  <div
                    className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]"
                    title={`Variável ~${variablePct}% · Fixas ~${fixedPct}% (lançamentos a débito na lista)`}
                  >
                    <div
                      style={{ flexGrow: Math.max(variable, 1), flexBasis: 0 }}
                      className={cn(
                        variable > 0 ? "min-w-[2px]" : "min-w-0",
                        "bg-[#7a99ff]"
                      )}
                    />
                    <div
                      style={{ flexGrow: Math.max(fixed, 1), flexBasis: 0 }}
                      className={cn(
                        fixed > 0 ? "min-w-[2px]" : "min-w-0",
                        "bg-[#c4b5fd]"
                      )}
                    />
                  </div>
                ) : null}
                <p className="pt-2 text-[10px] leading-relaxed text-white/35 lg:text-right">
                  O total da fatura continua sendo a soma de tudo que entra na cobrança, incluindo estornos e
                  ajustes não mostrados nesse recorte de compras a débito.
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>
        <div className="modal-scroll-body min-h-0 overflow-y-auto px-6 py-5">
          <div className="mb-6 flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-white/45">
            <ReceiptText className="size-4" />
            {expenses.length} lançamentos na fatura
          </div>
          <InvoiceExpenseSections expenses={expenses} cardOptions={cardOptions} categoryOptions={categoryOptions} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function CreditCardInvoiceCardActions({
  transactionId,
  originalAmountCents,
  isCompensated,
}: {
  transactionId: string
  originalAmountCents: number
  isCompensated: boolean
}) {
  return (
    <div
      onClick={(event) => {
        event.stopPropagation()
      }}
    >
      <TransactionSettleButton
        transactionId={transactionId}
        originalAmountCents={originalAmountCents}
        isCompensated={isCompensated}
      />
    </div>
  )
}
