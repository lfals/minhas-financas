"use client"

import { CalendarClock, CreditCard, Wallet } from "lucide-react"

import { CreditCardCreateDialog } from "@/components/client/credit-card-create-dialog.client"
import { CreditCardEditDialog } from "@/components/client/credit-card-edit-dialog.client"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCents } from "@/lib/money"
import type { CreditCardsPageData } from "@/modules/credit-cards/domain/types"
import type { TransactionAccountOption } from "@/modules/transactions/domain/types"

export type CreditCardFormValues = {
  cardId?: string
  nickname: string
  finalDigits: string
  limit: string
  closingDay: string
  dueDay: string
  expenseAccountId: string
  autoCategorizationEnabled: boolean
}

export const defaultCreditCardFormValues: CreditCardFormValues = {
  nickname: "",
  finalDigits: "",
  limit: "",
  closingDay: "",
  dueDay: "",
  expenseAccountId: "",
  autoCategorizationEnabled: true,
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: typeof CreditCard
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

export function CreditCardSettingsPage({
  accountOptions,
  pageData,
}: {
  accountOptions: TransactionAccountOption[]
  pageData: CreditCardsPageData
}) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Cartões ativos" value={String(pageData.activeCount)} icon={CreditCard} />
        <MetricCard label="Limite total" value={formatCents(pageData.totalLimitCents)} icon={Wallet} />
        <MetricCard
          label="Limite disponível"
          value={formatCents(pageData.availableLimitCents)}
          icon={CalendarClock}
        />
      </section>

      <section>
        <Card className="border border-white/10 bg-[#171717] ring-0">
          <CardHeader className="gap-3">
            <div>
              <CardDescription className="text-[11px] uppercase tracking-[0.35em] text-white/55">
                Lista de cartões
              </CardDescription>
              <CardTitle className="text-3xl font-semibold uppercase tracking-[-0.07em] text-white">
                Visão atual dos cartões cadastrados.
              </CardTitle>
            </div>
            <CardAction>
              <CreditCardCreateDialog accountOptions={accountOptions} />
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-4 pt-0">
            {pageData.cards.length ? (
              pageData.cards.map((card) => (
                <div key={card.id} className="border border-white/10 bg-[#121212] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-white/45">
                        cartão de crédito
                      </p>
                      <p className="mt-2 text-2xl font-semibold tracking-[-0.06em] text-white">
                        {card.nickname}
                      </p>
                      <p className="mt-4 text-sm tracking-[0.3em] text-white/72">
                        •••• {card.finalDigits}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <CreditCardEditDialog
                        accountOptions={accountOptions}
                        initialValues={{
                          cardId: card.id,
                          nickname: card.nickname,
                          finalDigits: card.finalDigits,
                          limit: new Intl.NumberFormat("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(card.limitCents / 100),
                          closingDay: card.closingDay,
                          dueDay: card.dueDay,
                          expenseAccountId: card.expenseAccountId,
                          autoCategorizationEnabled: card.autoCategorizationEnabled,
                        }}
                      />
                      <CreditCard className="size-5 text-[#d8f36a]" />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="border border-white/10 bg-black/20 p-4">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                        Limite total
                      </p>
                      <p className="mt-2 text-2xl font-semibold tracking-[-0.06em] text-white">
                        {formatCents(card.limitCents)}
                      </p>
                    </div>
                    <div className="border border-white/10 bg-black/20 p-4">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                        Limite disponível
                      </p>
                      <p className="mt-2 text-2xl font-semibold tracking-[-0.06em] text-[#d8f36a]">
                        {formatCents(card.availableLimitCents)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-white/45">
                    <span>fecha dia {card.closingDay}</span>
                    <span>vence dia {card.dueDay}</span>
                    <span>pagamento em {card.expenseAccountLabel}</span>
                  </div>

                  <p className="mt-4 text-sm text-white/55">Cadastrado em {card.createdAtLabel}.</p>
                </div>
              ))
            ) : (
              <div className="border border-dashed border-white/10 bg-[#121212] p-6 text-sm leading-7 text-white/65">
                Nenhum cartão cadastrado ainda. Use o modal de criação para integrar o primeiro
                cartão ao banco.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
