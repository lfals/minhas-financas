"use client"

import { useState } from "react"
import { Banknote, ChevronRight } from "lucide-react"

import { SalaryConfigForm } from "@/components/client/salary-config-form.client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { SalaryConfig } from "@/modules/salaries/domain/types"

interface AccountOption {
  id: string
  name: string
}

interface SalaryConfigDialogProps {
  initialConfig: SalaryConfig | null
  accounts: AccountOption[]
}

export function SalaryConfigDialog({ initialConfig, accounts }: SalaryConfigDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group flex items-center justify-between border border-white/10 bg-[#171717] px-4 py-4 transition-colors hover:bg-white/5 w-full text-left"
        >
          <div className="flex items-center gap-4">
            <div className="flex size-10 items-center justify-center border border-white/10 bg-white/5">
              <Banknote className="size-5 text-white/70 transition-colors group-hover:text-[#d8f36a]" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium uppercase tracking-[0.1em] text-white">Salário</p>
              <p className="text-[11px] text-white/50">
                {initialConfig 
                  ? `Configurado: R$ ${(initialConfig.amountCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                  : "Configurar salário mensal"}
              </p>
            </div>
          </div>
          <ChevronRight className="size-5 text-white/30 transition-colors group-hover:text-white" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl border border-white/10 bg-[#141414] p-0 text-white ring-0">
        <DialogHeader className="shrink-0 border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
          <DialogTitle className="text-2xl font-semibold uppercase tracking-[-0.07em] text-white sm:text-3xl">
            Configuração de Salário
          </DialogTitle>
          <DialogDescription className="text-sm leading-7 text-white/65">
            Defina seu salário bruto, descontos e o dia do recebimento para automação mensal.
          </DialogDescription>
        </DialogHeader>
        <div className="modal-scroll-body min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <SalaryConfigForm 
            initialConfig={initialConfig} 
            accounts={accounts} 
            onSuccess={() => setOpen(false)} 
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
