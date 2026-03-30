import { DashboardPeriodControls } from "@/components/client/dashboard-period-controls.client"
import { ResponsiveMetrics } from "@/components/client/responsive-metrics.client"
import { SummaryMetricCard } from "@/components/rsc/summary-metric-card"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatCompactCurrency, formatCurrency } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import type { DashboardData } from "@/modules/dashboard/domain/types"

function metricTone(tone: DashboardData["metrics"][number]["tone"]) {
  if (tone === "income") return "text-[#d8f36a]"
  if (tone === "expense") return "text-[#ff9c7a]"
  return "text-white"
}

function DashboardMetricCard({
  label,
  valueCents,
  tone,
  detail,
}: DashboardData["metrics"][number]) {
  return (
    <SummaryMetricCard
      label={label}
      value={formatCompactCurrency(valueCents / 100)}
      detail={detail}
      valueClassName={metricTone(tone)}
    />
  )
}

export function DashboardView({
  filter,
  summary,
  metrics,
  accounts,
  transactions,
  obligations,
  categories,
}: DashboardData) {
  return (
    <div className="space-y-0">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border border-white/10 bg-[#141414] ring-0">
          <CardHeader className="gap-4 sm:gap-5">
            <div className="flex flex-col gap-4 sm:gap-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <CardDescription className="text-[11px] uppercase tracking-[0.35em] text-white/50">
                    Dashboard
                  </CardDescription>
                  <CardTitle className="mt-3 max-w-3xl text-3xl font-semibold uppercase tracking-[-0.08em] text-white sm:text-4xl lg:text-5xl">
                    Visão consolidada da sua vida financeira.
                  </CardTitle>
                </div>
                <Badge className="w-fit bg-[#d8f36a] px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-black">
                  {filter.periodLabel}
                </Badge>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-white/65 sm:text-base sm:leading-7">
                Acompanhe saldos, pendências e movimentações com o mesmo filtro de período em
                toda a página.
              </p>
            </div>
          </CardHeader>
        </Card>

        <Card className="border border-black bg-black text-[#f7f3ea] ring-0">
          <CardHeader className="gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardDescription className="text-[10px] uppercase tracking-[0.24em] text-white/55 sm:text-[11px] sm:tracking-[0.35em]">
                  Filtro do período
                </CardDescription>
                <CardTitle className="mt-2 text-[2rem] leading-none font-semibold tracking-[-0.08em] sm:text-4xl">
                  {filter.mode === "month" ? "Mensal" : "Personalizado"}
                </CardTitle>
              </div>
            </div>
            <DashboardPeriodControls filter={filter} />
          </CardHeader>
          <CardContent className="grid gap-3 pt-0 sm:gap-4">
            <div className="border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/50 sm:text-[11px] sm:tracking-[0.28em]">
                Intervalo aplicado
              </p>
              <p className="mt-2 text-xl leading-none font-semibold tracking-[-0.06em] sm:text-2xl">
                {filter.periodLabel}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <ResponsiveMetrics gridClassName="sm:grid-cols-2 sm:gap-0 xl:grid-cols-5">
        {metrics.map((metric) => (
          <DashboardMetricCard key={metric.label} {...metric} />
        ))}
      </ResponsiveMetrics>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <ResponsiveMetrics gridClassName="sm:grid-cols-2 sm:gap-0">
            <SummaryMetricCard
              label="Saldo consolidado"
              value={formatCompactCurrency(summary.totalBalanceCents / 100)}
              detail="Saldo atual de todas as contas ativas"
            />
            <SummaryMetricCard
              label="Patrimônio elegível"
              value={formatCompactCurrency(summary.netWorthBalanceCents / 100)}
              detail="Soma das contas marcadas para patrimônio"
            />
          </ResponsiveMetrics>

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
              {accounts.length ? (
                accounts.map((account) => (
                  <div key={account.id} className="border border-white/10 bg-[#121212] p-4">
                    <div className={cn("h-2 w-20", account.tone)} />
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-white/45">
                        {account.typeLabel}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "px-2 text-[10px] uppercase tracking-[0.16em]",
                          account.includeInNetWorth
                            ? "border-[#d8f36a]/25 bg-[#d8f36a]/10 text-[#d8f36a]"
                            : "border-white/10 bg-transparent text-white/45"
                        )}
                      >
                        {account.includeInNetWorth ? "Patrimônio" : "Fora do patrimônio"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xl font-semibold tracking-[-0.06em] text-white sm:text-2xl">
                      {account.name}
                    </p>
                    <p className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-white">
                      {formatCurrency(account.balanceCents / 100)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="border border-dashed border-white/10 bg-[#121212] p-6 text-sm leading-7 text-white/60 md:col-span-2">
                  Nenhuma conta cadastrada ainda.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-black bg-black text-[#f7f3ea] ring-0">
            <CardHeader className="gap-3">
              <CardDescription className="text-[11px] uppercase tracking-[0.3em] text-white/55">
                Lançamentos
              </CardDescription>
              <CardTitle className="text-2xl font-semibold uppercase tracking-[-0.06em] sm:text-3xl">
                Movimentações do período.
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {transactions.length ? (
                transactions.map((transaction, index) => (
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
                        {transaction.kind === "income" ? "+" : "-"}
                        {formatCurrency(transaction.amountCents / 100)}
                      </p>
                    </div>
                    {index < transactions.length - 1 ? <Separator className="bg-white/10" /> : null}
                  </div>
                ))
              ) : (
                <div className="border border-dashed border-white/10 bg-[#121212] p-6 text-sm leading-7 text-white/60">
                  Nenhuma movimentação encontrada no período selecionado.
                </div>
              )}
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
                Compromissos do período.
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {obligations.length ? (
                obligations.map((obligation, index) => (
                  <div key={obligation.id}>
                    <div className="grid gap-2 py-2 sm:grid-cols-[1fr_auto] sm:gap-4">
                      <div>
                        <p className="text-sm leading-6 uppercase tracking-[0.16em] text-white sm:tracking-[0.18em]">
                          {obligation.title}
                        </p>
                        <p className="text-sm text-white/55">{obligation.statusLabel}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] uppercase tracking-[0.25em] text-white/45">
                          {obligation.dueLabel}
                        </p>
                        <p className="mt-1 text-lg font-semibold tracking-[-0.05em] text-white">
                          {formatCurrency(obligation.amountCents / 100)}
                        </p>
                      </div>
                    </div>
                    {index < obligations.length - 1 ? <Separator className="bg-white/10" /> : null}
                  </div>
                ))
              ) : (
                <div className="border border-dashed border-white/10 bg-[#121212] p-6 text-sm leading-7 text-white/60">
                  Nenhuma obrigação pendente dentro do período selecionado.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-white/10 bg-[#171717] ring-0">
            <CardHeader className="gap-3">
              <CardDescription className="text-[11px] uppercase tracking-[0.3em] text-white/55">
                Gastos
              </CardDescription>
              <CardTitle className="text-2xl font-semibold uppercase tracking-[-0.06em] text-white sm:text-3xl">
                Distribuição do período por categoria.
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {categories.length ? (
                categories.map((category) => (
                  <div key={category.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="min-w-0 uppercase tracking-[0.16em] text-white sm:tracking-[0.18em]">
                        {category.name}
                      </span>
                      <span className="text-white/55">
                        {formatCurrency(category.amountCents / 100)}
                      </span>
                    </div>
                    <div className="h-3 border border-white/10 bg-white/5">
                      <div className="h-full bg-[#d8f36a]" style={{ width: `${category.share}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="border border-dashed border-white/10 bg-[#121212] p-6 text-sm leading-7 text-white/60">
                  Sem despesas categorizadas no período selecionado.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

    </div>
  )
}
