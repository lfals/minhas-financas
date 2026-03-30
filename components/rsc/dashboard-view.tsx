import { ArrowUpRight, Receipt, ShieldCheck, TrendingUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { ResponsiveMetrics } from "@/components/client/responsive-metrics.client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatCompactCurrency, formatCurrency, formatPercent } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import type { DashboardData } from "@/modules/dashboard/domain/types"
import { SummaryMetricCard } from "@/components/rsc/summary-metric-card"

function metricTone(trend: DashboardData["metrics"][number]["trend"]) {
  if (trend === "up") return "text-[#d8f36a]"
  if (trend === "down") return "text-[#ff9c7a]"
  return "text-white"
}

function DashboardMetricCard({
  label,
  value,
  trend,
  deltaLabel,
}: DashboardData["metrics"][number]) {
  return (
    <SummaryMetricCard
      label={label}
      value={formatCompactCurrency(value)}
      detail={deltaLabel}
      valueClassName={metricTone(trend)}
    />
  )
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
          <CardHeader className="gap-4 sm:gap-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <CardDescription className="text-[11px] uppercase tracking-[0.35em] text-white/50">
                  Dashboard
                </CardDescription>
                <CardTitle className="mt-3 max-w-3xl text-3xl font-semibold uppercase tracking-[-0.08em] text-white sm:text-4xl lg:text-5xl">
                  Visão consolidada da sua vida financeira.
                </CardTitle>
              </div>
              <Badge className="w-fit bg-[#d8f36a] px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-black">
                {snapshot.periodLabel}
              </Badge>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-white/65 sm:text-base sm:leading-7">
              Acompanhe saldos, contas a pagar, movimentações e investimentos em uma leitura
              rápida do período.
            </p>
          </CardHeader>
        </Card>

        <Card className="border border-black bg-black text-[#f7f3ea] ring-0">
          <CardHeader className="gap-2 sm:gap-3">
            <CardDescription className="text-[10px] uppercase tracking-[0.24em] text-white/55 sm:text-[11px] sm:tracking-[0.35em]">
              Resumo do período
            </CardDescription>
            <CardTitle className="text-[2rem] leading-none font-semibold tracking-[-0.08em] sm:text-4xl">
              {formatCompactCurrency(snapshot.totalBalance)}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 pt-0 sm:gap-4">
            <ResponsiveMetrics
              mobileItemClassName="basis-[84%] pl-3"
              gridClassName="sm:grid-cols-2 sm:gap-3"
            >
              <div className="border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/50 sm:text-[11px] sm:tracking-[0.28em]">
                  Patrimônio
                </p>
                <p className="mt-2 text-xl leading-none font-semibold tracking-[-0.06em] sm:text-2xl">
                  {formatCompactCurrency(snapshot.netWorth)}
                </p>
              </div>
              <div className="border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/50 sm:text-[11px] sm:tracking-[0.28em]">
                  Fatura atual
                </p>
                <p className="mt-2 text-xl leading-none font-semibold tracking-[-0.06em] sm:text-2xl">
                  {formatCompactCurrency(snapshot.currentInvoice)}
                </p>
              </div>
            </ResponsiveMetrics>
            <div className="border border-[#d8f36a]/20 bg-[#d8f36a] p-3 text-black sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.22em] text-black/60 sm:text-[11px] sm:tracking-[0.28em]">
                  Rentabilidade mensal
                </p>
                <TrendingUp className="size-4" />
              </div>
              <p className="mt-2 text-[2rem] leading-none font-semibold tracking-[-0.08em] sm:text-4xl">
                {formatPercent(snapshot.monthlyYield)}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <ResponsiveMetrics gridClassName="sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {metrics.map((metric) => (
          <DashboardMetricCard key={metric.label} {...metric} />
        ))}
      </ResponsiveMetrics>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card className="border border-white/10 bg-[#171717] ring-0">
            <CardHeader className="gap-3">
              <CardDescription className="text-[11px] uppercase tracking-[0.3em] text-white/55">
                Contas
              </CardDescription>
              <CardTitle className="text-2xl font-semibold uppercase tracking-[-0.06em] text-white sm:text-3xl">
                Saldos por conta.
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 pt-0 md:grid-cols-2">
              {accounts.map((account) => (
                <div key={account.id} className="border border-white/10 bg-[#121212] p-4">
                  <div className={cn("h-2 w-20", account.tone)} />
                  <p className="mt-4 text-[11px] uppercase tracking-[0.28em] text-white/45">
                    {account.type}
                  </p>
                  <p className="mt-2 text-xl font-semibold tracking-[-0.06em] text-white sm:text-2xl">
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
              <CardTitle className="text-2xl font-semibold uppercase tracking-[-0.06em] sm:text-3xl">
                Movimentações recentes.
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {transactions.map((transaction, index) => (
                <div key={transaction.id}>
                  <div className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm leading-6 uppercase tracking-[0.16em] text-white sm:tracking-[0.18em]">
                        {transaction.title}
                      </p>
                      <p className="text-sm leading-6 text-white/55">
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
              <CardTitle className="text-2xl font-semibold uppercase tracking-[-0.06em] text-white sm:text-3xl">
                Compromissos financeiros do ciclo.
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {obligations.map((obligation, index) => (
                <div key={obligation.id}>
                  <div className="grid gap-2 py-2 sm:grid-cols-[1fr_auto] sm:gap-4">
                    <div>
                      <p className="text-sm leading-6 uppercase tracking-[0.16em] text-white sm:tracking-[0.18em]">
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
              <CardTitle className="text-2xl font-semibold uppercase tracking-[-0.06em] text-white sm:text-3xl">
                Distribuição do mês por categoria.
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {categories.map((category) => (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="min-w-0 uppercase tracking-[0.16em] text-white sm:tracking-[0.18em]">
                      {category.name}
                    </span>
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
              <CardTitle className="text-2xl font-semibold uppercase tracking-[-0.06em] text-white sm:text-3xl">
                Alocação consolidada e desempenho.
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {investments.map((investment) => (
                <div key={investment.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 uppercase tracking-[0.16em] text-white sm:tracking-[0.18em]">
                      {investment.name}
                    </span>
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
