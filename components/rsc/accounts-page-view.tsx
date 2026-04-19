import { Landmark, PiggyBank, Wallet } from "lucide-react"

import { AccountEditDialog } from "@/components/client/account-edit-dialog.client"
import { AccountCreateDialog } from "@/components/client/account-create-dialog.client"
import { AccountRemoveButton } from "@/components/client/account-remove-button.client"
import { ResponsiveMetrics } from "@/components/client/responsive-metrics.client"
import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCents } from "@/lib/money"
import type { AccountsPageData } from "@/modules/accounts/domain/types"
import { cn } from "@/lib/utils"
import { SummaryMetricCard } from "@/components/rsc/summary-metric-card"

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: typeof Landmark
}) {
  return <SummaryMetricCard label={label} value={value} icon={Icon} />
}

export function AccountsPageView({ data }: { data: AccountsPageData }) {
  return (
    <div className="space-y-0">
      <ResponsiveMetrics gridClassName="sm:grid-cols-2 sm:gap-0 xl:grid-cols-3">
        <MetricCard
          label="Saldo consolidado"
          value={formatCents(data.totalBalanceCents)}
          icon={Wallet}
        />
        <MetricCard
          label="Patrimônio elegível"
          value={formatCents(data.netWorthBalanceCents)}
          icon={PiggyBank}
        />
        <MetricCard
          label="Contas ativas"
          value={String(data.activeCount)}
          icon={Landmark}
        />
      </ResponsiveMetrics>

      <section>
        <Card className="border border-white/10 bg-[#171717] ring-0">
          <CardHeader className="gap-4">
            <div className="min-w-0">
              <CardDescription className="text-[11px] uppercase tracking-[0.35em] text-white/55">
                Lista de contas
              </CardDescription>
              <CardTitle className="text-2xl font-semibold uppercase tracking-[-0.07em] text-white sm:text-3xl">
                Visão atual dos saldos cadastrados.
              </CardTitle>
            </div>
            <CardAction className="col-start-1 row-start-3 justify-self-start sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:justify-self-end">
              <AccountCreateDialog />
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-4 pt-0">
            {data.accounts.length ? (
              data.accounts.map((account) => (
                <AccountEditDialog
                  key={account.id}
                  initialValues={{
                    accountId: account.id,
                    name: account.name,
                    type: account.type,
                    initialBalance: formatCents(account.initialBalanceCents),
                    includeInNetWorth: account.includeInNetWorth,
                  }}
                >
                  <div className="w-full border border-white/10 bg-[#121212] p-4 text-left transition-colors hover:bg-[#181818] sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className={cn("h-1.5 w-16 sm:h-2 sm:w-20", account.tone)} />
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-white/10 bg-white/5 px-2 text-[10px] uppercase tracking-[0.18em] text-white/62"
                          >
                            {account.typeLabel}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              "px-2 text-[10px] uppercase tracking-[0.14em]",
                              account.includeInNetWorth
                                ? "border-[#d8f36a]/25 bg-[#d8f36a]/10 text-[#d8f36a]"
                                : "border-white/10 bg-transparent text-white/45"
                            )}
                          >
                            {account.includeInNetWorth ? "Patrimônio" : "Fora do patrimônio"}
                          </Badge>
                        </div>
                        <p className="mt-3 text-xl leading-tight font-semibold tracking-[-0.05em] text-white sm:mt-4 sm:text-2xl">
                          {account.name}
                        </p>
                      </div>
                      <AccountRemoveButton
                        accountId={account.id}
                        accountName={account.name}
                        otherAccounts={data.accounts
                          .filter((a) => a.id !== account.id)
                          .map((a) => ({ id: a.id, name: a.name }))}
                      />
                    </div>

                    <div className="mt-4 border-t border-white/10 pt-4 sm:mt-5 sm:pt-5">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
                        Saldo atual
                      </p>
                      <p className="mt-2 text-[2rem] leading-none font-semibold tracking-[-0.07em] text-white sm:text-3xl">
                        {formatCents(account.balanceCents)}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-3 text-[11px] text-white/50 sm:mt-5 sm:flex-row sm:items-center sm:justify-between sm:pt-4">
                      <span className="uppercase tracking-[0.18em]">Criada em {account.createdAtLabel}</span>
                      <span className="text-white/38">Toque para editar</span>
                    </div>
                  </div>
                </AccountEditDialog>
              ))
            ) : (
              <div className="border border-dashed border-white/10 bg-[#121212] p-6 text-sm leading-7 text-white/60">
                Nenhuma conta cadastrada ainda. Crie a primeira conta para iniciar o
                controle de saldos.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
