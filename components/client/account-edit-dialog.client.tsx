"use client"

import { useState, type KeyboardEvent, type ReactNode } from "react"

import {
  AccountCreateForm,
  type AccountFormValues,
} from "@/components/client/account-create-form.client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function AccountEditDialog({
  initialValues,
  children,
}: {
  initialValues: AccountFormValues
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") {
      return
    }

    event.preventDefault()
    setOpen(true)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#d8f36a]/60 focus-visible:ring-offset-0"
      >
        {children}
      </div>
      <DialogContent className="max-w-2xl border border-white/10 bg-[#141414] p-0 text-white ring-0">
        <DialogHeader className="shrink-0 border-b border-white/10 px-6 py-5">
          <DialogTitle className="text-3xl font-semibold uppercase tracking-[-0.07em] text-white">
            Editar conta
          </DialogTitle>
        </DialogHeader>
        <div className="modal-scroll-body min-h-0 overflow-y-auto px-6 py-5">
          <AccountCreateForm
            initialValues={initialValues}
            mode="flat"
            actionType="update"
            submitLabel="Salvar alterações"
            onSuccess={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
