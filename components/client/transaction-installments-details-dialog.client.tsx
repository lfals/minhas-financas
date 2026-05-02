"use client"

import { ReceiptText } from "lucide-react"
import type { ReactNode } from "react"

import { TransactionListItem } from "@/components/transaction-list-item"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { formatCompactCurrency } from "@/lib/formatters"
import type { TransactionPageItem } from "@/modules/transactions/domain/types"
import { getInstallmentLabel } from "@/modules/transactions/presentation/view-model"

type TransactionInstallmentsDetailsDialogProps = {
  transaction: TransactionPageItem
  installments: TransactionPageItem[]
  children: ReactNode
}

function statusTone(status: TransactionPageItem["statusLabel"]) {
  if (status === "Compensado") return "border-white/10 bg-white/5 text-white/70"
  if (status === null) return ""
  return "border-[#c4f1ff]/30 bg-[#c4f1ff]/10 text-[#c4f1ff]"
}

export function TransactionInstallmentsDetailsDialog({
  transaction,
  installments,
  children,
}: TransactionInstallmentsDetailsDialogProps) {
  const titleLabel = getInstallmentLabel(transaction.installmentNumber, transaction.installmentTotal) ?? "Parcelado"
  const orderedInstallments = [...installments].sort((left, right) => {
    if (
      left.installmentNumber !== null &&
      left.installmentNumber !== undefined &&
      right.installmentNumber !== null &&
      right.installmentNumber !== undefined
    ) {
      if (left.installmentNumber !== right.installmentNumber) {
        return left.installmentNumber - right.installmentNumber
      }
    }

    return left.occurredOn.localeCompare(right.occurredOn)
  })

  const totalAmount = orderedInstallments.reduce(
    (sum, installment) => sum + installment.displayAmountCents,
    0
  )
  const totalPendingAmount = orderedInstallments
    .filter((installment) => installment.status !== "compensated")
    .reduce((sum, installment) => sum + installment.displayAmountCents, 0)

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl border border-white/10 bg-[#141414] p-0 pt-10 text-white ring-0">
        <DialogHeader className="shrink-0 border-b border-white/10 px-6 pb-5">
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/55">Parcelas do lançamento</p>
            <DialogTitle className="text-3xl font-semibold uppercase tracking-[-0.07em] text-white">
              {transaction.title}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              <span>{titleLabel} • </span>
              {transaction.category} • {transaction.accountName} • {transaction.dateLabel}
            </DialogDescription>
            <div className="text-sm text-white/70">
              Total da série:{" "}
              <strong>{formatCompactCurrency(totalAmount / 100)}</strong>
            </div>
            <div className="text-sm text-white/70">
              Total pendente:{" "}
              <strong>{formatCompactCurrency(totalPendingAmount / 100)}</strong>
            </div>
          </div>
        </DialogHeader>
        <div className="modal-scroll-body min-h-0 overflow-y-auto px-6 py-5">
          <div className="mb-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-white/45">
            <ReceiptText className="size-4" />
            {orderedInstallments.length} parcela{orderedInstallments.length === 1 ? "" : "s"}
          </div>
          <div className="space-y-3">
            {orderedInstallments.map((item) => (
              <TransactionListItem
                key={item.id}
                title={item.title}
                badgeLabel={getInstallmentLabel(item.installmentNumber, item.installmentTotal)}
                statusLabel={item.statusLabel}
                statusClassName={statusTone(item.statusLabel)}
                metadata={`${item.category} • ${item.accountName} • ${item.dateLabel}`}
                amountCents={item.amountCents}
                displayAmountCents={item.displayAmountCents}
                isAmountOverridden={item.isAmountOverridden}
                kind={item.kind}
                isOverdue={item.isOverdue}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
