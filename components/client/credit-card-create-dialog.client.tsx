"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import type { CreditCardFormValues } from "@/components/client/credit-card-settings-page.client"
import { CreditCardCreateForm } from "@/components/client/credit-card-create-form.client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { TransactionAccountOption } from "@/modules/transactions/domain/types"

export function CreditCardCreateDialog({
  accountOptions,
  initialValues,
  onSave,
}: {
  accountOptions: TransactionAccountOption[]
  initialValues: CreditCardFormValues
  onSave: (values: CreditCardFormValues) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 border border-[#d8f36a] bg-[#d8f36a] px-3 py-2 text-[11px] font-medium uppercase tracking-[0.24em] text-black transition-colors hover:bg-[#c9e45f]"
        >
          <Plus className="size-4" />
          Adicionar cartão
        </button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] max-w-3xl flex-col overflow-hidden border border-white/10 bg-[#141414] p-0 text-white ring-0">
        <DialogHeader className="shrink-0 border-b border-white/10 px-6 py-5">
          <DialogTitle className="text-3xl font-semibold uppercase tracking-[-0.07em] text-white">
            Novo cartão
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto px-6 py-5">
          <CreditCardCreateForm
            accountOptions={accountOptions}
            initialValues={initialValues}
            mode="flat"
            onSave={onSave}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
