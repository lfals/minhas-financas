"use client"

import { Fragment, useState } from "react"
import { ptBR } from "date-fns/locale"
import { format, parseISO } from "date-fns"
import { ChevronDown, ChevronUp } from "lucide-react"

import { DashboardChartMonthSelector } from "@/components/client/dashboard-chart-month-selector.client"
import { DashboardMonthForecastChart } from "@/components/client/dashboard-month-forecast-chart.client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import type { DashboardData } from "@/modules/dashboard/domain/types"
import { CREDIT_CARD_INVOICE_SETTLEMENT_ADJUSTMENT_NOTE } from "@/modules/transactions/domain/credit-card-invoice-notes"
import type {
  CreditCardInvoiceExpenseRecord,
  TransactionListRecord,
} from "@/modules/transactions/domain/types"

type ConsolidadoMode = "card_expenses" | "invoice_transactions"

type RowData = {
  type: "Entrada" | "Saída" | "Cartão"
  name: string
  values: Record<string, number> // month (YYYY-MM) -> amountCents
  installmentLabel: string // "Fixo", "12x", "—"
}

function invoiceTransactionAmountCents(t: TransactionListRecord) {
  return t.settledAmountCents ?? t.amountCents
}

function monthKeyFromInvoiceTransaction(t: TransactionListRecord) {
  if (t.invoiceMonth) {
    return t.invoiceMonth.slice(0, 7)
  }
  return t.occurredOn.slice(0, 7)
}

function getSortedMonths(
  transactions: TransactionListRecord[],
  invoiceExpenses: CreditCardInvoiceExpenseRecord[],
  mode: ConsolidadoMode
) {
  const months = new Set<string>()

  transactions.forEach((t) => {
    months.add(t.occurredOn.slice(0, 7))
  })

  if (mode === "card_expenses") {
    invoiceExpenses.forEach((e) => {
      const month = e.invoiceMonth?.slice(0, 7) || e.occurredOn.slice(0, 7)
      months.add(month)
    })
  }

  return Array.from(months).sort()
}

function formatMonth(month: string) {
  const date = parseISO(`${month}-01`)
  const label = format(date, "MMMM yy", { locale: ptBR })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

type DebitCompositionCardRow = {
  cardId: string
  cardName: string
  fixed: Record<string, number>
  variable: Record<string, number>
}

function emptyMonthBuckets(sortedMonths: string[]): Record<string, number> {
  return Object.fromEntries(sortedMonths.map((m) => [m, 0]))
}

/** Composição mensal por cartão: só valores a débito (positivos), agrupamento fixo igual ao modelo de série. */
function buildDebitCompositionByCard(
  expenses: CreditCardInvoiceExpenseRecord[],
  sortedMonths: string[]
): DebitCompositionCardRow[] {
  const byCard = new Map<string, DebitCompositionCardRow>()

  for (const expense of expenses) {
    if (expense.notes === CREDIT_CARD_INVOICE_SETTLEMENT_ADJUSTMENT_NOTE) {
      continue
    }

    if (expense.amountCents <= 0) {
      continue
    }

    const month = expense.invoiceMonth?.slice(0, 7) ?? expense.occurredOn.slice(0, 7)
    if (!sortedMonths.includes(month)) continue

    let row = byCard.get(expense.cardId)
    if (!row) {
      row = {
        cardId: expense.cardId,
        cardName: expense.cardName,
        fixed: emptyMonthBuckets(sortedMonths),
        variable: emptyMonthBuckets(sortedMonths),
      }
      byCard.set(expense.cardId, row)
    }

    const bucketRecord = expense.isFixed ? row.fixed : row.variable
    bucketRecord[month] = (bucketRecord[month] ?? 0) + expense.amountCents
  }

  return [...byCard.values()].sort((a, b) => a.cardName.localeCompare(b.cardName, "pt-BR"))
}

type CartaoDebitCompositionTableProps = {
  sortedMonths: string[]
  expenses: CreditCardInvoiceExpenseRecord[]
}

function CartaoDebitCompositionTable({ sortedMonths, expenses }: CartaoDebitCompositionTableProps) {
  if (!sortedMonths.length) {
    return null
  }

  const rowsByCard = buildDebitCompositionByCard(expenses, sortedMonths)

  const cardsWithDebit = rowsByCard.filter((row) =>
    sortedMonths.some((month) => (row.fixed[month] ?? 0) > 0 || (row.variable[month] ?? 0) > 0)
  )

  if (!cardsWithDebit.length) {
    return null
  }

  const compHead = "text-[9px] font-semibold uppercase tracking-[0.15em] text-white/40"
  const compCell = "min-h-9 whitespace-nowrap border-b border-white/[0.06] px-2 py-2 font-mono text-[11px] tabular-nums"
  /** Larguras fixas para segunda coluna sticky alinhar com o header ao rolar horizontalmente. */
  const stickyCard = "sticky left-0 z-40 box-border w-[132px] min-w-[132px] max-w-[132px]"
  const stickyRecorte =
    "sticky left-[132px] z-30 box-border w-[154px] min-w-[154px] max-w-[154px]"

  return (
    <div className="mb-4 rounded-none border border-white/10 bg-black/35 px-3 py-4">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.32em] text-white/42">
        Composição das compras a débito — por cartão
      </p>
      <div className="relative overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
        <table className="w-full border-separate border-spacing-0 text-xs">
          <thead className="bg-[#121212]/80">
            <tr>
              <th
                className={cn(
                  compHead,
                  stickyCard,
                  "border-b border-r border-white/10 bg-[#121212] py-2.5 pr-2 pl-0 text-left"
                )}
              >
                Cartão
              </th>
              <th
                className={cn(
                  compHead,
                  stickyRecorte,
                  "border-b border-r border-white/10 bg-[#121212] py-2.5 px-2 text-left"
                )}
              >
                Recorte
              </th>
              {sortedMonths.map((month) => (
                <th
                  key={month}
                  className={cn(
                    compHead,
                    "border-b border-white/10 px-2 py-2.5 text-center whitespace-nowrap"
                  )}
                >
                  {formatMonth(month)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cardsWithDebit.map((cardRow, cardIndex) => {
              const pairBg = cardIndex % 2 === 0 ? "bg-white/[0.02]" : ""
              const cardCellBg = cn("bg-[#141414]", pairBg)

              return (
                <Fragment key={cardRow.cardId}>
                  <tr className={pairBg || undefined}>
                    <td
                      rowSpan={2}
                      className={cn(
                        compCell,
                        stickyCard,
                        "align-top border-r border-white/5 py-3",
                        cardCellBg,
                        "text-[11px] font-medium leading-snug text-white/75"
                      )}
                    >
                      {cardRow.cardName}
                    </td>
                    <td
                      className={cn(
                        compCell,
                        stickyRecorte,
                        "border-r border-white/5 font-medium text-white/72",
                        cardCellBg
                      )}
                    >
                      Variável na fatura
                    </td>
                    {sortedMonths.map((month) => {
                      const v = cardRow.variable[month] ?? 0
                      return (
                        <td
                          key={`${cardRow.cardId}-var-${month}`}
                          className={cn(compCell, pairBg, "bg-[#141414] text-center text-white/70")}
                        >
                          {v ? formatCurrency(v / 100) : "—"}
                        </td>
                      )
                    })}
                  </tr>
                  <tr className={pairBg || undefined}>
                    <td
                      className={cn(
                        compCell,
                        stickyRecorte,
                        "border-r border-white/5 font-medium text-[#c4b5fd]/95",
                        cardCellBg
                      )}
                    >
                      Assinaturas / fixas
                    </td>
                    {sortedMonths.map((month) => {
                      const v = cardRow.fixed[month] ?? 0
                      return (
                        <td
                          key={`${cardRow.cardId}-fix-${month}`}
                          className={cn(compCell, pairBg, "bg-[#141414] text-center text-[#d4cafc]/95")}
                        >
                          {v ? formatCurrency(v / 100) : "—"}
                        </td>
                      )
                    })}
                  </tr>
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-white/38">
        Cada cartão tem duas linhas: gasto pontual parcelado ou avulso, e despesa marcada como fixa no cadastro da
        compra no cartão. O consolidado mensal principal continua igual ao da tabela seguinte — aqui só é outra forma
        de ler o mesmo recorte pelo mês em que cada compra aparece na fatura.
      </p>
    </div>
  )
}

function getCleanName(title: string) {
  // Strips " 1/12", " 01/10", etc.
  return title.replace(/\s\d+\/\d+$/, "").trim()
}

function resolveInstallmentLabel(isFixed: boolean, installmentTotal: number | null | undefined): string {
  if (isFixed) return "Fixo"
  if (installmentTotal && installmentTotal > 1) return `${installmentTotal}x`
  return "—"
}

function buildConsolidadoModel(params: {
  totalInitialBalanceCents: number
  rawTransactions: TransactionListRecord[]
  rawInvoiceExpenses: CreditCardInvoiceExpenseRecord[]
  mode: ConsolidadoMode
}) {
  const { totalInitialBalanceCents, rawTransactions, rawInvoiceExpenses, mode } = params

  const sortedMonths = getSortedMonths(rawTransactions, rawInvoiceExpenses, mode)

  const rowsMap = new Map<string, RowData>()
  const getRowKey = (type: string, name: string) => `${type}:::${name}`

  rawTransactions.forEach((t) => {
    if (t.sourceType === "credit_card_invoice") return

    const type = t.kind === "income" ? "Entrada" : "Saída"
    const name = getCleanName(t.title)
    const key = getRowKey(type, name)
    const month = t.occurredOn.slice(0, 7)

    if (!rowsMap.has(key)) {
      rowsMap.set(key, { type: type as RowData["type"], name, values: {}, installmentLabel: "—" })
    }

    const row = rowsMap.get(key)!
    row.values[month] = (row.values[month] || 0) + t.amountCents

    const label = resolveInstallmentLabel(t.isFixed, t.installmentTotal)
    if (label === "Fixo" || (row.installmentLabel === "—" && label !== "—")) {
      row.installmentLabel = label
    }
  })

  const cardExpenseMonths = new Map<string, Set<string>>()

  if (mode === "card_expenses") {
    rawInvoiceExpenses.forEach((e) => {
      const type = "Cartão"
      const name = getCleanName(e.title)
      const key = getRowKey(type, name)
      const month = e.invoiceMonth?.slice(0, 7) || e.occurredOn.slice(0, 7)

      if (!rowsMap.has(key)) {
        rowsMap.set(key, { type, name, values: {}, installmentLabel: "—" })
      }

      const row = rowsMap.get(key)!
      row.values[month] = (row.values[month] || 0) + e.amountCents

      if (e.installmentTotal && e.installmentTotal > 1 && row.installmentLabel === "—") {
        row.installmentLabel = `${e.installmentTotal}x`
      }

      if (!e.installmentTotal) {
        if (!cardExpenseMonths.has(key)) {
          cardExpenseMonths.set(key, new Set<string>())
        }
        cardExpenseMonths.get(key)!.add(month)
      }
    })

    cardExpenseMonths.forEach((months, key) => {
      const row = rowsMap.get(key)
      if (row && row.installmentLabel === "—" && months.size >= 2) {
        row.installmentLabel = "Fixo"
      }
    })
  } else {
    rawTransactions.forEach((t) => {
      if (t.sourceType !== "credit_card_invoice") return
      if (t.kind !== "expense") return

      const type = "Cartão"
      const name = getCleanName(t.title)
      const key = getRowKey(type, name)
      const month = monthKeyFromInvoiceTransaction(t)

      if (!rowsMap.has(key)) {
        rowsMap.set(key, { type, name, values: {}, installmentLabel: "—" })
      }

      const row = rowsMap.get(key)!
      row.values[month] =
        (row.values[month] || 0) + invoiceTransactionAmountCents(t)
    })
  }

  const rows = Array.from(rowsMap.values()).sort((a, b) => {
    const typeOrder = { Entrada: 0, Saída: 1, Cartão: 2 }
    if (typeOrder[a.type] !== typeOrder[b.type]) {
      return typeOrder[a.type] - typeOrder[b.type]
    }

    const installmentOrder = (label: string) =>
      label === "Fixo" ? 0 : label === "—" ? 2 : 1
    const aOrder = installmentOrder(a.installmentLabel)
    const bOrder = installmentOrder(b.installmentLabel)
    if (aOrder !== bOrder) return aOrder - bOrder

    return a.name.localeCompare(b.name)
  })

  let runningBalanceCents = totalInitialBalanceCents
  const monthEndBalancesCents = sortedMonths.map((month) => {
    const monthNetChange = rows.reduce((acc, row) => {
      const val = row.values[month] || 0
      return row.type === "Entrada" ? acc + val : acc - val
    }, 0)
    runningBalanceCents += monthNetChange
    return runningBalanceCents
  })

  return { rows, sortedMonths, monthEndBalancesCents }
}

type ConsolidadoTableProps = {
  rows: RowData[]
  sortedMonths: string[]
  monthEndBalancesCents: number[]
}

/** Overrides `TableHead` `h-10` / defaults so sticky + month columns share one row height */
const dashboardHeadCell =
  "h-auto min-h-10 align-middle px-2 py-2.5 text-[9px] leading-none font-semibold uppercase tracking-[0.15em] text-white/40"

const dashboardResultStickyCell =
  "h-auto min-h-10 align-middle px-2 py-2.5 text-[9px] leading-none font-bold uppercase tracking-[0.15em] text-white/40"

const dashboardMonthHeadCell =
  "h-auto min-h-10 align-middle px-2 py-2.5 text-center text-[9px] leading-none font-semibold uppercase tracking-[0.15em] text-white/40"

const dashboardResultMonthCell =
  "h-auto min-h-10 align-middle px-2 py-2.5 text-center font-mono text-[9px] font-semibold leading-none tracking-tight tabular-nums"

const dashboardBodyStickyCell =
  "h-auto min-h-10 align-middle px-2 py-2.5 text-xs leading-none border-b border-white/5"

const dashboardBodyMonthCell =
  "h-auto min-h-10 align-middle px-2 py-2.5 text-center font-mono text-xs leading-none tabular-nums border-b border-white/5"

function ConsolidadoFinancialTable({ rows, sortedMonths, monthEndBalancesCents }: ConsolidadoTableProps) {
  return (
    <div className="relative overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
      <Table className="border-separate border-spacing-0 text-xs">
              <TableHeader className="sticky top-0 z-30 bg-[#0d0d0d]/95 backdrop-blur-md">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead
                    className={cn(
                      dashboardHeadCell,
                      "sticky md:left-0 top-0 z-40 bg-[#0d0d0d] border-b border-r border-white/5 min-w-[100px]"
                    )}
                  >
                    Tipo
                  </TableHead>
                  <TableHead
                    className={cn(
                      dashboardHeadCell,
                      "sticky md:left-[100px] top-0 z-40 bg-[#0d0d0d] border-b border-r border-white/5 min-w-[80px]"
                    )}
                  >
                    Parcelas
                  </TableHead>
                  <TableHead
                    className={cn(
                      dashboardHeadCell,
                      "sticky md:left-[180px] top-0 z-40 bg-[#0d0d0d] border-b border-r border-white/5 min-w-[200px]"
                    )}
                  >
                    Nome/Mês
                  </TableHead>
                  {sortedMonths.map((month) => (
                    <TableHead
                      key={month}
                      className={cn(
                        dashboardMonthHeadCell,
                        "min-w-[140px] border-b border-white/5"
                      )}
                    >
                      {formatMonth(month)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow 
                    key={idx} 
                    className="group border-none transition-colors hover:bg-white/[0.03]"
                  >
                    <TableCell
                      className={cn(
                        dashboardBodyStickyCell,
                        "sticky md:left-0 z-10 border-r border-white/5 font-medium group-hover:bg-[#121212] transition-colors"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex items-center rounded-[2px] px-2 py-px text-[9px] font-bold uppercase leading-none tracking-widest",
                          row.type === "Entrada"
                            ? "bg-[#d8f36a]/10 text-[#d8f36a] border border-[#d8f36a]/20"
                            : row.type === "Saída"
                              ? "bg-[#ff9c7a]/10 text-[#ff9c7a] border border-[#ff9c7a]/20"
                              : "bg-[#7a99ff]/10 text-[#7a99ff] border border-[#7a99ff]/20"
                        )}
                      >
                        {row.type}
                      </span>
                    </TableCell>
                    <TableCell
                      className={cn(
                        dashboardBodyStickyCell,
                        "sticky md:left-[100px] z-10 border-r border-white/5 text-center group-hover:bg-[#121212] transition-colors",
                        row.installmentLabel === "Fixo"
                          ? "text-[#c4b5fd] font-semibold text-[9px] uppercase tracking-wider"
                          : row.installmentLabel === "—"
                            ? "text-white/15"
                            : "text-white/50 font-mono"
                      )}
                    >
                      {row.installmentLabel}
                    </TableCell>
                    <TableCell
                      className={cn(
                        dashboardBodyStickyCell,
                        "sticky md:left-[180px] z-10 border-r border-white/5 font-medium text-white/80 group-hover:bg-[#121212] transition-colors"
                      )}
                    >
                      {row.name}
                    </TableCell>
                    {sortedMonths.map((month) => {
                      const value = row.values[month]
                      return (
                        <TableCell
                          key={month}
                          className={cn(
                            dashboardBodyMonthCell,
                            !value
                              ? "text-white/5"
                              : row.type === "Entrada"
                                ? "text-[#d8f36a]/90"
                                : "text-white/70"
                          )}
                        >
                          {value ? formatCurrency(value / 100) : "—"}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter className="sticky bottom-0 z-30 bg-[#0d0d0d]/95 backdrop-blur-md border-t border-white/10">
                <TableRow className="border-none hover:bg-transparent">
                  <TableCell
                    className={cn(
                      dashboardResultStickyCell,
                      "sticky md:left-0 z-40 bg-[#0d0d0d] border-r border-white/5"
                    )}
                  >
                    Resultado
                  </TableCell>
                  <TableCell
                    className={cn(
                      dashboardResultStickyCell,
                      "sticky md:left-[100px] z-40 bg-[#0d0d0d] border-r border-white/5 text-center font-mono font-normal"
                    )}
                  >
                    {rows.length}
                  </TableCell>
                  <TableCell
                    className={cn(
                      dashboardResultStickyCell,
                      "sticky md:left-[180px] z-40 bg-[#0d0d0d] border-r border-white/5"
                    )}
                  >
                    Saldo Mensal
                  </TableCell>
                  {sortedMonths.map((month, i) => (
                    <TableCell
                      key={month}
                      className={cn(
                        dashboardResultMonthCell,
                        "border-b border-white/5",
                        monthEndBalancesCents[i] >= 0 ? "text-[#d8f36a]" : "text-[#ff9c7a]"
                      )}
                    >
                      {formatCurrency(monthEndBalancesCents[i] / 100)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableFooter>
      </Table>
    </div>
  )
}

export function DashboardView({
  filter,
  monthDailyForecast,
  accounts,
  rawTransactions,
  rawInvoiceExpenses,
}: DashboardData) {
  const [showCardComposition, setShowCardComposition] = useState(true)
  const [consolidadoTab, setConsolidadoTab] = useState<"compras" | "fatura">("compras")

  const totalInitialBalanceCents = accounts.reduce((sum, a) => sum + a.initialBalanceCents, 0)

  const comprasNoCartao = buildConsolidadoModel({
    totalInitialBalanceCents,
    rawTransactions,
    rawInvoiceExpenses,
    mode: "card_expenses",
  })

  const porFatura = buildConsolidadoModel({
    totalInitialBalanceCents,
    rawTransactions,
    rawInvoiceExpenses,
    mode: "invoice_transactions",
  })

  const compositionSortedMonths =
    consolidadoTab === "compras" ? comprasNoCartao.sortedMonths : porFatura.sortedMonths

  return (
    <div className="space-y-6">
      {monthDailyForecast && monthDailyForecast.length > 0 ? (
        <Card className="overflow-hidden border border-white/5 bg-[#0a0a0a] ring-0">
          <CardHeader className="gap-3 pb-0 sm:flex sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 space-y-1">
              <CardDescription className="text-[10px] uppercase tracking-[0.4em] text-white/40">
                {filter.periodLabel}
              </CardDescription>
              <CardTitle className="text-xl font-semibold tracking-[-0.04em] text-white">
                Saldo previsto e fluxos por dia
              </CardTitle>
              <p className="pt-1 text-xs leading-relaxed text-white/50">
                Linha do saldo: saldo atual mais o efeito acumulado das pendências até cada data. Entrada e saída: soma
                dos lançamentos ainda não compensados com vencimento naquele dia.
              </p>
            </div>
            <DashboardChartMonthSelector month={filter.month} />
          </CardHeader>
          <CardContent className="pb-4 pt-3">
            <DashboardMonthForecastChart points={monthDailyForecast} periodLabel={filter.periodLabel} />
          </CardContent>
        </Card>
      ) : null}

      <Card className="border border-white/5 bg-[#0a0a0a] ring-0 overflow-hidden">
        <CardHeader className="gap-2 pb-2">
          <CardDescription className="text-[10px] uppercase tracking-[0.4em] text-white/40">
            Visão Geral
          </CardDescription>
          <CardTitle className="text-3xl font-semibold tracking-[-0.06em] text-white">
            Consolidado Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-2 pt-0">
          <Tabs
            value={consolidadoTab}
            onValueChange={(value) => {
              if (value === "compras" || value === "fatura") {
                setConsolidadoTab(value)
              }
            }}
            className="gap-4"
          >
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                aria-expanded={showCardComposition}
                onClick={() => setShowCardComposition((value) => !value)}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-none border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70 transition-colors hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
              >
                {showCardComposition ? (
                  <ChevronUp className="size-3.5 opacity-80" aria-hidden />
                ) : (
                  <ChevronDown className="size-3.5 opacity-80" aria-hidden />
                )}
                {showCardComposition ? "Ocultar composição do cartão" : "Exibir composição do cartão"}
              </button>
            </div>
            {showCardComposition ? (
              <CartaoDebitCompositionTable
                sortedMonths={compositionSortedMonths}
                expenses={rawInvoiceExpenses}
              />
            ) : null}
            <TabsList variant="line" className="mb-3 h-auto flex-wrap justify-start rounded-none bg-transparent p-0">
              <TabsTrigger value="compras" className="max-w-none shrink-0 text-xs">
                Compras no cartão
              </TabsTrigger>
              <TabsTrigger value="fatura" className="max-w-none shrink-0 text-xs">
                Por fatura
              </TabsTrigger>
            </TabsList>
            <TabsContent value="compras" className="mt-0">
              <ConsolidadoFinancialTable
                rows={comprasNoCartao.rows}
                sortedMonths={comprasNoCartao.sortedMonths}
                monthEndBalancesCents={comprasNoCartao.monthEndBalancesCents}
              />
            </TabsContent>
            <TabsContent value="fatura" className="mt-0">
              <ConsolidadoFinancialTable
                rows={porFatura.rows}
                sortedMonths={porFatura.sortedMonths}
                monthEndBalancesCents={porFatura.monthEndBalancesCents}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
