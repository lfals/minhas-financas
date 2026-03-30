"use client"

import { useActionState, useEffect, useState } from "react"
import { Trash2 } from "lucide-react"
import { useFormStatus } from "react-dom"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { archiveAccountAction, type ArchiveAccountActionState } from "@/modules/accounts/presentation/actions"

const initialState: ArchiveAccountActionState = {
  status: "idle",
}

function ConfirmRemoveAction() {
  const { pending } = useFormStatus()

  return (
    <AlertDialogAction
      type="submit"
      variant="destructive"
      disabled={pending}
      className="rounded-none"
    >
      {pending ? "Removendo..." : "Remover conta"}
    </AlertDialogAction>
  )
}

export function AccountRemoveButton({
  accountId,
  accountName,
}: {
  accountId: string
  accountName: string
}) {
  const [open, setOpen] = useState(false)
  const [state, formAction] = useActionState(archiveAccountAction, initialState)

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false)
    }
  }, [state.status])

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 border border-white/10 bg-white/5 text-white/45 hover:border-white/20 hover:bg-white/10 hover:text-white sm:h-7 sm:w-auto sm:px-2.5"
          aria-label={`Remover conta ${accountName}`}
          onClick={(event) => {
            event.stopPropagation()
          }}
        >
          <Trash2 className="size-4" />
          <span className="hidden sm:inline">Remover</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border border-white/10 bg-[#141414] text-white ring-0">
        <AlertDialogHeader className="place-items-start text-left">
          <AlertDialogTitle className="text-base font-semibold text-white">
            Remover conta
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-7 text-white/65">
            A conta <strong className="text-white">{accountName}</strong> será removida da
            visão principal e deixará de entrar na leitura consolidada.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="accountId" value={accountId} />

          {state.status === "error" && state.message ? (
            <p className="text-sm text-[#ff9c7a]">{state.message}</p>
          ) : null}

          <AlertDialogFooter>
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
