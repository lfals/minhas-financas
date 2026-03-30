import Link from "next/link"
import {
  ArrowRight,
  CreditCard,
  Landmark,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react"

import { ResponsiveMetrics } from "@/components/client/responsive-metrics.client"
import { SummaryMetricCard } from "@/components/rsc/summary-metric-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
})

const percent = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const snapshot = {
  totalBalance: 128450,
  monthlyExpenses: 18420,
  monthlyIncome: 27600,
  currentInvoice: 5340,
  netWorth: 412800,
  monthlyYield: 0.018,
}

const modules = [
  {
    title: "Contas e saldos",
    description: "Extrato consolidado, saldos por conta e transferências internas.",
    icon: Landmark,
  },
  {
    title: "Lançamentos",
    description: "Despesas, receitas, ajustes e histórico com competência e liquidação.",
    icon: Wallet,
  },
  {
    title: "Cartões e faturas",
    description: "Compras parceladas, fechamento automático e controle do limite disponível.",
    icon: CreditCard,
  },
  {
    title: "Patrimônio",
    description: "Posição atual, proventos, CDI e rentabilidade por classe de ativo.",
    icon: TrendingUp,
  },
]

const accounts = [
  { name: "Conta principal", type: "Nubank", balance: 18400, tone: "bg-[#d8f36a]" },
  { name: "Reserva", type: "BTG Pactual", balance: 52100, tone: "bg-[#c4f1ff]" },
  { name: "Carteira", type: "Disponível", balance: 950, tone: "bg-[#ffe07a]" },
  { name: "Investimentos", type: "Corretora", balance: 57000, tone: "bg-[#ffb4a2]" },
]

const transactions = [
  { name: "Salário", meta: "Receita recorrente", amount: 12400, kind: "positive" },
  { name: "Mercado", meta: "Categoria alimentação", amount: -860, kind: "negative" },
  { name: "Aluguel", meta: "Conta recorrente", amount: -3200, kind: "negative" },
  { name: "Dividendo ITSA4", meta: "Provento liquidado", amount: 245, kind: "positive" },
  { name: "Assinaturas", meta: "Streaming + software", amount: -182, kind: "negative" },
]

const obligations = [
  { title: "Fechamento do cartão Black", date: "18 mar", amount: 5340, status: "Em aberto" },
  { title: "Conta de energia", date: "20 mar", amount: 214, status: "A vencer" },
  { title: "Internet fibra", date: "22 mar", amount: 129, status: "Recorrente" },
  { title: "Condomínio", date: "25 mar", amount: 640, status: "Programado" },
]

const categories = [
  { name: "Moradia", value: 34, amount: 6120 },
  { name: "Alimentação", value: 22, amount: 3960 },
  { name: "Transporte", value: 12, amount: 2160 },
  { name: "Saúde", value: 9, amount: 1620 },
  { name: "Lazer", value: 8, amount: 1440 },
]

const investments = [
  { name: "Tesouro Selic", share: 28, result: "+0,9%" },
  { name: "ETFs globais", share: 24, result: "+2,4%" },
  { name: "FIIs", share: 18, result: "+1,2%" },
  { name: "Ações BR", share: 20, result: "+3,1%" },
  { name: "Cripto", share: 10, result: "-0,8%" },
]

function formatCurrency(value: number) {
  return currency.format(value)
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <SummaryMetricCard
      label={label}
      value={value}
      detail={detail}
      className="border border-black/10 bg-black text-[#f7f3ea]"
    />
  )
}

function SectionHeading({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string
  title: string
  copy: string
}) {
  return (
    <div className="space-y-4">
      <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">{eyebrow}</p>
      <h2 className="max-w-3xl text-4xl font-semibold uppercase tracking-[-0.08em] text-white sm:text-5xl">
        {title}
      </h2>
      <p className="max-w-2xl text-sm leading-7 text-white/68 sm:text-base">{copy}</p>
    </div>
  )
}

export default function Page() {
  return (
    <main className="min-h-screen bg-[#0f0f0f] text-[#f7f3ea]">
      <section className="relative overflow-hidden border-b border-white/10 bg-[#111111]">
        <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-6 sm:px-8 lg:px-12">
          <header className="flex flex-col gap-6 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center border border-white/15 bg-[#d8f36a] text-xs font-semibold uppercase tracking-[0.3em] text-black">
                MF
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">
                  Sistema financeiro pessoal
                </p>
                <p className="text-sm text-white/65">
                  fluxo de caixa, obrigações e patrimônio em uma única operação
                </p>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-white/60">
              {["Visão geral", "Contas", "Faturas", "Investimentos"].map((item) => (
                <Badge
                  key={item}
                  variant="outline"
                  className="border-white/12 bg-white/5 px-3 py-1 text-[11px] tracking-[0.25em] text-white/72"
                >
                  {item}
                </Badge>
              ))}
            </nav>
          </header>

          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
            <div className="space-y-8">
              <div className="space-y-5">
                <Badge className="bg-[#d8f36a] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-black">
                  Sistema financeiro pessoal
                </Badge>
                <h1 className="max-w-5xl text-5xl font-semibold uppercase leading-none tracking-[-0.09em] text-white sm:text-7xl lg:text-[7.4rem]">
                  Controle total da vida financeira sem virar planilha infinita.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-white/68">
                  A interface reúne contas, lançamentos, cartões, recorrências,
                  patrimônio e rentabilidade em uma leitura clara, rápida e
                  confiável. Tudo foi pensado para reduzir atrito no dia a dia e
                  transformar informação dispersa em decisão prática.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  className="h-11 border border-[#d8f36a] bg-[#d8f36a] px-5 text-[11px] uppercase tracking-[0.25em] text-black hover:bg-[#c9e45f]"
                >
                  <Link href="/dashboard">
                    Entrar no dashboard
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-11 border-white/15 bg-white/5 px-5 text-[11px] uppercase tracking-[0.25em] text-white hover:bg-white/10"
                  asChild
                >
                  <Link href="#modulos">Ver recursos</Link>
                </Button>
              </div>
            </div>

            <Card className="relative overflow-hidden border border-white/12 bg-[#1b1b1b] ring-0">
              <div className="absolute right-4 top-4 rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/70">
                Março 2026
              </div>
              <CardHeader className="gap-6 pt-12">
                <CardDescription className="text-[11px] uppercase tracking-[0.35em] text-white/55">
                  Resumo do período
                </CardDescription>
                <CardTitle className="max-w-sm text-4xl font-semibold uppercase tracking-[-0.08em] text-white">
                  Caixa, obrigações e patrimônio em leitura instantânea.
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 pb-6">
                <ResponsiveMetrics
                  mobileItemClassName="basis-[84%] pl-3"
                  gridClassName="grid-cols-2 gap-3"
                >
                  <div className="border border-white/10 bg-white/5 p-3 text-white">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-white/55 sm:text-[11px] sm:tracking-[0.28em]">
                      Saldo total
                    </p>
                    <p className="mt-2 text-xl leading-none font-semibold tracking-[-0.06em] sm:text-2xl">
                      {formatCurrency(snapshot.totalBalance)}
                    </p>
                  </div>
                  <div className="border border-white/10 bg-white/5 p-3 text-white">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-white/55 sm:text-[11px] sm:tracking-[0.28em]">
                      Patrimônio
                    </p>
                    <p className="mt-2 text-xl leading-none font-semibold tracking-[-0.06em] sm:text-2xl">
                      {formatCurrency(snapshot.netWorth)}
                    </p>
                  </div>
                </ResponsiveMetrics>
                <div className="border border-[#d8f36a]/20 bg-[#d8f36a] p-4 text-black">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-black/60">
                      Rentabilidade mensal
                    </p>
                    <Sparkles className="size-4 text-black" />
                  </div>
                  <p className="mt-3 text-4xl font-semibold tracking-[-0.08em]">
                    {percent.format(snapshot.monthlyYield)}
                  </p>
                  <p className="mt-2 text-sm text-black/68">
                    Renda fixa por CDI e renda variável por valorização + proventos.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <ResponsiveMetrics
        className="mx-auto max-w-7xl px-6 py-6 sm:px-8 lg:px-12"
        gridClassName="sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
      >
        <MetricCard
          label="Entradas do mês"
          value={formatCurrency(snapshot.monthlyIncome)}
          detail="Receitas líquidas consolidadas por competência."
        />
        <MetricCard
          label="Saídas do mês"
          value={formatCurrency(snapshot.monthlyExpenses)}
          detail="Despesas e pagamentos já compensados no período."
        />
        <MetricCard
          label="Fatura atual"
          value={formatCurrency(snapshot.currentInvoice)}
          detail="Compras após o fechamento são empurradas para o próximo ciclo."
        />
        <MetricCard
          label="Proventos"
          value={formatCurrency(1840)}
          detail="Dividendos, JCP, FIIs e eventos patrimoniais recebidos."
        />
      </ResponsiveMetrics>

      <section id="modulos" className="border-y border-white/10 bg-[#151515]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:px-8 lg:grid-cols-[0.7fr_1.3fr] lg:px-12">
          <SectionHeading
            eyebrow="Módulos centrais"
            title="Tudo o que importa para cuidar do dinheiro em um só lugar."
            copy="Contas, despesas, cartões e investimentos aparecem conectados na mesma experiência. Você enxerga o presente, antecipa compromissos e acompanha evolução patrimonial sem trocar de contexto."
          />

          <div className="grid gap-4 md:grid-cols-2">
            {modules.map(({ title, description, icon: Icon }) => (
              <Card key={title} className="border border-white/10 bg-[#171717] ring-0">
                <CardHeader className="gap-4">
                  <div className="flex size-11 items-center justify-center border border-white/10 bg-[#d8f36a] text-black">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-2xl font-semibold uppercase tracking-[-0.06em] text-white">
                    {title}
                  </CardTitle>
                  <CardDescription className="max-w-sm text-sm leading-7 text-white/65">
                    {description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-16 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-12">
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Contas e extrato"
            title="Leitura rápida dos saldos e do histórico financeiro."
            copy="Contas correntes, reserva, carteira e investimentos aparecem juntos para facilitar a leitura do todo sem perder o detalhe de cada origem do dinheiro."
          />

          <div className="grid gap-4 md:grid-cols-2">
            {accounts.map((account) => (
              <Card key={account.name} className="border border-white/10 bg-[#171717] ring-0">
                <CardHeader className="gap-3">
                  <div className={cn("h-2 w-20", account.tone)} />
                  <CardDescription className="text-[11px] uppercase tracking-[0.28em] text-white/55">
                    {account.type}
                  </CardDescription>
                  <CardTitle className="text-2xl font-semibold tracking-[-0.06em] text-white">
                    {account.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-end justify-between gap-4 pt-0">
                  <p className="text-3xl font-semibold tracking-[-0.06em] text-white">
                    {formatCurrency(account.balance)}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">
                    saldo atual
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border border-black bg-black text-[#f7f3ea] ring-0">
            <CardHeader className="gap-4">
              <CardDescription className="text-[11px] uppercase tracking-[0.35em] text-white/60">
                Últimas movimentações
              </CardDescription>
              <CardTitle className="text-3xl font-semibold uppercase tracking-[-0.07em]">
                Histórico completo para entender para onde o dinheiro foi.
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {transactions.map((transaction, index) => (
                <div key={transaction.name}>
                  <div className="flex items-center justify-between gap-4 py-2">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-white">{transaction.name}</p>
                      <p className="text-sm text-white/55">{transaction.meta}</p>
                    </div>
                    <p
                      className={cn(
                        "text-lg font-semibold tracking-[-0.05em]",
                        transaction.kind === "positive" ? "text-[#d8f36a]" : "text-[#ff9c7a]"
                      )}
                    >
                      {transaction.kind === "positive" ? "+" : "-"}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </p>
                  </div>
                  {index < transactions.length - 1 ? (
                    <Separator className="bg-white/10" />
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border border-white/10 bg-[#171717] ring-0">
            <CardHeader className="gap-4">
              <CardDescription className="text-[11px] uppercase tracking-[0.35em] text-white/55">
                Obrigações
              </CardDescription>
              <CardTitle className="text-3xl font-semibold uppercase tracking-[-0.07em] text-white">
                Agenda financeira futura.
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {obligations.map((item, index) => (
                <div key={item.title}>
                  <div className="grid grid-cols-[1fr_auto] gap-3 py-2">
                    <div>
                      <p className="text-sm uppercase tracking-[0.16em] text-white">{item.title}</p>
                      <p className="text-sm text-white/55">{item.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm uppercase tracking-[0.18em] text-white/45">{item.date}</p>
                      <p className="text-lg font-semibold tracking-[-0.05em] text-white">
                        {formatCurrency(item.amount)}
                      </p>
                    </div>
                  </div>
                  {index < obligations.length - 1 ? (
                    <Separator className="bg-white/10" />
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-white/10 bg-[#171717] ring-0">
            <CardHeader className="gap-4">
              <CardDescription className="text-[11px] uppercase tracking-[0.35em] text-white/55">
                Gastos do mês
              </CardDescription>
              <CardTitle className="text-3xl font-semibold uppercase tracking-[-0.07em] text-white">
                Distribuição por categoria.
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {categories.map((category) => (
                <div key={category.name} className="space-y-2">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="uppercase tracking-[0.18em] text-white">{category.name}</span>
                    <span className="text-white/55">{formatCurrency(category.amount)}</span>
                  </div>
                  <div className="h-3 border border-white/10 bg-white/5">
                    <div
                      className="h-full bg-[#d8f36a]"
                      style={{ width: `${category.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#131313]">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-12">
          <SectionHeading
            eyebrow="Cartões e patrimônio"
            title="Faturas automáticas e investimentos convivem na mesma cadência."
            copy="Compromissos de curto prazo e construção de patrimônio aparecem lado a lado. Isso acelera decisões melhores e dá mais segurança para planejar o próximo passo."
          />

          <div className="grid gap-4">
            <Card className="border border-black bg-black text-[#f7f3ea] ring-0">
              <CardHeader className="gap-4">
                <CardDescription className="text-[11px] uppercase tracking-[0.35em] text-white/55">
                  Cartão principal
                </CardDescription>
                <CardTitle className="text-3xl font-semibold uppercase tracking-[-0.07em]">
                  Black Visa • fechamento 18 • vencimento 25
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 pt-0 md:grid-cols-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-white/55">Fatura atual</p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-[#d8f36a]">
                    {formatCurrency(snapshot.currentInvoice)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-white/55">Limite total</p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.06em]">
                    {formatCurrency(12000)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-white/55">Disponível</p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.06em]">
                    {formatCurrency(6660)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-white/10 bg-[#171717] ring-0">
              <CardHeader className="gap-4">
                <CardDescription className="text-[11px] uppercase tracking-[0.35em] text-white/55">
                  Alocação consolidada
                </CardDescription>
                <CardTitle className="text-3xl font-semibold uppercase tracking-[-0.07em] text-white">
                  Investimentos por classe e desempenho.
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {investments.map((investment) => (
                  <div key={investment.name} className="grid gap-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="uppercase tracking-[0.18em] text-white">{investment.name}</span>
                      <span className="text-white/55">{investment.result}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-3 flex-1 border border-white/10 bg-white/5">
                        <div
                          className="h-full bg-[#d8f36a]"
                          style={{ width: `${investment.share}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-sm text-white/55">
                        {investment.share}%
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12">
        <footer className="flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/55 lg:flex-row lg:items-center lg:justify-between">
          <p>
            Clareza para operar o presente, previsibilidade para pagar o que vence e visão para construir patrimônio.
          </p>
          <div className="flex flex-wrap gap-3 uppercase tracking-[0.22em]">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="size-4" />
              Clareza
            </span>
            <span className="inline-flex items-center gap-2">
              <CreditCard className="size-4" />
              Controle
            </span>
            <span className="inline-flex items-center gap-2">
              <TrendingUp className="size-4" />
              Crescimento
            </span>
          </div>
        </footer>
      </section>
    </main>
  )
}
