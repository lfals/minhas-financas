import { Landmark, PiggyBank, Wallet } from "lucide-react"

import { AccountEditDialog } from "@/components/client/account-edit-dialog.client"
import { AccountCreateDialog } from "@/components/client/account-create-dialog.client"
import { AccountRemoveButton } from "@/components/client/account-remove-button.client"
import { ResponsiveMetrics } from "@/components/client/responsive-metrics.client"
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
    <div className="space-y-6">
      <ResponsiveMetrics gridClassName="sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
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
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className={cn("h-2 w-20", account.tone)} />
                        <p className="mt-4 text-[11px] uppercase tracking-[0.25em] text-white/45">
                          {account.typeLabel}
                        </p>
                        <p className="mt-2 text-xl font-semibold tracking-[-0.06em] text-white sm:text-2xl">
                          {account.name}
                        </p>
                      </div>
                      <AccountRemoveButton accountId={account.id} accountName={account.name} />
                    </div>
                    <p className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-white">
                      {formatCents(account.balanceCents)}
                    </p>
                    <div className="mt-4 flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-white/45 sm:flex-row sm:items-center sm:justify-between">
                      <span>criada em {account.createdAtLabel}</span>
                      <span>
                        {account.includeInNetWorth ? "entra no patrimônio" : "fora do patrimônio"}
                      </span>
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
