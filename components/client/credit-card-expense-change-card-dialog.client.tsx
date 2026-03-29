"use client"

import { useActionState, useEffect, useId, useState } from "react"
import { CreditCard } from "lucide-react"
import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  changeCreditCardExpenseCardAction,
  type ChangeCreditCardExpenseCardActionState,
} from "@/modules/transactions/presentation/actions"
import type { TransactionCreditCardOption } from "@/modules/transactions/domain/types"

const initialState: ChangeCreditCardExpenseCardActionState = {
  status: "idle",
}

export function CreditCardExpenseChangeCardDialog({
  expenseId,
  expenseTitle,
  currentCardId,
  cardOptions,
}: {
  expenseId: string
  expenseTitle: string
  currentCardId: string
  cardOptions: TransactionCreditCardOption[]
}) {
  const [open, setOpen] = useState(false)
  const [selectedCardId, setSelectedCardId] = useState(currentCardId)
  const [state, formAction] = useActionState(changeCreditCardExpenseCardAction, initialState)
  const selectFieldId = useId()

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false)
      setSelectedCardId(currentCardId)
    }
  }, [state.status, currentCardId])

  const disableAction = !cardOptions.length || selectedCardId === currentCardId
  const pending = useFormStatus().pending

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setSelectedCardId(currentCardId)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-white/45 hover:bg-white/5 hover:text-[#d8f36a]"
          aria-label={`Alterar cartão do lançamento ${expenseTitle}`}
          onClick={(event) => {
            event.stopPropagation()
          }}
          disabled={!cardOptions.length}
        >
          <CreditCard className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="border border-white/10 bg-[#141414] p-0 text-white ring-0 sm:max-w-sm">
        <DialogHeader className="border-b border-white/10 px-6 py-5">
          <DialogTitle className="text-2xl font-semibold uppercase tracking-[-0.06em] text-white">
            Alterar cartão
          </DialogTitle>
          <p className="text-sm text-white/60">{expenseTitle}</p>
        </DialogHeader>
        <form action={formAction} className="space-y-4 px-6 py-5">
          <input type="hidden" name="expenseId" value={expenseId} />

          <Field>
            <FieldLabel className="text-white/80" htmlFor={selectFieldId}>
              Cartão
            </FieldLabel>
            <FieldContent>
              <NativeSelect
                id={selectFieldId}
                name="targetCardId"
                value={selectedCardId}
                onChange={(event) => setSelectedCardId(event.currentTarget.value)}
                className="h-10 w-full border-white/10 bg-white/5 text-sm text-white"
                disabled={!cardOptions.length}
              >
                {cardOptions.length ? null : (
                  <NativeSelectOption value="">Nenhum cartão disponível</NativeSelectOption>
                )}
                {cardOptions.map((option) => (
                  <NativeSelectOption key={option.id} value={option.id}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError errors={state.fieldErrors?.targetCardId?.map((message) => ({ message }))} />
            </FieldContent>
          </Field>

          {state.status === "error" && state.message ? (
            <p className="text-sm text-[#ff9c7a]">{state.message}</p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-white/10 bg-transparent text-white hover:bg-white/10 hover:text-white"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={disableAction || pending}>
              {pending ? "Alterando..." : "Trocar cartão"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
