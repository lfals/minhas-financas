import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
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
        "border bg-[#121212] p-4 sm:p-5",
        isOverdue ? "border-red-500" : "border-white/10",
        className
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-start gap-2">
          {kind === "income" ? (
            <Badge
              variant="outline"
              className="border-[#d8f36a]/25 bg-[#d8f36a]/10 px-2 text-[10px] uppercase tracking-[0.14em] text-[#d8f36a]"
            >
              Entrada
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-[#ff9c7a]/25 bg-[#ff9c7a]/10 px-2 text-[10px] uppercase tracking-[0.14em] text-[#ff9c7a]"
            >
              Saída
            </Badge>
          )}
          {badgeLabel ? (
            <Badge
              variant="outline"
              className="border-[#c4f1ff]/30 bg-[#c4f1ff]/10 px-2 text-[10px] uppercase tracking-[0.18em] text-[#c4f1ff]"
            >
              {badgeLabel}
            </Badge>
          ) : null}
          {statusLabel ? (
            <Badge
              variant="outline"
              className={cn(
                "px-2 text-[10px] uppercase tracking-[0.18em]",
                statusClassName
              )}
            >
              {statusLabel}
            </Badge>
          ) : null}
        </div>
        <p className="mt-3 text-lg leading-tight font-semibold tracking-[-0.05em] text-white sm:text-xl">
            {title}
        </p>
      </div>

      <div className="mt-4 border-t border-white/10 pt-4 sm:mt-5 sm:pt-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
          {kind === "income" ? "Valor recebido" : "Valor lançado"}
        </p>
        <div className="mt-2 flex min-w-0 items-center gap-3">
          {kind === "income" ? (
            <ArrowUpRight className="size-4 text-[#d8f36a]" />
          ) : (
            <ArrowDownRight className="size-4 text-[#ff9c7a]" />
          )}
          <p
            className={cn(
              "text-[2rem] leading-none font-semibold tracking-[-0.07em] sm:text-3xl",
              kind === "income" ? "text-[#d8f36a]" : "text-[#ff9c7a]"
            )}
          >
            {isAmountOverridden ? (
              <span className="flex flex-col items-start gap-1">
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
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-3 sm:mt-5 sm:flex-row sm:items-center sm:justify-between sm:pt-4">
        <p className="text-sm leading-6 text-white/50">{metadata}</p>
        {actions ? (
          <div className="flex w-full shrink-0 items-center sm:w-auto sm:justify-end">{actions}</div>
        ) : null}
      </div>
    </div>
  )
}
