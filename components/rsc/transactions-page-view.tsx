import { ArrowDownRight, ArrowUpRight, CalendarClock, ReceiptText } from "lucide-react"

import { TransactionCreateDialog } from "@/components/client/transaction-create-dialog.client"
import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCompactCurrency } from "@/lib/formatters"
import { formatCents } from "@/lib/money"
import { cn } from "@/lib/utils"
import type { TransactionAccountOption, TransactionsPageData } from "@/modules/transactions/domain/types"

function metricToneClass(tone: TransactionsPageData["metrics"][number]["tone"]) {
  if (tone === "income") return "text-[#d8f36a]"
  if (tone === "expense") return "text-[#ff9c7a]"
  return "text-white"
}

function statusTone(status: TransactionsPageData["transactions"][number]["statusLabel"]) {
  if (status === "Compensado") return "border-white/10 bg-white/5 text-white/70"
  if (status === "Pendente") return "border-[#ffe07a]/30 bg-[#ffe07a]/10 text-[#ffe07a]"
  return "border-[#c4f1ff]/30 bg-[#c4f1ff]/10 text-[#c4f1ff]"
}

export function TransactionsPageView({
  periodLabel,
  summary,
  metrics,
  transactions,
  categories,
  cashflow,
  accountOptions,
  defaultOccurredOn,
}: TransactionsPageData & {
  accountOptions: TransactionAccountOption[]
  defaultOccurredOn: string
}) {
  const maxCashflow = Math.max(
    1,
    ...cashflow.flatMap((point) => [point.incomeCents, point.expenseCents])
  )

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border border-white/10 bg-[#151515] ring-0">
            <CardHeader className="gap-3">
              <CardDescription className="text-[11px] uppercase tracking-[0.3em] text-white/55">
                {metric.label}
              </CardDescription>
              <CardTitle className={cn("text-3xl font-semibold tracking-[-0.06em]", metricToneClass(metric.tone))}>
                {formatCompactCurrency(metric.valueCents / 100)}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-white/60">{metric.detail}</CardContent>
          </Card>
        ))}
      </section>

      <section>
        <Card className="border border-white/10 bg-[#171717] ring-0">
          <CardHeader className="gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardDescription className="text-[11px] uppercase tracking-[0.35em] text-white/55">
                  Lançamentos
                </CardDescription>
                <CardTitle className="text-3xl font-semibold uppercase tracking-[-0.07em] text-white">
                  {summary.title}
                </CardTitle>
              </div>
            </div>
            <CardAction className="flex flex-wrap items-center gap-3">
              <Badge className="bg-[#d8f36a] px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-black">
                {periodLabel}
              </Badge>
              <TransactionCreateDialog
                accountOptions={accountOptions}
                defaultOccurredOn={defaultOccurredOn}
              />
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-6 pt-0 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-white/45">
                <ReceiptText className="size-4" />
                {transactions.length} lançamentos
              </div>
              {transactions.length ? (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="grid gap-4 border border-white/10 bg-[#121212] p-4 md:grid-cols-[1fr_auto]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm uppercase tracking-[0.18em] text-white">
                          {transaction.title}
                        </p>
                        <span
                          className={cn(
                            "border px-2 py-1 text-[10px] uppercase tracking-[0.18em]",
                            statusTone(transaction.statusLabel)
                          )}
                        >
                          {transaction.statusLabel}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-white/55">
                        {transaction.category} • {transaction.accountName} • {transaction.dateLabel}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 md:text-right">
                      {transaction.kind === "income" ? (
                        <ArrowUpRight className="size-4 text-[#d8f36a]" />
                      ) : (
                        <ArrowDownRight className="size-4 text-[#ff9c7a]" />
                      )}
                      <p
                        className={cn(
                          "text-lg font-semibold tracking-[-0.05em]",
                          transaction.kind === "income" ? "text-[#d8f36a]" : "text-[#ff9c7a]"
                        )}
                      >
                        {transaction.kind === "income" ? "+" : "-"}
                        {formatCents(transaction.amountCents)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="border border-dashed border-white/10 bg-[#121212] p-6 text-sm leading-7 text-white/60">
                  Nenhum lançamento registrado ainda. Use o botão acima para adicionar a primeira movimentação.
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="border border-white/10 bg-[#121212] p-4">
                <div className="flex items-center gap-3">
                  <CalendarClock className="size-4 text-[#d8f36a]" />
                  <p className="text-[11px] uppercase tracking-[0.3em] text-white/55">
                    Ritmo do caixa
                  </p>
                </div>
                <p className="mt-3 text-xl font-semibold uppercase tracking-[-0.05em] text-white">
                  Entradas e saídas por bloco.
                </p>
                <div className="mt-4 space-y-4">
                  {cashflow.map((point) => (
                    <div key={point.id} className="space-y-2">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="uppercase tracking-[0.18em] text-white">{point.label}</span>
                        <span className="text-white/55">
                          {formatCompactCurrency((point.incomeCents - point.expenseCents) / 100)}
                        </span>
                      </div>
                      <div className="grid gap-2">
                        <div className="h-3 border border-white/10 bg-white/5">
                          <div
                            className="h-full bg-[#d8f36a]"
                            style={{ width: `${(point.incomeCents / maxCashflow) * 100}%` }}
                          />
                        </div>
                        <div className="h-3 border border-white/10 bg-white/5">
                          <div
                            className="h-full bg-[#ff9c7a]"
                            style={{ width: `${(point.expenseCents / maxCashflow) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-white/10 bg-[#121212] p-4">
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/55">
                  Pressão por categoria
                </p>
                <p className="mt-3 text-xl font-semibold uppercase tracking-[-0.05em] text-white">
                  Para onde o dinheiro está indo.
                </p>
                <div className="mt-4 space-y-4">
                  {categories.length ? (
                    categories.map((category) => (
                      <div key={category.id} className="space-y-2">
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <span className="uppercase tracking-[0.18em] text-white">{category.name}</span>
                          <span className="text-white/55">{formatCents(category.amountCents)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-3 flex-1 border border-white/10 bg-white/5">
                            <div className="h-full bg-[#c4f1ff]" style={{ width: `${category.share}%` }} />
                          </div>
                          <span className="w-10 text-right text-sm text-white/55">{category.share}%</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="border border-dashed border-white/10 bg-[#0f0f0f] p-6 text-sm leading-7 text-white/60">
                      As categorias aparecem conforme você registra despesas.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
