"use client"

import { format } from "date-fns"
import { useCallback, useMemo, useState, type KeyboardEvent, type ReactNode } from "react"

import {
  TransactionCreateForm,
  type TransactionFormValues,
} from "@/components/client/transaction-create-form.client"
import { TransactionInstallmentsDetailsDialog } from "@/components/client/transaction-installments-details-dialog.client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type {
  TransactionAccountOption,
  TransactionCategoryOption,
  TransactionCreditCardOption,
  TransactionPageItem,
  TransactionTitleSuggestion,
} from "@/modules/transactions/domain/types"

function formatCentsToInput(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100)
}

function getCadence(transaction: TransactionPageItem): TransactionFormValues["cadence"] {
  if (transaction.isFixed) {
    return "fixed"
  }

  if (transaction.installmentTotal) {
    return "installment"
  }

  return "single"
}

function buildInitialValues(transaction: TransactionPageItem): TransactionFormValues {
  return {
    transactionId: transaction.id,
    accountId: transaction.accountId,
    cardId: "",
    title: transaction.title,
    category: transaction.category,
    kind: transaction.kind,
    status: transaction.status,
    amount: formatCentsToInput(transaction.displayAmountCents),
    occurredOn: transaction.occurredOn,
    cadence: getCadence(transaction),
    isFixed: transaction.isFixed,
    fixedExpenseFrequency: transaction.fixedExpenseFrequency ?? "monthly",
    installmentNumber: transaction.installmentNumber ? String(transaction.installmentNumber) : "1",
    installmentTotal: transaction.installmentTotal ? String(transaction.installmentTotal) : "2",
    installmentAmountInputMode: "installment",
    targetInvoiceMonth: format(new Date(), "yyyy-MM"),
  }
}

export function TransactionDetailsDialog({
  transaction,
  accountOptions,
  creditCardOptions,
  categoryOptions,
  titleSuggestions,
  installments = [],
  children,
}: {
  transaction: TransactionPageItem
  accountOptions: TransactionAccountOption[]
  creditCardOptions: TransactionCreditCardOption[]
  categoryOptions: TransactionCategoryOption[]
  titleSuggestions: TransactionTitleSuggestion[]
  installments?: TransactionPageItem[]
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const formInitialValues = useMemo(() => buildInitialValues(transaction), [transaction])
  const handleSaveSuccess = useCallback(() => {
    setOpen(false)
  }, [])
  const isInstallmentSeries =
    typeof transaction.installmentTotal === "number" && transaction.installmentTotal > 1
  const installmentItems = installments.length ? installments : [transaction]

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") {
      return
    }

    event.preventDefault()
    setOpen(true)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#d8f36a]/60 focus-visible:ring-offset-0"
      >
        {children}
      </div>
      <DialogContent className="max-w-2xl border border-white/10 bg-[#141414] p-0 text-white ring-0">
        <DialogHeader className="shrink-0 border-b border-white/10 px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-3xl font-semibold uppercase tracking-[-0.07em] text-white">
              Detalhes do lançamento
            </DialogTitle>
            {isInstallmentSeries ? (
              <TransactionInstallmentsDetailsDialog
                transaction={transaction}
                installments={installmentItems}
              >
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 border-white/10 bg-white/5 px-3 text-[10px] uppercase tracking-[0.18em] text-white hover:bg-white/10 sm:tracking-[0.2em]"
                >
                  Ver parcelas
                </Button>
              </TransactionInstallmentsDetailsDialog>
            ) : null}
          </div>
        </DialogHeader>
        <div className="modal-scroll-body min-h-0 overflow-y-auto px-6 py-5">
          {open ? (
            <TransactionCreateForm
              key={transaction.id}
              accountOptions={accountOptions}
              creditCardOptions={creditCardOptions}
              categoryOptions={categoryOptions}
              titleSuggestions={titleSuggestions}
              defaultOccurredOn={transaction.occurredOn}
              initialValues={formInitialValues}
              mode="flat"
              actionType="update"
              submitLabel="Salvar alterações"
              onSuccess={handleSaveSuccess}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
