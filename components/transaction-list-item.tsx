import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import type { ReactNode } from "react"

import { formatCents } from "@/lib/money"
import { cn } from "@/lib/utils"

type TransactionListItemProps = {
  title: string
  metadata: string
  amountCents: number
  displayAmountCents?: number
  isAmountOverridden?: boolean
  kind: "income" | "expense"
  badgeLabel?: string | null
  statusLabel?: string | null
  statusClassName?: string
  isOverdue?: boolean
  actions?: ReactNode
  className?: string
}

export function TransactionListItem({
  title,
  metadata,
  amountCents,
  displayAmountCents = amountCents,
  isAmountOverridden = false,
  kind,
  badgeLabel,
  statusLabel,
  statusClassName,
  isOverdue = false,
  actions,
  className,
}: TransactionListItemProps) {
  return (
    <div
      className={cn(
        "border bg-[#121212] p-4",
        isOverdue ? "border-red-500" : "border-white/10",
        className
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm uppercase tracking-[0.18em] text-white">{title}</p>
          {badgeLabel ? (
            <span className="border border-[#c4f1ff]/30 bg-[#c4f1ff]/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[#c4f1ff]">
              {badgeLabel}
            </span>
          ) : null}
          {statusLabel ? (
            <span
              className={cn(
                "border px-2 py-1 text-[10px] uppercase tracking-[0.18em]",
                statusClassName
              )}
            >
              {statusLabel}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-white/55">{metadata}</p>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {kind === "income" ? (
            <ArrowUpRight className="size-4 text-[#d8f36a]" />
          ) : (
            <ArrowDownRight className="size-4 text-[#ff9c7a]" />
          )}
          <p
            className={cn(
              "text-lg font-semibold tracking-[-0.05em]",
              kind === "income" ? "text-[#d8f36a]" : "text-[#ff9c7a]"
            )}
          >
            {isAmountOverridden ? (
              <span className="flex flex-col items-start md:items-end">
                <span className="text-sm font-medium text-white/35 line-through decoration-white/35">
                  {kind === "income" ? "+" : "-"}
                  {formatCents(amountCents)}
                </span>
                <span>
                  {kind === "income" ? "+" : "-"}
                  {formatCents(displayAmountCents)}
                </span>
              </span>
            ) : (
              <>
                {kind === "income" ? "+" : "-"}
                {formatCents(displayAmountCents)}
              </>
            )}
          </p>
        </div>
        {actions ? <div className="flex shrink-0 items-center">{actions}</div> : null}
      </div>
    </div>
  )
}
