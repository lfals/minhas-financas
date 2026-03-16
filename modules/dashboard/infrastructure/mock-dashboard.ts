import { cache } from "react"

import type { DashboardData } from "@/modules/dashboard/domain/types"

const dashboardData: DashboardData = {
  snapshot: {
    periodLabel: "Março 2026",
    totalBalance: 128450,
    netWorth: 412800,
    monthlyYield: 0.018,
    currentInvoice: 5340,
  },
  metrics: [
    {
      label: "Entradas do mês",
      value: 27600,
      deltaLabel: "Receitas líquidas consolidadas",
      trend: "up",
    },
    {
      label: "Saídas do mês",
      value: 18420,
      deltaLabel: "Pagamentos já compensados",
      trend: "down",
    },
    {
      label: "Fatura atual",
      value: 5340,
      deltaLabel: "Fechamento em 18 de março",
      trend: "neutral",
    },
    {
      label: "Proventos",
      value: 1840,
      deltaLabel: "Dividendos e rendimentos liquidados",
      trend: "up",
    },
  ],
  accounts: [
    {
      id: "acc-main",
      name: "Conta principal",
      institution: "Nubank",
      type: "Conta corrente",
      balance: 18400,
      tone: "bg-[#d8f36a]",
    },
    {
      id: "acc-reserve",
      name: "Reserva",
      institution: "BTG Pactual",
      type: "Conta investimento",
      balance: 52100,
      tone: "bg-[#c4f1ff]",
    },
    {
      id: "acc-wallet",
      name: "Carteira",
      institution: "Disponível",
      type: "Dinheiro",
      balance: 950,
      tone: "bg-[#ffe07a]",
    },
    {
      id: "acc-invest",
      name: "Corretora",
      institution: "BTG Investimentos",
      type: "Custódia",
      balance: 57000,
      tone: "bg-[#ffb4a2]",
    },
  ],
  transactions: [
    {
      id: "txn-1",
      title: "Salário",
      category: "Receita recorrente",
      dateLabel: "05 mar",
      amount: 12400,
      kind: "income",
    },
    {
      id: "txn-2",
      title: "Mercado",
      category: "Alimentação",
      dateLabel: "09 mar",
      amount: -860,
      kind: "expense",
    },
    {
      id: "txn-3",
      title: "Aluguel",
      category: "Moradia",
      dateLabel: "10 mar",
      amount: -3200,
      kind: "expense",
    },
    {
      id: "txn-4",
      title: "Dividendo ITSA4",
      category: "Provento liquidado",
      dateLabel: "12 mar",
      amount: 245,
      kind: "income",
    },
    {
      id: "txn-5",
      title: "Assinaturas",
      category: "Softwares e streaming",
      dateLabel: "14 mar",
      amount: -182,
      kind: "expense",
    },
  ],
  obligations: [
    {
      id: "obl-1",
      title: "Fechamento do cartão Black",
      dueLabel: "18 mar",
      amount: 5340,
      status: "Em aberto",
    },
    {
      id: "obl-2",
      title: "Conta de energia",
      dueLabel: "20 mar",
      amount: 214,
      status: "A vencer",
    },
    {
      id: "obl-3",
      title: "Internet fibra",
      dueLabel: "22 mar",
      amount: 129,
      status: "Recorrente",
    },
    {
      id: "obl-4",
      title: "Condomínio",
      dueLabel: "25 mar",
      amount: 640,
      status: "Programado",
    },
  ],
  categories: [
    { id: "cat-1", name: "Moradia", share: 34, amount: 6120 },
    { id: "cat-2", name: "Alimentação", share: 22, amount: 3960 },
    { id: "cat-3", name: "Transporte", share: 12, amount: 2160 },
    { id: "cat-4", name: "Saúde", share: 9, amount: 1620 },
    { id: "cat-5", name: "Lazer", share: 8, amount: 1440 },
  ],
  investments: [
    { id: "inv-1", name: "Tesouro Selic", allocation: 28, result: 0.009 },
    { id: "inv-2", name: "ETFs globais", allocation: 24, result: 0.024 },
    { id: "inv-3", name: "FIIs", allocation: 18, result: 0.012 },
    { id: "inv-4", name: "Ações BR", allocation: 20, result: 0.031 },
    { id: "inv-5", name: "Cripto", allocation: 10, result: -0.008 },
  ],
}

async function resolveWithLatency<T>(value: T) {
  await new Promise((resolve) => setTimeout(resolve, 40))
  return value
}

export const getDashboardSnapshot = cache(async () => resolveWithLatency(dashboardData.snapshot))

export const getDashboardMetrics = cache(async () => resolveWithLatency(dashboardData.metrics))

export const getDashboardAccounts = cache(async () => resolveWithLatency(dashboardData.accounts))

export const getDashboardTransactions = cache(async () =>
  resolveWithLatency(dashboardData.transactions)
)

export const getDashboardObligations = cache(async () =>
  resolveWithLatency(dashboardData.obligations)
)

export const getDashboardCategories = cache(async () => resolveWithLatency(dashboardData.categories))

export const getDashboardInvestments = cache(async () =>
  resolveWithLatency(dashboardData.investments)
)
