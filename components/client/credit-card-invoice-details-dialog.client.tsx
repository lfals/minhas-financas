"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import { ReceiptText } from "lucide-react"

import { CreditCardExpenseRemoveButton } from "@/components/client/credit-card-expense-remove-button.client"
import { TransactionSettleButton } from "@/components/client/transaction-settle-button.client"
import { TransactionListItem } from "@/components/transaction-list-item"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { formatCompactCurrency } from "@/lib/formatters"
import type {
  CreditCardInvoiceExpensePageItem,
  TransactionPageItem,
} from "@/modules/transactions/domain/types"

function InvoiceExpenseList({
  expenses,
}: {
  expenses: CreditCardInvoiceExpensePageItem[]
}) {
  if (!expenses.length) {
    return (
      <div className="border border-dashed border-white/10 bg-[#121212] p-6 text-sm leading-7 text-white/60">
        Nenhum lançamento foi encontrado para esta fatura.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <TransactionListItem
          key={expense.id}
          title={expense.title}
          metadata={`${expense.category} • ${expense.cardName} • ${expense.dateLabel}`}
          amountCents={Math.abs(expense.amountCents)}
          kind={expense.amountCents < 0 ? "income" : "expense"}
          actions={
            expense.notes === "__credit_card_invoice_settlement_adjustment__" ? null : (
              <CreditCardExpenseRemoveButton
                expenseId={expense.id}
                expenseTitle={expense.title}
                installmentTotal={expense.installmentTotal}
                supportsFutureRemoval={expense.supportsFutureRemoval}
              />
            )
          }
        />
      ))}
    </div>
  )
}

export function CreditCardInvoiceDetailsDialog({
  transaction,
  badgeLabel,
  statusClassName,
  expenses,
  children,
}: {
  transaction: TransactionPageItem
  badgeLabel?: string | null
  statusClassName: string
  expenses: CreditCardInvoiceExpensePageItem[]
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const totalInvoiceAmount = transaction.displayAmountCents

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] max-w-4xl flex-col overflow-hidden border border-white/10 bg-[#141414] p-0 pt-10 text-white ring-0">
        <DialogHeader className="shrink-0 border-b border-white/10 px-6 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
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
            <div className="shrink-0 text-right">
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/45">Total da fatura</p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[#ff9c7a]">
                -{formatCompactCurrency(totalInvoiceAmount / 100)}
              </p>
            </div>
          </div>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto px-6 py-5">
          <div className="mb-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-white/45">
            <ReceiptText className="size-4" />
            {expenses.length} lançamentos na fatura
          </div>
          <InvoiceExpenseList expenses={expenses} />
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
