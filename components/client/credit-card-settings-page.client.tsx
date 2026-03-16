"use client"

import { useState } from "react"
import { CreditCard, ShieldCheck } from "lucide-react"

import { CreditCardCreateDialog } from "@/components/client/credit-card-create-dialog.client"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { TransactionAccountOption } from "@/modules/transactions/domain/types"

export type CreditCardFormValues = {
  nickname: string
  finalDigits: string
  limit: string
  closingDay: string
  dueDay: string
  expenseAccount: string
  autoCategorizationEnabled: boolean
}

export const defaultCreditCardFormValues: CreditCardFormValues = {
  nickname: "Cartão Black principal",
  finalDigits: "4821",
  limit: "12.500,00",
  closingDay: "18",
  dueDay: "25",
  expenseAccount: "Conta principal",
  autoCategorizationEnabled: true,
}

function getAvailableLimitLabel(limit: string) {
  const totalLimit = Number(limit.replace(/\D/g, "")) / 100

  return `R$ ${Math.max(0, totalLimit - 3842.9).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function CreditCardSettingsPage({
  accountOptions,
}: {
  accountOptions: TransactionAccountOption[]
}) {
  const [card, setCard] = useState(defaultCreditCardFormValues)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <section>
        <Card className="border border-white/10 bg-[#171717] ring-0">
          <CardHeader className="gap-3">
            <div>
              <CardDescription className="text-[11px] uppercase tracking-[0.35em] text-white/55">
                Cartões
              </CardDescription>
              <CardTitle className="text-3xl font-semibold uppercase tracking-[-0.07em] text-white">
                Cadastro e configuração de cartão de crédito.
              </CardTitle>
            </div>
            <CardAction>
              <CreditCardCreateDialog
                accountOptions={accountOptions}
                initialValues={card}
                onSave={(values) => {
                  setCard(values)
                  setSavedAt(
                    new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date())
                  )
                }}
              />
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-6 pt-0 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4">
              <div className="border border-white/10 bg-[#121212] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.06em] text-white">
                      {card.nickname}
                    </p>
                    <p className="mt-4 text-sm tracking-[0.3em] text-white/72">
                      •••• {card.finalDigits}
                    </p>
                  </div>
                  <CreditCard className="size-5 text-[#d8f36a]" />
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="border border-white/10 bg-black/20 p-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                      Limite total
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.06em] text-white">
                      R$ {card.limit}
                    </p>
                  </div>
                  <div className="border border-white/10 bg-black/20 p-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                      Limite disponível
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.06em] text-[#d8f36a]">
                      {getAvailableLimitLabel(card.limit)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-white/45">
                  <span>fecha dia {card.closingDay}</span>
                  <span>vence dia {card.dueDay}</span>
                </div>
                {savedAt ? (
                  <p className="mt-4 text-sm text-[#d8f36a]">Configuração salva em {savedAt}.</p>
                ) : null}
              </div>

              <div className="border border-white/10 bg-[#121212] p-4">
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/55">
                  Regras ativas
                </p>
                <div className="mt-4 space-y-3 text-sm text-white/65">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="size-4 text-[#c4f1ff]" />
                    Pagamento vinculado em {card.expenseAccount}
                  </div>
                  <div className="flex items-center gap-3">
                    Categorização automática {card.autoCategorizationEnabled ? "ativada" : "desativada"}
                  </div>
                </div>
              </div>

              <div className="border border-white/10 bg-[#121212] p-4">
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/55">
                  Preferências
                </p>
                <div className="mt-4 grid gap-3 text-sm text-white/62">
                  <div className="border border-white/10 bg-black/20 px-4 py-3">
                    Categorização automática: {card.autoCategorizationEnabled ? "ativada" : "desativada"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
