"use client"

import { ptBR } from "date-fns/locale"
import { format, parseISO } from "date-fns"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import type { DashboardData } from "@/modules/dashboard/domain/types"

type RowData = {
  type: "Entrada" | "Saída" | "Cartão"
  name: string
  values: Record<string, number> // month (YYYY-MM) -> amountCents
  installmentLabel: string // "Fixo", "12x", "—"
}

function getSortedMonths(
  transactions: import("@/modules/transactions/domain/types").TransactionListRecord[],
  invoiceExpenses: import("@/modules/transactions/domain/types").CreditCardInvoiceExpenseRecord[]
) {
  const months = new Set<string>()

  transactions.forEach((t) => {
    months.add(t.occurredOn.slice(0, 7))
  })

  invoiceExpenses.forEach((e) => {
    const month = e.invoiceMonth?.slice(0, 7) || e.occurredOn.slice(0, 7)
    months.add(month)
  })

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

export function DashboardView({
  accounts,
  rawTransactions,
  rawInvoiceExpenses,
}: DashboardData) {
  const totalInitialBalanceCents = accounts.reduce((sum, a) => sum + a.initialBalanceCents, 0)
  const sortedMonths = getSortedMonths(rawTransactions, rawInvoiceExpenses)
  
  const rowsMap = new Map<string, RowData>()

  const getRowKey = (type: string, name: string) => `${type}:::${name}`

  // Process manual transactions
  rawTransactions.forEach((t) => {
    if (t.sourceType === "credit_card_invoice") return

    const type = t.kind === "income" ? "Entrada" : "Saída"
    const name = getCleanName(t.title)
    const key = getRowKey(type, name)
    const month = t.occurredOn.slice(0, 7)
    
    if (!rowsMap.has(key)) {
      rowsMap.set(key, { type: type as any, name, values: {}, installmentLabel: "—" })
    }
    
    const row = rowsMap.get(key)!
    row.values[month] = (row.values[month] || 0) + t.amountCents

    // Update installment label: fixed takes priority, then installmentTotal
    const label = resolveInstallmentLabel(t.isFixed, t.installmentTotal)
    if (label === "Fixo" || (row.installmentLabel === "—" && label !== "—")) {
      row.installmentLabel = label
    }
  })

  // Track card expense months per key (to infer fixed status)
  const cardExpenseMonths = new Map<string, Set<string>>()

  // Process card expenses
  rawInvoiceExpenses.forEach((e) => {
    const type = "Cartão"
    const name = getCleanName(e.title)
    const key = getRowKey(type, name)
    const month = e.invoiceMonth?.slice(0, 7) || e.occurredOn.slice(0, 7)

    if (!rowsMap.has(key)) {
      rowsMap.set(key, { type: type as any, name, values: {}, installmentLabel: "—" })
    }

    const row = rowsMap.get(key)!
    row.values[month] = (row.values[month] || 0) + e.amountCents

    // Track installmentTotal for card expenses
    if (e.installmentTotal && e.installmentTotal > 1 && row.installmentLabel === "—") {
      row.installmentLabel = `${e.installmentTotal}x`
    }

    // Track unique months for fixed inference
    if (!e.installmentTotal) {
      if (!cardExpenseMonths.has(key)) {
        cardExpenseMonths.set(key, new Set<string>())
      }
      cardExpenseMonths.get(key)!.add(month)
    }
  })

  // Infer fixed status for card expenses without installments appearing in 2+ months
  cardExpenseMonths.forEach((months, key) => {
    const row = rowsMap.get(key)
    if (row && row.installmentLabel === "—" && months.size >= 2) {
      row.installmentLabel = "Fixo"
    }
  })

  const rows = Array.from(rowsMap.values()).sort((a, b) => {
    // Sort by Type (Entrada -> Saída -> Cartão)
    const typeOrder = { Entrada: 0, Saída: 1, Cartão: 2 }
    if (typeOrder[a.type] !== typeOrder[b.type]) {
      return typeOrder[a.type] - typeOrder[b.type]
    }

    // Within same type: Fixo -> Parcelado -> Único
    const installmentOrder = (label: string) =>
      label === "Fixo" ? 0 : label === "—" ? 2 : 1
    const aOrder = installmentOrder(a.installmentLabel)
    const bOrder = installmentOrder(b.installmentLabel)
    if (aOrder !== bOrder) return aOrder - bOrder

    return a.name.localeCompare(b.name)
  })

  return (
    <div className="space-y-6">
      <Card className="border border-white/5 bg-[#0a0a0a] ring-0 overflow-hidden">
        <CardHeader className="gap-2 pb-6">
          <CardDescription className="text-[10px] uppercase tracking-[0.4em] text-white/40">
            Visão Geral
          </CardDescription>
          <CardTitle className="text-3xl font-semibold tracking-[-0.06em] text-white">
            Consolidado Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-2 pt-0">
          <Tabs defaultValue="tabela" className="gap-0">
            <TabsList variant="line" className="w-full justify-start border-b border-white/5 px-2 h-10">
              <TabsTrigger value="tabela">
                Tabela
              </TabsTrigger>
              <TabsTrigger value="graficos">
                Gráficos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tabela" className="mt-0">
              <div className="relative overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
                <Table className="border-separate border-spacing-0 text-xs">
                  <TableHeader className="sticky top-0 z-30 bg-[#0d0d0d]/95 backdrop-blur-md">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="sticky left-0 top-0 z-40 bg-[#0d0d0d] border-b border-r border-white/5 min-w-[100px] py-4 text-white/40 uppercase tracking-[0.15em] font-semibold text-[9px]">
                        Tipo
                      </TableHead>
                      <TableHead className="sticky left-[100px] top-0 z-40 bg-[#0d0d0d] border-b border-r border-white/5 min-w-[80px] py-4 text-white/40 uppercase tracking-[0.15em] font-semibold text-[9px]">
                        Parcelas
                      </TableHead>
                      <TableHead className="sticky left-[180px] top-0 z-40 bg-[#0d0d0d] border-b border-r border-white/5 min-w-[200px] py-4 text-white/40 uppercase tracking-[0.15em] font-semibold text-[9px]">
                        Nome/Mês
                      </TableHead>
                      {sortedMonths.map((month) => (
                        <TableHead 
                          key={month} 
                          className="min-w-[140px] text-center py-4 border-b border-white/5 text-white/40 uppercase tracking-[0.15em] font-semibold text-[9px]"
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
                        <TableCell className={cn(
                          "sticky left-0 z-10 bg-[#0a0a0a] border-r border-white/5 font-medium py-3 group-hover:bg-[#121212] transition-colors",
                          "border-b border-white/5"
                        )}>
                          <span className={cn(
                            "px-2 py-0.5 rounded-[2px] text-[9px] font-bold uppercase tracking-widest",
                            row.type === "Entrada" ? "bg-[#d8f36a]/10 text-[#d8f36a] border border-[#d8f36a]/20" : 
                            row.type === "Saída" ? "bg-[#ff9c7a]/10 text-[#ff9c7a] border border-[#ff9c7a]/20" : 
                            "bg-[#7a99ff]/10 text-[#7a99ff] border border-[#7a99ff]/20"
                          )}>
                            {row.type}
                          </span>
                        </TableCell>
                        <TableCell className={cn(
                          "sticky left-[100px] z-10 bg-[#0a0a0a] border-r border-white/5 text-center py-3 group-hover:bg-[#121212] transition-colors",
                          "border-b border-white/5",
                          row.installmentLabel === "Fixo"
                            ? "text-[#c4b5fd] font-semibold text-[9px] uppercase tracking-wider"
                            : row.installmentLabel === "—"
                              ? "text-white/15"
                              : "text-white/50 font-mono"
                        )}>
                          {row.installmentLabel}
                        </TableCell>
                        <TableCell className={cn(
                          "sticky left-[180px] z-10 bg-[#0a0a0a] border-r border-white/5 font-medium text-white/80 py-3 group-hover:bg-[#121212] transition-colors",
                          "border-b border-white/5"
                        )}>
                          {row.name}
                        </TableCell>
                        {sortedMonths.map((month) => {
                          const value = row.values[month]
                          return (
                            <TableCell 
                              key={month} 
                              className={cn(
                                "text-center font-mono py-3 border-b border-white/5",
                                !value ? "text-white/5" : 
                                row.type === "Entrada" ? "text-[#d8f36a]/90" : "text-white/70"
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
                      <TableCell className="sticky left-0 z-40 bg-[#0d0d0d] border-r border-white/5 py-4 text-white/40 uppercase tracking-[0.15em] font-bold text-[9px]">
                        Resultado
                      </TableCell>
                      <TableCell className="sticky left-[100px] z-40 bg-[#0d0d0d] border-r border-white/5 py-4 text-center text-white/40 font-mono text-[9px]">
                        {rows.length}
                      </TableCell>
                      <TableCell className="sticky left-[180px] z-40 bg-[#0d0d0d] border-r border-white/5 py-4 text-white/40 uppercase tracking-[0.15em] font-bold text-[9px]">
                        Saldo Mensal
                      </TableCell>
                      {(() => {
                        let cumulativeBalance = totalInitialBalanceCents
                        return sortedMonths.map((month) => {
                          const monthNetChange = rows.reduce((acc, row) => {
                            const val = row.values[month] || 0
                            return row.type === "Entrada" ? acc + val : acc - val
                          }, 0)
                          
                          cumulativeBalance += monthNetChange

                          return (
                            <TableCell 
                              key={month} 
                              className={cn(
                                "text-center font-mono py-4 text-sm font-semibold tracking-[-0.05em]",
                                cumulativeBalance >= 0 ? "text-[#d8f36a]" : "text-[#ff9c7a]"
                              )}
                            >
                              {formatCurrency(cumulativeBalance / 100)}
                            </TableCell>
                          )
                        })
                      })()}
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="graficos" className="mt-0">
              <div className="flex items-center justify-center py-24 text-white/20">
                <div className="text-center space-y-3">
                  <svg className="mx-auto h-12 w-12 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/25 font-medium">Em breve</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
