import Link from "next/link"
import {
  ArrowRight,
  CreditCard,
  Landmark,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { currentUser } from "@clerk/nextjs/server"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
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
    description: "Extrato consolidado e saldos.",
    icon: Landmark,
    className: "lg:col-span-2 lg:row-span-1",
  },
  {
    title: "Lançamentos",
    description: "Despesas e receitas personalizadas.",
    icon: Wallet,
    className: "lg:col-span-1 lg:row-span-1",
  },
  {
    title: "Cartões e faturas",
    description: "Controle automático de faturas.",
    icon: CreditCard,
    className: "lg:col-span-1 lg:row-span-1",
  },
  {
    title: "Patrimônio",
    description: "Evolução e rentabilidade.",
    icon: TrendingUp,
    className: "lg:col-span-2 lg:row-span-1",
  },
]

function formatCurrency(value: number) {
  return currency.format(value)
}


export default async function Page() {
  const user = await currentUser()

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-[#f7f3ea]">
      {/* Navigation */}
      <header className="sticky top-0 z-50 animate-fade-in-up border-b border-white/5 bg-[#0f0f0f]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center border border-white/10 bg-[#d8f36a] text-[10px] font-bold tracking-widest text-black">
              MF
            </div>
            <span className="hidden text-[10px] font-medium uppercase tracking-[0.4em] text-white/50 sm:block">
              Minhas Finanças
            </span>
          </div>
          <nav className="flex items-center gap-6 text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">
            {user ? (
               <Link href="/dashboard" className="text-[#d8f36a] hover:opacity-80">Dashboard</Link>
            ) : (
               <Link href="/sign-in" className="hover:text-white">Entrar</Link>
            )}
          </nav>

        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-6 pb-24 pt-32 text-center lg:pt-48">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute left-1/2 top-0 h-[500px] w-[1000px] -translate-x-1/2 rounded-full bg-[#d8f36a]/10 blur-[120px]" />
          <div className="absolute right-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-blue-500/5 blur-[100px]" />
        </div>

        <div className="relative z-10 animate-fade-in-up space-y-10">
          <Badge className="bg-[#d8f36a]/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#d8f36a] border border-[#d8f36a]/20">
            Nova atualização disponível
          </Badge>
          
          <h1 className="mx-auto max-w-4xl text-5xl font-semibold tracking-[-0.07em] text-white sm:text-7xl lg:text-8xl">
            Toda sua vida financeira <br /> em um só lugar.
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg text-white/50 lg:text-xl">
             fluxo de caixa, obrigações e patrimônio em uma única operação.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row pt-4">
            <Button
              asChild
              className="h-12 border border-[#d8f36a] bg-[#d8f36a] px-8 text-[11px] font-bold uppercase tracking-[0.25em] text-black hover:bg-[#c9e45f]"
            >
              <Link href={user ? "/dashboard" : "/sign-in"}>
                {user ? "Acessar Dashboard" : "Entrar agora"}
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section id="recursos" className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
          {modules.map(({ title, description, icon: Icon, className }) => (
            <Card
              key={title}
              className={cn(
                "relative flex flex-col justify-between overflow-hidden border-white/5 bg-[#141414] p-8 ring-0 transition-all hover:bg-[#181818]",
                className
              )}
            >
              <div className="mb-12 flex size-12 items-center justify-center rounded-lg border border-white/5 bg-white/5 text-[#d8f36a]">
                <Icon className="size-6" />
              </div>
              <div>
                <CardTitle className="mb-2 text-2xl font-semibold tracking-[-0.05em] text-white">
                  {title}
                </CardTitle>
                <CardDescription className="text-sm text-white/40">
                  {description}
                </CardDescription>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0f0f0f] py-16">
        <div className="mx-auto max-w-7xl px-6 text-center text-white/30 sm:px-8 lg:px-12">
          <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-white/60 mb-8">Minhas Finanças</p>
          <div className="flex flex-wrap justify-center gap-8 text-[11px] uppercase tracking-[0.2em] font-medium">
             <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
             <Link href="#" className="hover:text-white transition-colors">GitHub</Link>
             <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
             <Link href="#" className="hover:text-white transition-colors">Terms</Link>
          </div>
          <p className="mt-12 text-[10px]">© 2026 Minhas Finanças. Todos os direitos reservados.</p>
        </div>
      </footer>
    </main>
  )
}
