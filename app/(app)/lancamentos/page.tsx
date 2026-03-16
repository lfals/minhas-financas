import { ModuleOverview } from "@/components/rsc/module-overview"

export default function TransactionsPage() {
  return (
    <ModuleOverview
      eyebrow="Lançamentos"
      title="Tudo o que entra e sai, organizado em um só lugar."
      description="Acompanhe receitas, despesas, ajustes e estornos com contexto suficiente para entender o que aconteceu no período."
      bullets={[
        "Compare receitas e despesas para identificar padrões e corrigir excessos mais cedo.",
        "Classifique movimentações por categoria, data e origem para manter o histórico fácil de consultar.",
        "Use os lançamentos para explicar variações de saldo e dar contexto ao restante do painel.",
      ]}
    />
  )
}
