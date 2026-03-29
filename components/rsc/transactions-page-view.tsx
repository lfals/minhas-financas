import { ReceiptText } from "lucide-react"

import {
  CreditCardInvoiceDetailsDialog,
} from "@/components/client/credit-card-invoice-details-dialog.client"
import { TransactionCreateDialog } from "@/components/client/transaction-create-dialog.client"
import { TransactionInstallmentsDetailsDialog } from "@/components/client/transaction-installments-details-dialog.client"
import { TransactionRemoveButton } from "@/components/client/transaction-remove-button.client"
import { TransactionsPeriodControls } from "@/components/client/transactions-period-controls.client"
import { TransactionSettleButton } from "@/components/client/transaction-settle-button.client"
import { TransactionListItem } from "@/components/transaction-list-item"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCompactCurrency } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import type {
  TransactionAccountOption,
  TransactionPageItem,
  TransactionCategoryOption,
  TransactionCreditCardOption,
  TransactionsPageData,
} from "@/modules/transactions/domain/types"
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
            <div className="flex flex-wrap items-center justify-end gap-3">
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
                  const invoiceDetailsAction = isCreditCardInvoice ? (
                    <CreditCardInvoiceDetailsDialog
                      transaction={transaction}
                      badgeLabel={badgeLabel}
                      statusClassName={statusTone(transaction.statusLabel)}
                      expenses={invoiceExpensesForTransaction}
                      cardOptions={creditCardOptions}
                    />
                  ) : null
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
                          className="h-8 border-white/10 bg-white/5 px-3 text-[10px] uppercase tracking-[0.2em] text-white hover:bg-white/10"
                        >
                          Parcelas
                        </Button>
                      </TransactionInstallmentsDetailsDialog>
                    ) : null
                  const transactionActions = (
                    <ClickPropagationStopper>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {invoiceDetailsAction}
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

                  return (
                    <TransactionListItem
                      key={`${transaction.id}:${transaction.status}:${transaction.displayAmountCents}`}
                      title={transaction.title}
                      badgeLabel={badgeLabel}
                      statusLabel={transaction.statusLabel}
                      statusClassName={statusTone(transaction.statusLabel)}
                      metadata={`${transaction.category} • ${transaction.accountName} • ${transaction.dateLabel}`}
                      amountCents={transaction.amountCents}
                      displayAmountCents={transaction.displayAmountCents}
                      isAmountOverridden={transaction.isAmountOverridden}
                      kind={transaction.kind}
                      isOverdue={transaction.isOverdue}
                      actions={transactionActions}
                    />
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
