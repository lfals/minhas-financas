import { Landmark, PiggyBank, Wallet } from "lucide-react"

import { AccountEditDialog } from "@/components/client/account-edit-dialog.client"
import { AccountCreateDialog } from "@/components/client/account-create-dialog.client"
import { AccountRemoveButton } from "@/components/client/account-remove-button.client"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCents } from "@/lib/money"
import type { AccountsPageData } from "@/modules/accounts/domain/types"
import { cn } from "@/lib/utils"

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: typeof Landmark
}) {
  return (
    <Card className="border border-white/10 bg-[#151515] ring-0">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-3">
          <CardDescription className="text-[11px] uppercase tracking-[0.3em] text-white/55">
            {label}
          </CardDescription>
          <Icon className="size-4 text-white/55" />
        </div>
        <CardTitle className="text-3xl font-semibold tracking-[-0.06em] text-white">
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  )
}

export function AccountsPageView({ data }: { data: AccountsPageData }) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
      </section>

      <section>
        <Card className="border border-white/10 bg-[#171717] ring-0">
          <CardHeader className="gap-3">
            <div>
              <CardDescription className="text-[11px] uppercase tracking-[0.35em] text-white/55">
                Lista de contas
              </CardDescription>
              <CardTitle className="text-3xl font-semibold uppercase tracking-[-0.07em] text-white">
                Visão atual dos saldos cadastrados.
              </CardTitle>
            </div>
            <CardAction>
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
                    institution: account.institution,
                    type: account.type,
                    initialBalance: formatCents(account.initialBalanceCents),
                    includeInNetWorth: account.includeInNetWorth,
                  }}
                >
                  <div className="w-full border border-white/10 bg-[#121212] p-4 text-left transition-colors hover:bg-[#181818]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className={cn("h-2 w-20", account.tone)} />
                        <p className="mt-4 text-[11px] uppercase tracking-[0.25em] text-white/45">
                          {account.institution} • {account.typeLabel}
                        </p>
                        <p className="mt-2 text-2xl font-semibold tracking-[-0.06em] text-white">
                          {account.name}
                        </p>
                      </div>
                      <AccountRemoveButton accountId={account.id} accountName={account.name} />
                    </div>
                    <p className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-white">
                      {formatCents(account.balanceCents)}
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-white/45">
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
