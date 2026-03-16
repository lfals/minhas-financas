"use client"

import { useActionState, useEffect, useId, useState } from "react"
import { Trash2 } from "lucide-react"
import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  removeCreditCardExpenseAction,
  type RemoveCreditCardExpenseActionState,
} from "@/modules/transactions/presentation/actions"

const initialState: RemoveCreditCardExpenseActionState = {
  status: "idle",
}

function ConfirmRemoveAction() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" variant="destructive" disabled={pending} className="rounded-none">
      {pending ? "Removendo..." : "Remover lançamento"}
    </Button>
  )
}

function getScopeContent({
  installmentTotal,
  supportsFutureRemoval,
}: {
  installmentTotal?: number | null
  supportsFutureRemoval: boolean
}) {
  if (installmentTotal) {
    return {
      title: "Remover parcela",
      description: supportsFutureRemoval
        ? "Escolha se deseja remover apenas esta parcela ou esta e as próximas parcelas."
        : "Esta compra é parcelada, mas só é possível remover a parcela selecionada porque a série não possui vínculo completo.",
      singleLabel: "Apenas esta parcela",
      futureLabel: "Esta e próximas parcelas",
      futureDescription: "Remove a parcela atual e todas as parcelas futuras da mesma compra no cartão.",
    }
  }

  return {
    title: "Remover lançamento",
    description:
      "O lançamento será removido da fatura. Se a fatura já estiver compensada, o saldo da conta será ajustado automaticamente.",
    singleLabel: "Apenas este lançamento",
    futureLabel: "",
    futureDescription: "",
  }
}

export function CreditCardExpenseRemoveButton({
  expenseId,
  expenseTitle,
  installmentTotal,
  supportsFutureRemoval,
}: {
  expenseId: string
  expenseTitle: string
  installmentTotal?: number | null
  supportsFutureRemoval: boolean
}) {
  const [open, setOpen] = useState(false)
  const [scope, setScope] = useState<"single" | "future">("single")
  const [state, formAction] = useActionState(removeCreditCardExpenseAction, initialState)
  const scopeFieldId = useId()
  const isInstallment = Boolean(installmentTotal)
  const content = getScopeContent({ installmentTotal, supportsFutureRemoval })

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false)
      setScope("single")
    }
  }, [state.status])

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setScope("single")
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-white/45 hover:bg-white/5 hover:text-[#ff9c7a]"
          aria-label={`Remover lançamento ${expenseTitle}`}
          onClick={(event) => {
            event.stopPropagation()
          }}
        >
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="border border-white/10 bg-[#141414] p-0 text-white ring-0 sm:max-w-md">
        <DialogHeader className="border-b border-white/10 px-6 py-5">
          <DialogTitle className="text-2xl font-semibold uppercase tracking-[-0.06em] text-white">
            {content.title}
          </DialogTitle>
          <DialogDescription className="text-white/60">
            <strong className="text-white">{expenseTitle}</strong>. {content.description}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4 px-6 py-5">
          <input type="hidden" name="expenseId" value={expenseId} />
          <input type="hidden" name="scope" value={scope} />

          {isInstallment ? (
            <Field>
              <FieldLabel className="text-white/80" htmlFor={scopeFieldId}>
                Escopo da remoção
              </FieldLabel>
              <FieldContent>
                <RadioGroup
                  id={scopeFieldId}
                  value={scope}
                  onValueChange={(value) => setScope(value as "single" | "future")}
                  className="gap-3"
                >
                  <label className="flex items-start gap-3 border border-white/10 bg-white/5 p-3">
                    <RadioGroupItem value="single" className="mt-1 border-white/30 text-black" />
                    <span className="space-y-1">
                      <span className="block text-sm text-white">{content.singleLabel}</span>
                      <span className="block text-xs text-white/55">
                        Remove somente o item selecionado.
                      </span>
                    </span>
                  </label>

                  <label
                    className="flex items-start gap-3 border border-white/10 bg-white/5 p-3 data-[disabled=true]:opacity-45"
                    data-disabled={!supportsFutureRemoval}
                  >
                    <RadioGroupItem
                      value="future"
                      disabled={!supportsFutureRemoval}
                      className="mt-1 border-white/30 text-black"
                    />
                    <span className="space-y-1">
                      <span className="block text-sm text-white">{content.futureLabel}</span>
                      <span className="block text-xs text-white/55">
                        {supportsFutureRemoval
                          ? content.futureDescription
                          : "Indisponível para séries antigas sem vínculo de sequência."}
                      </span>
                    </span>
                  </label>
                </RadioGroup>
                {!supportsFutureRemoval ? (
                  <FieldDescription className="mt-2 text-white/45">
                    Compras parceladas novas já suportam remoção em lote das próximas parcelas.
                  </FieldDescription>
                ) : null}
              </FieldContent>
            </Field>
          ) : null}

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
            <ConfirmRemoveAction />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
