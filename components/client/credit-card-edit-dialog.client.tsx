"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"

import type { CreditCardFormValues } from "@/components/client/credit-card-settings-page.client"
import { CreditCardCreateForm } from "@/components/client/credit-card-create-form.client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { TransactionAccountOption } from "@/modules/transactions/domain/types"

export function CreditCardEditDialog({
  accountOptions,
  initialValues,
}: {
  accountOptions: TransactionAccountOption[]
  initialValues: CreditCardFormValues
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-9 border-white/10 bg-transparent px-3 text-[11px] uppercase tracking-[0.24em] text-white hover:bg-white/5 hover:text-white"
        >
          <Pencil className="size-4" />
          Alterar
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-1rem)] max-w-3xl flex-col overflow-hidden border border-white/10 bg-[#141414] p-0 text-white ring-0 sm:max-h-[calc(100dvh-2rem)]">
        <DialogHeader className="shrink-0 border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
          <DialogTitle className="text-2xl font-semibold uppercase tracking-[-0.07em] text-white sm:text-3xl">
            Alterar cartão
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <CreditCardCreateForm
            accountOptions={accountOptions}
            initialValues={initialValues}
            mode="flat"
            submitLabel="Salvar alterações"
            actionType="update"
            onSuccess={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
