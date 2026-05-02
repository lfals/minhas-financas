"use client"

import { ptBR } from "date-fns/locale"
import { format, parseISO } from "date-fns"

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
  accounts,
  rawTransactions,
  rawInvoiceExpenses,
}: DashboardData) {
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

  return (
    <div className="space-y-6">
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
          <Tabs defaultValue="compras" className="gap-4">
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
