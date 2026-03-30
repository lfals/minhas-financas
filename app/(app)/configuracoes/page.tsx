import { SettingsResetDialog } from "@/components/client/settings-reset-dialog.client"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Card className="border border-white/10 bg-[#141414] ring-0">
        <CardHeader className="gap-4">
          <CardDescription className="text-[11px] uppercase tracking-[0.35em] text-white/50">
            Configurações
          </CardDescription>
          <CardTitle className="max-w-3xl text-3xl font-semibold uppercase tracking-[-0.08em] text-white sm:text-4xl lg:text-5xl">
            Gerencie ações sensíveis do ambiente financeiro.
          </CardTitle>
          <p className="max-w-2xl text-sm leading-6 text-white/65 sm:text-base sm:leading-7">
            Use esta área para limpar dados do app quando quiser testar novamente do zero ou
            descartar movimentações já cadastradas.
          </p>
          <CardAction className="col-start-1 row-start-4 justify-self-start sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:justify-self-end">
            <SettingsResetDialog />
          </CardAction>
        </CardHeader>
      </Card>

      <Card className="border border-white/10 bg-[#171717] ring-0">
        <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/45">Recomeçar tudo</p>
            <p className="text-sm leading-7 text-white/62">
              Remove contas, cartões, lançamentos, faturas e categorias para voltar ao estado
              inicial.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/45">Limpar lançamentos</p>
            <p className="text-sm leading-7 text-white/62">
              Apaga o histórico financeiro e recalcula os saldos com base apenas no saldo inicial
              das contas.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/45">Limpar faturas</p>
            <p className="text-sm leading-7 text-white/62">
              Remove despesas e faturas de cartão sem afetar contas nem lançamentos manuais.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
