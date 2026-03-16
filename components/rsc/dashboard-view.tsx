import { ArrowUpRight, Receipt, ShieldCheck, TrendingUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatCompactCurrency, formatCurrency, formatPercent } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import type { DashboardData } from "@/modules/dashboard/domain/types"

function metricTone(trend: DashboardData["metrics"][number]["trend"]) {
  if (trend === "up") return "text-[#d8f36a]"
  if (trend === "down") return "text-[#ff9c7a]"
  return "text-white"
}

export function DashboardView({
  snapshot,
  metrics,
  accounts,
  transactions,
  obligations,
  categories,
  investments,
}: DashboardData) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border border-white/10 bg-[#141414] ring-0">
          <CardHeader className="gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardDescription className="text-[11px] uppercase tracking-[0.35em] text-white/50">
                  Dashboard
                </CardDescription>
                <CardTitle className="mt-3 max-w-3xl text-4xl font-semibold uppercase tracking-[-0.08em] text-white sm:text-5xl">
                  Visão consolidada da sua vida financeira.
                </CardTitle>
              </div>
              <Badge className="bg-[#d8f36a] px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-black">
                {snapshot.periodLabel}
              </Badge>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
              Acompanhe saldos, contas a pagar, movimentações e investimentos em uma leitura
              rápida do período.
            </p>
          </CardHeader>
        </Card>

        <Card className="border border-black bg-black text-[#f7f3ea] ring-0">
            <CardHeader className="gap-3">
              <CardDescription className="text-[11px] uppercase tracking-[0.35em] text-white/55">
                Resumo do período
              </CardDescription>
            <CardTitle className="text-4xl font-semibold tracking-[-0.08em]">
              {formatCompactCurrency(snapshot.totalBalance)}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 pt-0">
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/50">
                  Patrimônio
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.06em]">
                  {formatCompactCurrency(snapshot.netWorth)}
                </p>
              </div>
              <div className="border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/50">
                  Fatura atual
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.06em]">
                  {formatCompactCurrency(snapshot.currentInvoice)}
                </p>
              </div>
            </div>
            <div className="border border-[#d8f36a]/20 bg-[#d8f36a] p-4 text-black">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.28em] text-black/60">
                  Rentabilidade mensal
                </p>
                <TrendingUp className="size-4" />
              </div>
              <p className="mt-2 text-4xl font-semibold tracking-[-0.08em]">
                {formatPercent(snapshot.monthlyYield)}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border border-white/10 bg-[#151515] ring-0">
            <CardHeader className="gap-3">
              <CardDescription className="text-[11px] uppercase tracking-[0.3em] text-white/55">
                {metric.label}
              </CardDescription>
              <CardTitle className={cn("text-3xl font-semibold tracking-[-0.06em]", metricTone(metric.trend))}>
                {formatCompactCurrency(metric.value)}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-white/60">{metric.deltaLabel}</CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card className="border border-white/10 bg-[#171717] ring-0">
            <CardHeader className="gap-3">
              <CardDescription className="text-[11px] uppercase tracking-[0.3em] text-white/55">
                Contas
              </CardDescription>
              <CardTitle className="text-3xl font-semibold uppercase tracking-[-0.06em] text-white">
                Saldos por conta.
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 pt-0 md:grid-cols-2">
              {accounts.map((account) => (
                <div key={account.id} className="border border-white/10 bg-[#121212] p-4">
                  <div className={cn("h-2 w-20", account.tone)} />
                  <p className="mt-4 text-[11px] uppercase tracking-[0.28em] text-white/45">
                    {account.institution} • {account.type}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.06em] text-white">
                    {account.name}
                  </p>
                  <p className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-white">
                    {formatCurrency(account.balance)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-black bg-black text-[#f7f3ea] ring-0">
            <CardHeader className="gap-3">
              <CardDescription className="text-[11px] uppercase tracking-[0.3em] text-white/55">
                Lançamentos
              </CardDescription>
              <CardTitle className="text-3xl font-semibold uppercase tracking-[-0.06em]">
                Movimentações recentes.
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {transactions.map((transaction, index) => (
                <div key={transaction.id}>
                  <div className="flex items-center justify-between gap-3 py-2">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-white">
                        {transaction.title}
                      </p>
                      <p className="text-sm text-white/55">
                        {transaction.category} • {transaction.dateLabel}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "text-lg font-semibold tracking-[-0.05em]",
                        transaction.kind === "income" ? "text-[#d8f36a]" : "text-[#ff9c7a]"
                      )}
                    >
                      {transaction.amount > 0 ? "+" : "-"}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </p>
                  </div>
                  {index < transactions.length - 1 ? <Separator className="bg-white/10" /> : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border border-white/10 bg-[#171717] ring-0">
            <CardHeader className="gap-3">
              <CardDescription className="text-[11px] uppercase tracking-[0.3em] text-white/55">
                Obrigações
              </CardDescription>
              <CardTitle className="text-3xl font-semibold uppercase tracking-[-0.06em] text-white">
                Compromissos financeiros do ciclo.
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {obligations.map((obligation, index) => (
                <div key={obligation.id}>
                  <div className="grid grid-cols-[1fr_auto] gap-4 py-2">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-white">
                        {obligation.title}
                      </p>
                      <p className="text-sm text-white/55">{obligation.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-white/45">
                        {obligation.dueLabel}
                      </p>
                      <p className="mt-1 text-lg font-semibold tracking-[-0.05em] text-white">
                        {formatCurrency(obligation.amount)}
                      </p>
                    </div>
                  </div>
                  {index < obligations.length - 1 ? <Separator className="bg-white/10" /> : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-white/10 bg-[#171717] ring-0">
            <CardHeader className="gap-3">
              <CardDescription className="text-[11px] uppercase tracking-[0.3em] text-white/55">
                Gastos
              </CardDescription>
              <CardTitle className="text-3xl font-semibold uppercase tracking-[-0.06em] text-white">
                Distribuição do mês por categoria.
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {categories.map((category) => (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="uppercase tracking-[0.18em] text-white">{category.name}</span>
                    <span className="text-white/55">{formatCurrency(category.amount)}</span>
                  </div>
                  <div className="h-3 border border-white/10 bg-white/5">
                    <div className="h-full bg-[#d8f36a]" style={{ width: `${category.share}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-white/10 bg-[#171717] ring-0">
            <CardHeader className="gap-3">
              <CardDescription className="text-[11px] uppercase tracking-[0.3em] text-white/55">
                Patrimônio
              </CardDescription>
              <CardTitle className="text-3xl font-semibold uppercase tracking-[-0.06em] text-white">
                Alocação consolidada e desempenho.
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {investments.map((investment) => (
                <div key={investment.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="uppercase tracking-[0.18em] text-white">{investment.name}</span>
                    <span className={cn(investment.result >= 0 ? "text-[#d8f36a]" : "text-[#ff9c7a]")}>
                      {formatPercent(investment.result)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-3 flex-1 border border-white/10 bg-white/5">
                      <div
                        className="h-full bg-[#c4f1ff]"
                        style={{ width: `${investment.allocation}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-sm text-white/55">
                      {investment.allocation}%
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="border border-white/10 bg-[#131313] ring-0">
          <CardHeader className="gap-3">
            <ShieldCheck className="size-5 text-[#d8f36a]" />
            <CardTitle className="text-xl uppercase tracking-[-0.05em] text-white">
              Leitura clara do panorama
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm leading-7 text-white/60">
            Veja rapidamente quanto entrou, quanto saiu e como está a distribuição do seu
            dinheiro.
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-[#131313] ring-0">
          <CardHeader className="gap-3">
            <Receipt className="size-5 text-[#d8f36a]" />
            <CardTitle className="text-xl uppercase tracking-[-0.05em] text-white">
              Movimentações organizadas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm leading-7 text-white/60">
            Entradas, saídas e compromissos aparecem separados para facilitar a leitura do
            que já aconteceu e do que ainda vem pela frente.
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-[#131313] ring-0">
          <CardHeader className="gap-3">
            <ArrowUpRight className="size-5 text-[#d8f36a]" />
            <CardTitle className="text-xl uppercase tracking-[-0.05em] text-white">
              Decisão com mais contexto
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm leading-7 text-white/60">
            Use o painel para antecipar vencimentos, acompanhar resultados e agir com mais
            segurança no dia a dia.
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
