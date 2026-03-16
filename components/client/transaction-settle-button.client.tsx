"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"
import {
  settlePendingExpenseAction,
  type SettlePendingExpenseActionState,
} from "@/modules/transactions/presentation/actions"

const initialState: SettlePendingExpenseActionState = {
  status: "idle",
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      size="sm"
      className="h-8 border border-[#d8f36a]/70 bg-[#d8f36a] px-3 text-[10px] uppercase tracking-[0.2em] text-black hover:bg-[#c9e45f]"
      disabled={pending}
    >
      {pending ? "Efetivando..." : "Efetivar"}
    </Button>
  )
}

export function TransactionSettleButton({ transactionId }: { transactionId: string }) {
  const [state, formAction] = useActionState(settlePendingExpenseAction, initialState)

  return (
    <form action={formAction} className="flex flex-col items-start gap-2 md:items-end">
      <input type="hidden" name="transactionId" value={transactionId} />
      <SubmitButton />
      {state.status === "error" && state.message ? (
        <p className="text-right text-xs text-[#ff9c7a]">{state.message}</p>
      ) : null}
    </form>
  )
}
