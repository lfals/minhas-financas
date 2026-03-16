import { ModuleOverview } from "@/components/rsc/module-overview"

export default function InvestmentsPage() {
  return (
    <ModuleOverview
      eyebrow="Investimentos"
      title="Patrimônio, alocação e resultados em leitura simples."
      description="Acompanhe a composição da carteira, a evolução do patrimônio e o retorno das aplicações com mais clareza."
      bullets={[
        "Compare classes de ativos para entender onde sua carteira está mais concentrada.",
        "Veja resultados e proventos em conjunto para avaliar o desempenho com mais contexto.",
        "Acompanhe a evolução do patrimônio ao longo do tempo e ajuste a estratégia quando necessário.",
      ]}
    />
  )
}
