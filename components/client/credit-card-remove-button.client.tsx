"use client"

import { startTransition, useActionState, useState } from "react"
import { Trash2 } from "lucide-react"
import { useFormStatus } from "react-dom"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  archiveCreditCardAction,
  type ArchiveCreditCardActionState,
} from "@/modules/credit-cards/presentation/actions"

const initialState: ArchiveCreditCardActionState = {
  status: "idle",
}

function ConfirmRemoveAction() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      variant="destructive"
      disabled={pending}
      className="rounded-none border border-[#ff9c7a]/40 bg-[#ff9c7a]/15 text-[#ff9c7a] hover:bg-[#ff9c7a]/25"
    >
      {pending ? "Removendo..." : "Remover cartão"}
    </Button>
  )
}

export function CreditCardRemoveButton({
  cardId,
  cardName,
  onArchived,
}: {
  cardId: string
  cardName: string
  onArchived?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [state, formAction] = useActionState(
    async (_prev: ArchiveCreditCardActionState, formData: FormData) => {
      const next = await archiveCreditCardAction(_prev, formData)
      if (next.status === "success") {
        startTransition(() => {
          setOpen(false)
          onArchived?.()
        })
      }
      return next
    },
    initialState,
  )

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-9 shrink-0 border-white/15 bg-transparent px-3 text-[11px] uppercase tracking-[0.24em] text-[#ff9c7a] hover:border-[#ff9c7a]/40 hover:bg-[#ff9c7a]/10 hover:text-[#ffb39a]"
          aria-label={`Remover cartão ${cardName}`}
          onClick={(event) => {
            event.stopPropagation()
          }}
        >
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent
        className="border border-white/10 bg-[#141414] text-white ring-0 sm:max-w-[450px]"
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <AlertDialogHeader className="place-items-start text-left">
          <AlertDialogTitle className="text-base font-semibold text-white">Remover cartão</AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-7 text-white/65">
            O cartão <strong className="text-white">{cardName}</strong> deixa de aparecer nos cadastros e novos
            lançamentos não poderão ser vinculados a ele.
            <span className="mt-3 block">
              Todas as despesas e faturas já registradas continuam no histórico, associadas ao nome deste cartão.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form action={formAction} className="space-y-6">
          <input type="hidden" name="cardId" value={cardId} />

          {state.status === "error" && state.message ? (
            <p className="text-sm text-[#ff9c7a]" role="alert">
              {state.message}
            </p>
          ) : null}

          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel className="rounded-none border-white/10 bg-transparent text-white hover:bg-white/5 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <ConfirmRemoveAction />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
