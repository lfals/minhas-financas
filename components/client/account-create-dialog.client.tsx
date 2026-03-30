"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { AccountCreateForm } from "@/components/client/account-create-form.client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function AccountCreateDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 border border-[#d8f36a] bg-[#d8f36a] px-3 py-2 text-[11px] font-medium uppercase tracking-[0.24em] text-black transition-colors hover:bg-[#c9e45f] sm:w-auto"
        >
          <Plus className="size-4" />
          Adicionar conta
        </button>
      </DialogTrigger>
      <DialogContent className="flex max-w-2xl flex-col overflow-hidden border border-white/10 bg-[#141414] p-0 text-white ring-0 sm:max-h-[calc(100dvh-2rem)]">
        <DialogHeader className="shrink-0 border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
          <DialogTitle className="text-2xl font-semibold uppercase tracking-[-0.07em] text-white sm:text-3xl">
            Nova conta
          </DialogTitle>
          <DialogDescription className="text-sm leading-7 text-white/65">
            Cadastre uma origem de saldo sem sair da visão de contas.
          </DialogDescription>
        </DialogHeader>
        <div className="modal-scroll-body min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <AccountCreateForm mode="flat" onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
