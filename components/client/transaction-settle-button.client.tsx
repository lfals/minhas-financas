"use client"

import { useActionState, useEffect, useEffectEvent, useState } from "react"
import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { formatCents } from "@/lib/money"
import {
  settleTransactionAction,
  type SettleTransactionActionState,
} from "@/modules/transactions/presentation/actions"

const initialState: SettleTransactionActionState = {
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

function formatCurrencyDigitsToInput(value: string) {
  const digits = value.replace(/\D/g, "")

  if (!digits) {
    return ""
  }

  const cents = Number(digits)

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

export function TransactionSettleButton({
  transactionId,
  originalAmountCents,
}: {
  transactionId: string
  originalAmountCents: number
}) {
  const [state, formAction] = useActionState(settleTransactionAction, initialState)
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const handleSuccess = useEffectEvent(() => {
    setAmount("")
    setOpen(false)
  })

  useEffect(() => {
    if (state.status === "success") {
      handleSuccess()
    }
  }, [handleSuccess, state.status])

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setAmount("")
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          className="h-8 border border-[#d8f36a]/70 bg-[#d8f36a] px-3 text-[10px] uppercase tracking-[0.2em] text-black hover:bg-[#c9e45f]"
        >
          Efetivar
        </Button>
      </DialogTrigger>
      <DialogContent className="border border-white/10 bg-[#141414] p-0 text-white ring-0 sm:max-w-md">
        <DialogHeader className="border-b border-white/10 px-6 py-5">
          <DialogTitle className="text-2xl font-semibold uppercase tracking-[-0.06em] text-white">
            Confirmar efetivação
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Confirme o valor pago. Se deixar em branco, o sistema usará o valor inicial de{" "}
            {formatCents(originalAmountCents)}.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4 px-6 py-5">
          <input type="hidden" name="transactionId" value={transactionId} />
          <Field>
            <FieldLabel htmlFor={`settle-amount-${transactionId}`} className="text-white/80">
              Valor efetivado
            </FieldLabel>
            <FieldContent>
              <Input
                id={`settle-amount-${transactionId}`}
                name="amount"
                inputMode="decimal"
                placeholder={formatCents(originalAmountCents)}
                value={amount}
                onChange={(event) => {
                  setAmount(formatCurrencyDigitsToInput(event.currentTarget.value))
                }}
                className="h-10 border-white/10 bg-white/5 text-white placeholder:text-white/35"
              />
              {amount ? (
                <p className="text-xs text-white/55">
                  Valor efetivado alterado para {amount}.
                </p>
              ) : null}
              {state.status === "error" && state.message ? (
                <FieldError errors={[{ message: state.message }]} />
              ) : null}
            </FieldContent>
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-white/10 bg-transparent text-white hover:bg-white/10 hover:text-white"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
