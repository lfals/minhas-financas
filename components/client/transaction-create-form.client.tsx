"use client"

import { useActionState, useEffect, useRef } from "react"
import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import {
  createTransactionAction,
  type CreateTransactionActionState,
} from "@/modules/transactions/presentation/actions"
import type { TransactionAccountOption } from "@/modules/transactions/domain/types"

const initialState: CreateTransactionActionState = {
  status: "idle",
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

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      className="h-10 border border-[#d8f36a] bg-[#d8f36a] px-4 text-[11px] uppercase tracking-[0.25em] text-black hover:bg-[#c9e45f]"
      disabled={pending || disabled}
    >
      {pending ? "Salvando..." : "Criar lançamento"}
    </Button>
  )
}

export function TransactionCreateForm({
  accountOptions,
  defaultOccurredOn,
  mode = "card",
  onSuccess,
}: {
  accountOptions: TransactionAccountOption[]
  defaultOccurredOn: string
  mode?: "card" | "flat"
  onSuccess?: () => void
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction] = useActionState(createTransactionAction, initialState)

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset()
      onSuccess?.()
    }
  }, [onSuccess, state.status])

  const content = (
    <form ref={formRef} action={formAction} className="space-y-5">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="accountId" className="text-white/80">
            Conta
          </FieldLabel>
          <FieldContent>
            <NativeSelect
              id="accountId"
              name="accountId"
              defaultValue={accountOptions[0]?.id ?? ""}
              className="h-10 border-white/10 bg-white/5 text-sm text-white"
              disabled={!accountOptions.length}
            >
              {accountOptions.length ? null : (
                <NativeSelectOption value="">Nenhuma conta disponível</NativeSelectOption>
              )}
              {accountOptions.map((option) => (
                <NativeSelectOption key={option.id} value={option.id}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldError errors={state.fieldErrors?.accountId?.map((message) => ({ message }))} />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="title" className="text-white/80">
            Descrição
          </FieldLabel>
          <FieldContent>
            <Input
              id="title"
              name="title"
              placeholder="Supermercado"
              className="h-10 border-white/10 bg-white/5 text-white"
            />
            <FieldError errors={state.fieldErrors?.title?.map((message) => ({ message }))} />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="category" className="text-white/80">
            Categoria
          </FieldLabel>
          <FieldContent>
            <Input
              id="category"
              name="category"
              placeholder="Alimentação"
              className="h-10 border-white/10 bg-white/5 text-white"
            />
            <FieldError errors={state.fieldErrors?.category?.map((message) => ({ message }))} />
          </FieldContent>
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="kind" className="text-white/80">
              Tipo
            </FieldLabel>
            <FieldContent>
              <NativeSelect
                id="kind"
                name="kind"
                defaultValue="expense"
                className="h-10 border-white/10 bg-white/5 text-sm text-white"
              >
                <NativeSelectOption value="expense">Despesa</NativeSelectOption>
                <NativeSelectOption value="income">Receita</NativeSelectOption>
              </NativeSelect>
              <FieldError errors={state.fieldErrors?.kind?.map((message) => ({ message }))} />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="status" className="text-white/80">
              Status
            </FieldLabel>
            <FieldContent>
              <NativeSelect
                id="status"
                name="status"
                defaultValue="compensated"
                className="h-10 border-white/10 bg-white/5 text-sm text-white"
              >
                <NativeSelectOption value="compensated">Compensado</NativeSelectOption>
                <NativeSelectOption value="pending">Pendente</NativeSelectOption>
                <NativeSelectOption value="scheduled">Agendado</NativeSelectOption>
              </NativeSelect>
              <FieldError errors={state.fieldErrors?.status?.map((message) => ({ message }))} />
            </FieldContent>
          </Field>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="amount" className="text-white/80">
              Valor
            </FieldLabel>
            <FieldContent>
              <Input
                id="amount"
                name="amount"
                inputMode="decimal"
                placeholder="0,00"
                onChange={(event) => {
                  event.currentTarget.value = formatCurrencyDigitsToInput(event.currentTarget.value)
                }}
                className="h-10 border-white/10 bg-white/5 text-white"
              />
              <FieldError errors={state.fieldErrors?.amount?.map((message) => ({ message }))} />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="occurredOn" className="text-white/80">
              Data
            </FieldLabel>
            <FieldContent>
              <Input
                id="occurredOn"
                name="occurredOn"
                type="date"
                defaultValue={defaultOccurredOn}
                className="h-10 border-white/10 bg-white/5 text-white"
              />
              <FieldError
                errors={state.fieldErrors?.occurredOn?.map((message) => ({ message }))}
              />
            </FieldContent>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="notes" className="text-white/80">
            Observações
          </FieldLabel>
          <FieldContent>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Opcional"
              className="border-white/10 bg-white/5 text-white"
            />
            <FieldError errors={state.fieldErrors?.notes?.map((message) => ({ message }))} />
          </FieldContent>
        </Field>
      </FieldGroup>

      {!accountOptions.length ? (
        <p className="text-sm text-[#ff9c7a]">
          Cadastre uma conta antes de adicionar o primeiro lançamento.
        </p>
      ) : null}

      {state.message ? (
        <p
          className={
            state.status === "success" ? "text-sm text-[#d8f36a]" : "text-sm text-[#ff9c7a]"
          }
        >
          {state.message}
        </p>
      ) : null}

      <SubmitButton disabled={!accountOptions.length} />
    </form>
  )

  if (mode === "flat") {
    return content
  }

  return (
    <Card className="border border-white/10 bg-[#141414] ring-0">
      <CardHeader className="gap-3">
        <CardDescription className="text-[11px] uppercase tracking-[0.35em] text-white/55">
          Novo lançamento
        </CardDescription>
        <CardTitle className="text-3xl font-semibold uppercase tracking-[-0.07em] text-white">
          Registre uma entrada ou saída.
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{content}</CardContent>
    </Card>
  )
}
