"use client"

import { CalendarClock, CreditCard, ReceiptText, Wallet } from "lucide-react"
import { useMemo, useState } from "react"

import { CreditCardCreateDialog } from "@/components/client/credit-card-create-dialog.client"
import { CreditCardEditDialog } from "@/components/client/credit-card-edit-dialog.client"
import { CreditCardExpenseRemoveButton } from "@/components/client/credit-card-expense-remove-button.client"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCents } from "@/lib/money"
import type { CreditCardsPageData } from "@/modules/credit-cards/domain/types"
import type { TransactionAccountOption } from "@/modules/transactions/domain/types"
import { TransactionListItem } from "@/components/transaction-list-item"
import type { CreditCardInvoiceExpenseRecord } from "@/modules/transactions/domain/types"

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

function formatCardSuffix(finalDigits: string) {
  return finalDigits ? `•••• ${finalDigits}` : "Sem final informado"
}

type CreditCardPurchaseItem = {
  id: string
  title: string
  metadata: string
  amountCents: number
  expenseId: string
  installmentTotal?: number | null
  supportsFutureRemoval: boolean
  badgeLabel?: string | null
  sortDate: string
}

const installmentTitlePattern = / \d+\/\d+$/
const installmentSuffixPattern = /(?:\s|-) (\d+)\/(\d+)$/

function formatExpenseDateLabel(occurredOn: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${occurredOn}T00:00:00`))
}

function normalizeCardPurchaseTitle(title: string) {
  return title.replace(installmentTitlePattern, "")
}

function parseInstallmentInfoFromTitle(title: string) {
  const match = title.match(installmentSuffixPattern)

  if (!match) {
    return null
  }

  return {
    number: Number(match[1]),
    total: Number(match[2]),
  }
}

function buildCardPurchases(expenses: CreditCardInvoiceExpenseRecord[]): CreditCardPurchaseItem[] {
  if (!expenses.length) {
    return []
  }

  const groups = new Map<string, CreditCardInvoiceExpenseRecord[]>()
  const today = new Date().toISOString().split("T")[0]

  for (const expense of expenses) {
    if (expense.notes === "__credit_card_invoice_settlement_adjustment__") {
      continue
    }

    const titleInstallment = parseInstallmentInfoFromTitle(expense.title)
    const installmentTotal =
      expense.installmentTotal ??
      (titleInstallment?.total != null && titleInstallment.total > 0 ? titleInstallment.total : null)
    const installmentNumber =
      expense.installmentNumber ??
      (titleInstallment?.number != null && titleInstallment.number > 0 ? titleInstallment.number : null)
    const isInstallment = installmentTotal != null && installmentTotal > 1 && installmentNumber != null

    const key = isInstallment
      ? expense.seriesId ??
        `legacy:${expense.cardId}:${normalizeCardPurchaseTitle(expense.title)}:${expense.category}:${installmentTotal}`
      : `single:${expense.id}`

    const current = groups.get(key)

    if (!current) {
      groups.set(key, [expense])
      continue
    }

    current.push(expense)
  }

  return [...groups.values()].map((group) => {
    const sortedByDateAsc = [...group].sort((left, right) =>
      left.occurredOn.localeCompare(right.occurredOn),
    )
    const sortedByDateDesc = [...sortedByDateAsc].reverse()
    const latest = sortedByDateDesc[0]

    const latestTitleInstallment = parseInstallmentInfoFromTitle(latest.title)
    const latestInstallmentTotal =
      latest.installmentTotal ??
      (latestTitleInstallment?.total != null && latestTitleInstallment.total > 0
        ? latestTitleInstallment.total
        : null)
    const latestInstallmentNumber =
      latest.installmentNumber ??
      (latestTitleInstallment?.number != null && latestTitleInstallment.number > 0
        ? latestTitleInstallment.number
        : null)

    const isInstallment =
      latestInstallmentTotal != null &&
      latestInstallmentTotal > 1 &&
      latestInstallmentNumber != null

    if (!isInstallment) {
      return {
        id: latest.id,
        title: normalizeCardPurchaseTitle(latest.title),
        metadata: `${latest.category} • ${formatExpenseDateLabel(latest.occurredOn)}`,
        amountCents: latest.amountCents,
        expenseId: latest.id,
        installmentTotal: null,
        supportsFutureRemoval: Boolean(latest.seriesId),
        badgeLabel: null,
        sortDate: latest.occurredOn,
      }
    }

    const totalInstallmentAmount = sortedByDateAsc.reduce(
      (sum, purchase) => sum + purchase.amountCents,
      0,
    )

    const installments = sortedByDateAsc.filter(
      (purchase) =>
        (() => {
          const parsed = parseInstallmentInfoFromTitle(purchase.title)

          const total =
            purchase.installmentTotal ??
            (parsed?.total != null && parsed.total > 0 ? parsed.total : null)
          const number =
            purchase.installmentNumber ??
            (parsed?.number != null && parsed.number > 0 ? parsed.number : null)

          return total != null && total > 1 && number != null
        })(),
    )

    const current = installments.filter((purchase) => purchase.occurredOn <= today)

    const currentInstallment = current.length ? current[current.length - 1] : installments[0]
    const currentDateLabel = formatExpenseDateLabel(currentInstallment?.occurredOn ?? latest.occurredOn)

    const parsedCurrentInstallment = currentInstallment
      ? parseInstallmentInfoFromTitle(currentInstallment.title)
      : null
    const installmentTotal =
      currentInstallment?.installmentTotal ??
      (parsedCurrentInstallment?.total != null && parsedCurrentInstallment.total > 0
        ? parsedCurrentInstallment.total
        : null)
    const installmentCurrent =
      currentInstallment?.installmentNumber ??
      (parsedCurrentInstallment?.number != null && parsedCurrentInstallment.number > 0
        ? parsedCurrentInstallment.number
        : null)
    const installmentAmount = currentInstallment?.amountCents ?? 0

    return {
      id: latest.seriesId ?? latest.id,
      title: normalizeCardPurchaseTitle(latest.title),
      metadata:
        `${latest.category} • ${formatExpenseDateLabel(latest.occurredOn)} • ` +
        `Quantidade: ${installmentTotal}x • ` +
        `Parcela atual: ${installmentCurrent}/${installmentTotal} ` +
        `(${formatCents(installmentAmount)}) • ` +
        `Total: ${formatCents(totalInstallmentAmount)} • Compra em ${currentDateLabel}`,
      expenseId: currentInstallment?.id ?? latest.id,
      installmentTotal: installmentTotal,
      supportsFutureRemoval: Boolean(currentInstallment?.seriesId),
      amountCents: totalInstallmentAmount,
      badgeLabel: installmentCurrent != null && installmentTotal != null ? `${installmentCurrent}/${installmentTotal}` : null,
      sortDate: latest.occurredOn,
    }
  })
  .sort((left, right) => right.sortDate.localeCompare(left.sortDate))
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
  cardPurchasesByCardId,
}: {
  accountOptions: TransactionAccountOption[]
  pageData: CreditCardsPageData
  cardPurchasesByCardId: Record<string, CreditCardInvoiceExpenseRecord[]>
}) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const selectedCard = pageData.cards.find((card) => card.id === selectedCardId) ?? null
  const selectedCardPurchases = useMemo(
    () =>
      selectedCardId
        ? buildCardPurchases(cardPurchasesByCardId[selectedCardId] ?? []).sort((left, right) =>
            right.sortDate.localeCompare(left.sortDate),
          )
        : [],
    [cardPurchasesByCardId, selectedCardId],
  )

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
          <CardHeader className="gap-4">
            <div className="min-w-0">
              <CardDescription className="text-[11px] uppercase tracking-[0.35em] text-white/55">
                Lista de cartões
              </CardDescription>
              <CardTitle className="text-2xl font-semibold uppercase tracking-[-0.07em] text-white sm:text-3xl">
                Visão atual dos cartões cadastrados.
              </CardTitle>
            </div>
            <CardAction className="col-start-1 row-start-3 justify-self-start sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:justify-self-end">
              <CreditCardCreateDialog accountOptions={accountOptions} />
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-4 pt-0">
            {pageData.cards.length ? (
              pageData.cards.map((card) => (
                <div
                  key={card.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedCardId(card.id)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      setSelectedCardId(card.id)
                    }
                  }}
                  className="cursor-pointer border border-white/10 bg-[#121212] p-4 transition-colors hover:bg-[#161616] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c4f1ff]/40 sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-white/45">
                        cartão de crédito
                      </p>
                      <p className="mt-2 text-xl font-semibold tracking-[-0.06em] text-white sm:text-2xl">
                        {card.nickname}
                      </p>
                      <p className="mt-4 text-sm tracking-[0.3em] text-white/72">
                        {formatCardSuffix(card.finalDigits)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 self-start">
                      <div onClick={(event) => event.stopPropagation()}>
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
                      </div>
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

                  <div className="mt-4 flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-white/45 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
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

      <Dialog
        open={selectedCard !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCardId(null)
          }
        }}
      >
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] max-w-4xl flex-col overflow-hidden border border-white/10 bg-[#141414] p-0 pt-10 text-white ring-0 sm:max-h-[calc(100dvh-2rem)]">
          <DialogHeader className="shrink-0 border-b border-white/10 px-4 pb-4 sm:px-6 sm:pb-5">
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/55">Compras do cartão</p>
              <DialogTitle className="text-2xl font-semibold uppercase tracking-[-0.07em] text-white sm:text-3xl">
                {selectedCard ? selectedCard.nickname : "Cartão"}
              </DialogTitle>
              {selectedCard ? (
                <div className="text-sm text-white/60">
                  {selectedCard.createdAtLabel} • {selectedCard.expenseAccountLabel}
                </div>
              ) : null}
            </div>
          </DialogHeader>
          <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <div className="mb-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-white/45">
              <ReceiptText className="size-4" />
              {selectedCardPurchases.length} compras
            </div>
            {selectedCardPurchases.length ? (
              <div className="space-y-3">
                {selectedCardPurchases.map((purchase) => (
                  <TransactionListItem
                    key={purchase.id}
                    title={purchase.title}
                    metadata={purchase.metadata}
                    amountCents={Math.abs(purchase.amountCents)}
                    kind="expense"
                    badgeLabel={purchase.badgeLabel}
                    className="bg-[#121212]"
                    actions={
                      <CreditCardExpenseRemoveButton
                        expenseId={purchase.expenseId}
                        expenseTitle={purchase.title}
                        installmentTotal={purchase.installmentTotal}
                        supportsFutureRemoval={purchase.supportsFutureRemoval}
                      />
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-white/10 bg-[#121212] p-6 text-sm leading-7 text-white/60">
                Nenhuma compra encontrada para este cartão ainda.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
