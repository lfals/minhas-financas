import { CalendarClock, ReceiptText } from "lucide-react"

import {
  CreditCardInvoiceCardActions,
  CreditCardInvoiceDetailsDialog,
} from "@/components/client/credit-card-invoice-details-dialog.client"
import { TransactionCreateDialog } from "@/components/client/transaction-create-dialog.client"
import { TransactionRemoveButton } from "@/components/client/transaction-remove-button.client"
import { TransactionsPeriodControls } from "@/components/client/transactions-period-controls.client"
import { TransactionSettleButton } from "@/components/client/transaction-settle-button.client"
import { TransactionListItem } from "@/components/transaction-list-item"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCompactCurrency } from "@/lib/formatters"
import { formatCents } from "@/lib/money"
import { cn } from "@/lib/utils"
import type {
  TransactionAccountOption,
  TransactionCategoryOption,
  TransactionCreditCardOption,
  TransactionsPageData,
} from "@/modules/transactions/domain/types"
import {
  getFixedExpenseFrequencyLabel,
  getInstallmentLabel,
} from "@/modules/transactions/presentation/view-model"

function metricToneClass(tone: TransactionsPageData["metrics"][number]["tone"]) {
  if (tone === "income") return "text-[#d8f36a]"
  if (tone === "expense") return "text-[#ff9c7a]"
  return "text-white"
}

function statusTone(status: TransactionsPageData["transactions"][number]["statusLabel"]) {
  if (status === "Compensado") return "border-white/10 bg-white/5 text-white/70"
  if (status === null) return ""
  return "border-[#c4f1ff]/30 bg-[#c4f1ff]/10 text-[#c4f1ff]"
}

function getTransactionBadge(
  transaction: TransactionsPageData["transactions"][number]
) {
  if (transaction.sourceType === "credit_card_invoice") {
    return "Fatura"
  }

  const installmentLabel = getInstallmentLabel(
    transaction.installmentNumber,
    transaction.installmentTotal
  )

  if (installmentLabel) {
    return installmentLabel
  }

  if (transaction.isFixed) {
    return getFixedExpenseFrequencyLabel(transaction.fixedExpenseFrequency) ?? "Fixa"
  }

  return null
}

export function TransactionsPageView({
  summary,
  metrics,
  transactions,
  invoiceExpenses,
  categories,
  cashflow,
  accountOptions,
  creditCardOptions,
  categoryOptions,
  defaultOccurredOn,
  selectedDate,
}: TransactionsPageData & {
  accountOptions: TransactionAccountOption[]
  creditCardOptions: TransactionCreditCardOption[]
  categoryOptions: TransactionCategoryOption[]
  defaultOccurredOn: string
  selectedDate: string
}) {
  const maxCashflow = Math.max(
    1,
    ...cashflow.flatMap((point) => [point.incomeCents, point.expenseCents])
  )

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
              <TransactionsPeriodControls selectedDate={selectedDate} />
              <TransactionCreateDialog
                accountOptions={accountOptions}
                creditCardOptions={creditCardOptions}
                categoryOptions={categoryOptions}
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
                transactions.map((transaction) => {
                  const badgeLabel = getTransactionBadge(transaction)

                  return (
                    transaction.sourceType === "credit_card_invoice" ? (
                      <CreditCardInvoiceDetailsDialog
                        key={transaction.id}
                        transaction={transaction}
                        badgeLabel={badgeLabel}
                        statusClassName={statusTone(transaction.statusLabel)}
                        expenses={invoiceExpenses[transaction.id] ?? []}
                      >
                        <div className="block w-full text-left">
                          <TransactionListItem
                            title={transaction.title}
                            badgeLabel={badgeLabel}
                            statusLabel={transaction.statusLabel}
                            statusClassName={statusTone(transaction.statusLabel)}
                            metadata={`${transaction.category} • ${transaction.accountName} • ${transaction.dateLabel}`}
                            amountCents={transaction.amountCents}
                            displayAmountCents={transaction.displayAmountCents}
                            isAmountOverridden={transaction.isAmountOverridden}
                            kind={transaction.kind}
                            className="cursor-pointer transition-colors hover:bg-[#161616]"
                            actions={
                              <CreditCardInvoiceCardActions
                                transactionId={transaction.id}
                                originalAmountCents={transaction.amountCents}
                                isCompensated={transaction.status === "compensated"}
                              />
                            }
                          />
                        </div>
                      </CreditCardInvoiceDetailsDialog>
                    ) : (
                      <TransactionListItem
                        key={transaction.id}
                        title={transaction.title}
                        badgeLabel={badgeLabel}
                        statusLabel={transaction.statusLabel}
                        statusClassName={statusTone(transaction.statusLabel)}
                        metadata={`${transaction.category} • ${transaction.accountName} • ${transaction.dateLabel}`}
                        amountCents={transaction.amountCents}
                        displayAmountCents={transaction.displayAmountCents}
                        isAmountOverridden={transaction.isAmountOverridden}
                        kind={transaction.kind}
                        actions={
                          <>
                            <TransactionRemoveButton
                              transactionId={transaction.id}
                              transactionTitle={transaction.title}
                              isFixed={transaction.isFixed}
                              installmentTotal={transaction.installmentTotal}
                              supportsFutureRemoval={transaction.supportsFutureRemoval}
                            />
                            <TransactionSettleButton
                              transactionId={transaction.id}
                              originalAmountCents={transaction.amountCents}
                              isCompensated={transaction.status === "compensated"}
                            />
                          </>
                        }
                      />
                    )
                  )
                })
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
