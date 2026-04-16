import Link from "next/link"
import { ChevronRight, CreditCard, Landmark } from "lucide-react"

import { SettingsResetDialog } from "@/components/client/settings-reset-dialog.client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Card className="border border-white/10 bg-[#141414] ring-0">
        <CardHeader className="gap-4 border-b border-white/5 pb-6">
          <CardDescription className="text-[11px] uppercase tracking-[0.35em] text-white/50">
            Configurações e Módulos
          </CardDescription>
          <CardTitle className="max-w-3xl text-2xl font-semibold uppercase tracking-[-0.08em] text-white sm:text-3xl lg:text-4xl">
            Acesse e gerencie cadastros base.
          </CardTitle>
          <p className="max-w-2xl text-sm leading-6 text-white/65 sm:text-base sm:leading-7">
            Aqui você encontra os cadastros do sistema para gerenciar suas contas bancárias, cartões de crédito e ações sensíveis do ambiente.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-6">
          <Link
            href="/configuracoes/contas"
            className="group flex items-center justify-between border border-white/10 bg-[#171717] px-4 py-4 transition-colors hover:bg-white/5"
          >
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center border border-white/10 bg-white/5">
                <Landmark className="size-5 text-white/70 transition-colors group-hover:text-[#d8f36a]" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium uppercase tracking-[0.1em] text-white">Contas</p>
                <p className="text-[11px] text-white/50">Gerenciar contas bancárias</p>
              </div>
            </div>
            <ChevronRight className="size-5 text-white/30 transition-colors group-hover:text-white" />
          </Link>

          <Link
            href="/configuracoes/cartoes"
            className="group flex items-center justify-between border border-white/10 bg-[#171717] px-4 py-4 transition-colors hover:bg-white/5"
          >
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center border border-white/10 bg-white/5">
                <CreditCard className="size-5 text-white/70 transition-colors group-hover:text-[#d8f36a]" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium uppercase tracking-[0.1em] text-white">Cartões</p>
                <p className="text-[11px] text-white/50">Gerenciar cartões de crédito</p>
              </div>
            </div>
            <ChevronRight className="size-5 text-white/30 transition-colors group-hover:text-white" />
          </Link>

          <SettingsResetDialog />
        </CardContent>
      </Card>
    </div>
  )
}
