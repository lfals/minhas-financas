import { ReceiptText } from "lucide-react"

import {
  CreditCardInvoiceDetailsDialog,
} from "@/components/client/credit-card-invoice-details-dialog.client"
import { TransactionCreateDialog } from "@/components/client/transaction-create-dialog.client"
import { TransactionDetailsDialog } from "@/components/client/transaction-details-dialog.client"
import { TransactionInstallmentsDetailsDialog } from "@/components/client/transaction-installments-details-dialog.client"
import { TransactionRemoveButton } from "@/components/client/transaction-remove-button.client"
import { TransactionsPeriodControls } from "@/components/client/transactions-period-controls.client"
import { TransactionSettleButton } from "@/components/client/transaction-settle-button.client"
import { TransactionListItem } from "@/components/transaction-list-item"
import { ResponsiveMetrics } from "@/components/client/responsive-metrics.client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCompactCurrency } from "@/lib/formatters"
import { SummaryMetricCard } from "@/components/rsc/summary-metric-card"
import type {
  TransactionAccountOption,
  TransactionPageItem,
  TransactionCategoryOption,
  TransactionCreditCardOption,
  TransactionsPageData,
} from "@/modules/transactions/domain/types"
import { sumInvoiceExpenseDebitSplit } from "@/modules/transactions/presentation/invoice-expense-debit-split"
import {
  getFixedExpenseFrequencyLabel,
  getInstallmentLabel,
} from "@/modules/transactions/presentation/view-model"
import { ClickPropagationStopper } from "@/components/client/click-propagation-stopper.client"

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
  transaction: TransactionsPageData["transactions"][number],
  isCreditCardInvoice: boolean
) {
  if (isCreditCardInvoice) {
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

function isCreditCardInvoiceTransaction(
  transaction: TransactionsPageData["transactions"][number],
  invoiceExpenseCount: number
) {
  if (transaction.sourceType === "credit_card_invoice") {
    return true
  }

  if (invoiceExpenseCount > 0) {
    return true
  }

  return transaction.category === "Cartão de crédito" && transaction.title.startsWith("Fatura ")
}

function TransactionsMetricCard({
  label,
  valueCents,
  tone,
  detail,
}: TransactionsPageData["metrics"][number]) {
  return (
    <SummaryMetricCard
      label={label}
      value={formatCompactCurrency(valueCents / 100)}
      detail={detail}
      valueClassName={metricToneClass(tone)}
    />
  )
}

export function TransactionsPageView({
  summary,
  metrics,
  transactions,
  allTransactions,
  invoiceExpenses,
  accountOptions,
  creditCardOptions,
  categoryOptions,
  defaultOccurredOn,
  selectedDate,
}: TransactionsPageData & {
  accountOptions: TransactionAccountOption[]
  creditCardOptions: TransactionCreditCardOption[]
  categoryOptions: TransactionCategoryOption[]
  allTransactions: TransactionPageItem[]
  defaultOccurredOn: string
  selectedDate: string
}) {
  const installmentsBySeries = new Map<string, TransactionsPageData["transactions"][number][]>()

  for (const transaction of allTransactions) {
    if (!transaction.seriesId || !transaction.installmentTotal) {
      continue
    }

    const existing = installmentsBySeries.get(transaction.seriesId) ?? []
    existing.push(transaction)
    installmentsBySeries.set(transaction.seriesId, existing)
  }

  for (const installments of installmentsBySeries.values()) {
    installments.sort((left, right) => {
      const leftInstallment = left.installmentNumber ?? Number.MAX_SAFE_INTEGER
      const rightInstallment = right.installmentNumber ?? Number.MAX_SAFE_INTEGER

      if (leftInstallment !== rightInstallment) {
        return leftInstallment - rightInstallment
      }

      return left.occurredOn.localeCompare(right.occurredOn)
    })
  }

  return (
    <div className="space-y-0">
      <ResponsiveMetrics gridClassName="sm:grid-cols-2 sm:gap-0 xl:grid-cols-5">
        {metrics.map((metric) => (
          <TransactionsMetricCard key={metric.label} {...metric} />
        ))}
      </ResponsiveMetrics>

      <section>
        <Card className="border border-white/10 bg-[#171717] ring-0">
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3">
              <div className="min-w-0">
                <CardDescription className="text-[11px] uppercase tracking-[0.35em] text-white/55">
                  Lançamentos
                </CardDescription>
                <CardTitle className="text-2xl font-semibold uppercase tracking-[-0.07em] text-white sm:text-3xl">
                  {summary.title}
                </CardTitle>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <TransactionsPeriodControls selectedDate={selectedDate} />
              <TransactionCreateDialog
                accountOptions={accountOptions}
                creditCardOptions={creditCardOptions}
                categoryOptions={categoryOptions}
                defaultOccurredOn={defaultOccurredOn}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-white/45">
                <ReceiptText className="size-4" />
                {transactions.length} lançamentos
              </div>
              {transactions.length ? (
                transactions.map((transaction) => {
                  const invoiceExpensesForTransaction = invoiceExpenses[transaction.id] ?? []
                  const isCreditCardInvoice = isCreditCardInvoiceTransaction(
                    transaction,
                    invoiceExpensesForTransaction.length
                  )
                  const badgeLabel = getTransactionBadge(transaction, isCreditCardInvoice)
                  const installmentTotal = transaction.installmentTotal
                  const isInstallmentSeries =
                    installmentTotal !== null &&
                    installmentTotal !== undefined &&
                    installmentTotal > 1
                  const installmentTransactions =
                    isInstallmentSeries && transaction.seriesId
                      ? installmentsBySeries.get(transaction.seriesId) ?? []
                      : []
                  const shouldOpenInstallmentsDialog = isInstallmentSeries
                  const installmentsAction =
                    !isCreditCardInvoice && shouldOpenInstallmentsDialog ? (
                      <TransactionInstallmentsDetailsDialog
                        transaction={transaction}
                        installments={installmentTransactions.length ? installmentTransactions : [transaction]}
                      >
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 border-white/10 bg-white/5 px-2.5 text-[10px] uppercase tracking-[0.18em] text-white hover:bg-white/10 sm:h-8 sm:px-3 sm:tracking-[0.2em]"
                        >
                          Parcelas
                        </Button>
                      </TransactionInstallmentsDetailsDialog>
                    ) : null
                  const transactionActions = (
                    <ClickPropagationStopper>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {installmentsAction}
                        {isCreditCardInvoice ? null : (
                          <TransactionRemoveButton
                            transactionId={transaction.id}
                            transactionTitle={transaction.title}
                            isFixed={transaction.isFixed}
                            installmentTotal={transaction.installmentTotal}
                            supportsFutureRemoval={transaction.supportsFutureRemoval}
                          />
                        )}
                        <TransactionSettleButton
                          transactionId={transaction.id}
                          originalAmountCents={transaction.amountCents}
                          isCompensated={transaction.status === "compensated"}
                        />
                      </div>
                    </ClickPropagationStopper>
                  )

                  let rowMetadata = `${transaction.category} • ${transaction.accountName} • ${transaction.dateLabel}`
                  if (isCreditCardInvoice && invoiceExpensesForTransaction.length) {
                    const split = sumInvoiceExpenseDebitSplit(invoiceExpensesForTransaction)
                    if (split.totalDebit > 0) {
                      rowMetadata += ` • Var. −${formatCompactCurrency(split.variable / 100)} · Fixas −${formatCompactCurrency(split.fixed / 100)}`
                    }
                  }

                  const listItem = (
                    <TransactionListItem
                      title={transaction.title}
                      badgeLabel={badgeLabel}
                      statusLabel={transaction.statusLabel}
                      statusClassName={statusTone(transaction.statusLabel)}
                      metadata={rowMetadata}
                      amountCents={transaction.amountCents}
                      displayAmountCents={transaction.displayAmountCents}
                      isAmountOverridden={transaction.isAmountOverridden}
                      kind={transaction.kind}
                      isOverdue={transaction.isOverdue}
                      actions={transactionActions}
                      className="transition-colors hover:bg-[#161616]"
                    />
                  )

                  if (isCreditCardInvoice) {
                    return (
                      <CreditCardInvoiceDetailsDialog
                        key={`${transaction.id}:${transaction.status}:${transaction.displayAmountCents}`}
                        transaction={transaction}
                        badgeLabel={badgeLabel}
                        statusClassName={statusTone(transaction.statusLabel)}
                        expenses={invoiceExpensesForTransaction}
                        cardOptions={creditCardOptions}
                        categoryOptions={categoryOptions}
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#d8f36a]/60 focus-visible:ring-offset-0"
                        >
                          {listItem}
                        </div>
                      </CreditCardInvoiceDetailsDialog>
                    )
                  }

                  return (
                    <TransactionDetailsDialog
                      key={`${transaction.id}:${transaction.status}:${transaction.displayAmountCents}`}
                      transaction={transaction}
                      accountOptions={accountOptions}
                      creditCardOptions={creditCardOptions}
                      categoryOptions={categoryOptions}
                      installments={installmentTransactions}
                    >
                      {listItem}
                    </TransactionDetailsDialog>
                  )
                })
              ) : (
                <div className="border border-dashed border-white/10 bg-[#121212] p-6 text-sm leading-7 text-white/60">
                  Nenhum lançamento registrado ainda. Use o botão acima para adicionar a primeira movimentação.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
