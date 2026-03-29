"use client"

import { useActionState, useEffect } from "react"
import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"
import {
  settleCreditCardExpenseAction,
  type SettleCreditCardExpenseActionState,
} from "@/modules/transactions/presentation/actions"

const initialState: SettleCreditCardExpenseActionState = {
  status: "idle",
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      size="icon"
      variant="ghost"
      className="size-8 text-white/45 hover:bg-white/5 hover:text-[#d8f36a]"
      disabled={pending}
      aria-label="Efetivar lançamento na fatura"
    >
      {pending ? "..." : "OK"}
    </Button>
  )
}

export function CreditCardExpenseSettleButton({
  expenseId,
  onSuccess,
}: {
  expenseId: string
  onSuccess?: () => void
}) {
  const [state, formAction] = useActionState(settleCreditCardExpenseAction, initialState)

  useEffect(() => {
    if (state.status === "success") {
      onSuccess?.()
    }
  }, [onSuccess, state.status])

  return (
    <form action={formAction}>
      <input type="hidden" name="expenseId" value={expenseId} />
      <SubmitButton />
    </form>
  )
}
