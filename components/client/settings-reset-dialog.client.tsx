"use client"

import { useActionState, useEffect, useId, useState } from "react"
import { ChevronRight, RotateCcw, TriangleAlert } from "lucide-react"
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
import { resetAppAction, type ResetAppActionState } from "@/modules/settings/presentation/actions"

const initialState: ResetAppActionState = {
  status: "idle",
}

const resetOptions = [
  {
    value: "all",
    label: "Recomeçar tudo",
    description: "Remove contas, cartões, lançamentos, faturas e categorias cadastradas.",
  },
  {
    value: "transactions",
    label: "Limpar lançamentos",
    description:
      "Apaga todo o histórico financeiro e recalcula os saldos das contas a partir do saldo inicial.",
  },
  {
    value: "invoices",
    label: "Limpar faturas",
    description: "Remove somente despesas e faturas de cartão de crédito, preservando contas e lançamentos manuais.",
  },
] as const

function ConfirmResetAction() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" variant="destructive" disabled={pending} className="rounded-none">
      {pending ? "Processando..." : "Confirmar recomeço"}
    </Button>
  )
}

export function SettingsResetDialog() {
  const [open, setOpen] = useState(false)
  const [scope, setScope] = useState<(typeof resetOptions)[number]["value"]>("all")
  const [state, formAction] = useActionState(resetAppAction, initialState)
  const scopeFieldId = useId()

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false)
      setScope("all")
    }
  }, [state.status])

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setScope("all")
        }
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="group flex w-full items-center justify-between border border-white/10 bg-[#171717] px-4 py-4 text-left transition-colors hover:bg-white/5"
        >
          <div className="flex items-center gap-4">
            <div className="flex size-10 items-center justify-center border border-[#ff9c7a]/30 bg-[#ff9c7a]/10">
              <RotateCcw className="size-5 text-[#ff9c7a] transition-colors" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium uppercase tracking-[0.1em] text-[#ff9c7a]">
                Recomeçar
              </p>
              <p className="text-[11px] text-[#ff9c7a]/70">Limpar dados e histórico</p>
            </div>
          </div>
          <ChevronRight className="size-5 text-white/30 transition-colors group-hover:text-white" />
        </button>
      </DialogTrigger>
      <DialogContent className="border border-white/10 bg-[#141414] p-0 text-white ring-0 sm:max-w-lg">
        <DialogHeader className="border-b border-white/10 px-6 py-5">
          <DialogTitle className="text-2xl font-semibold uppercase tracking-[-0.06em] text-white">
            Recomeçar dados
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Escolha qual parte da base você quer limpar. A ação é imediata e não tem desfazer.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-5 px-6 py-5">
          <input type="hidden" name="scope" value={scope} />

          <Field>
            <FieldLabel className="text-white/80" htmlFor={scopeFieldId}>
              O que deseja recomeçar
            </FieldLabel>
            <FieldContent>
              <RadioGroup
                id={scopeFieldId}
                value={scope}
                onValueChange={(value) =>
                  setScope(value as (typeof resetOptions)[number]["value"])
                }
                className="gap-3"
              >
                {resetOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-start gap-3 border border-white/10 bg-white/5 p-3"
                  >
                    <RadioGroupItem
                      value={option.value}
                      className="mt-1 border-white/30 text-black"
                    />
                    <span className="space-y-1">
                      <span className="block text-sm text-white">{option.label}</span>
                      <span className="block text-xs text-white/55">{option.description}</span>
                    </span>
                  </label>
                ))}
              </RadioGroup>
              <FieldDescription className="mt-2 text-white/45">
                Use `recomeçar tudo` apenas quando quiser voltar o app ao estado inicial.
              </FieldDescription>
            </FieldContent>
          </Field>

          <div className="flex items-start gap-3 border border-[#ff9c7a]/20 bg-[#ff9c7a]/8 px-3 py-3 text-sm text-[#ffd2c3]">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <p>
              Se existir movimentação compensada, os saldos serão ajustados automaticamente de
              acordo com a opção escolhida.
            </p>
          </div>

          {state.status !== "idle" && state.message ? (
            <p
              className={
                state.status === "error" ? "text-sm text-[#ff9c7a]" : "text-sm text-[#d8f36a]"
              }
            >
              {state.message}
            </p>
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
            <ConfirmResetAction />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
