"use client"

import { useActionState, useEffect, useState } from "react"
import { Trash2, AlertCircle } from "lucide-react"
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
import { deleteAccountAction, type DeleteAccountActionState } from "@/modules/accounts/presentation/actions"
import { NativeSelect } from "@/components/ui/native-select"
import { Label } from "@/components/ui/label"

const initialState: DeleteAccountActionState = {
  status: "idle",
}

function ConfirmRemoveAction({
  requiresMigration,
}: {
  requiresMigration: boolean
}) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      variant="destructive"
      disabled={pending}
      className="rounded-none"
    >
      {pending
        ? "Processando..."
        : requiresMigration
          ? "Transferir e Remover"
          : "Remover conta"}
    </Button>
  )
}

export function AccountRemoveButton({
  accountId,
  accountName,
  otherAccounts,
}: {
  accountId: string
  accountName: string
  otherAccounts: { id: string; name: string }[]
}) {
  const [open, setOpen] = useState(false)
  const [state, formAction] = useActionState(deleteAccountAction, initialState)

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false)
    }
  }, [state.status])

  const requiresMigration = state.status === "error" && state.requiresMigration === true

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
      <AlertDialogContent 
        className="border border-white/10 bg-[#141414] text-white ring-0 sm:max-w-[450px]"
        onClick={(e) => e.stopPropagation()}
      >
        <AlertDialogHeader className="place-items-start text-left">
          <AlertDialogTitle className="text-base font-semibold text-white">
            Remover conta
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-7 text-white/65">
            {requiresMigration ? (
              <span className="flex flex-col gap-3">
                <span className="flex items-start gap-2 text-[#ff9c7a]">
                  <AlertCircle className="mt-1 size-4 shrink-0" />
                  <span>
                    A conta <strong className="text-white">{accountName}</strong> possui lançamentos ou vínculos ativos.
                  </span>
                </span>
                <span>
                  Para continuar com a exclusão, selecione para qual conta deseja transferir todo o histórico.
                </span>
              </span>
            ) : (
              <span>
                A conta <strong className="text-white">{accountName}</strong> será removida permanentemente do sistema.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form action={formAction} className="space-y-6">
          <input type="hidden" name="accountId" value={accountId} />

          {requiresMigration && (
            <div className="space-y-3">
              <Label htmlFor="targetAccountId" className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                Conta de destino
              </Label>
              <NativeSelect
                id="targetAccountId"
                name="targetAccountId"
                required
                className="h-11 rounded-none border-white/10 bg-white/5 text-sm text-white focus:border-[#d8f36a]/50 focus:ring-0"
              >
                <option value="" disabled selected>
                  Selecione uma conta...
                </option>
                {otherAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </NativeSelect>
              {otherAccounts.length === 0 && (
                <p className="text-[11px] text-[#ff9c7a]">
                  Você precisa ter pelo menos outra conta para realizar a migração.
                </p>
              )}
            </div>
          )}

          {state.status === "error" && state.message && !requiresMigration ? (
            <p className="text-sm text-[#ff9c7a]">{state.message}</p>
          ) : null}

          <AlertDialogFooter className="mt-8">
            <AlertDialogCancel
              className="rounded-none border-white/10 bg-transparent text-white hover:bg-white/5 hover:text-white"
              onClick={() => {
                // Reset state when canceling if needed, but Dialog unmount might handle it
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <ConfirmRemoveAction requiresMigration={requiresMigration} />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
