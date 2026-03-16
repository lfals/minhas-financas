"use client"

import { useActionState, useEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react"
import { useFormStatus } from "react-dom"

import { createAccountAction, type CreateAccountActionState } from "@/modules/accounts/presentation/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

const initialState: CreateAccountActionState = {
  status: "idle",
}

const defaultFormValues = {
  name: "",
  institution: "",
  type: "checking",
  initialBalance: "",
  includeInNetWorth: true,
}

function formatCurrencyDigitsToInput(value: string) {
  const isNegative = value.trim().startsWith("-")
  const digits = value.replace(/\D/g, "")

  if (!digits) {
    return isNegative ? "-" : ""
  }

  const cents = Number(digits)
  const formattedValue = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)

  return isNegative ? `-${formattedValue}` : formattedValue
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      className="h-10 border border-[#d8f36a] bg-[#d8f36a] px-4 text-[11px] uppercase tracking-[0.25em] text-black hover:bg-[#c9e45f]"
      disabled={pending}
    >
      {pending ? "Salvando..." : "Criar conta"}
    </Button>
  )
}

export function AccountCreateForm({
  mode = "card",
  onSuccess,
}: {
  mode?: "card" | "flat"
  onSuccess?: () => void
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction] = useActionState(createAccountAction, initialState)
  const [formValues, setFormValues] = useState(defaultFormValues)

  useEffect(() => {
    if (state.status === "success") {
      setFormValues(defaultFormValues)
      onSuccess?.()
    }
  }, [onSuccess, state.status])

  return (
    <AccountCreateFormContent
      formRef={formRef}
      formAction={formAction}
      formValues={formValues}
      onFormValuesChange={setFormValues}
      state={state}
      mode={mode}
    />
  )
}

function AccountCreateFormContent({
  formRef,
  formAction,
  formValues,
  onFormValuesChange,
  state,
  mode,
}: {
  formRef: RefObject<HTMLFormElement | null>
  formAction: (payload: FormData) => void
  formValues: typeof defaultFormValues
  onFormValuesChange: Dispatch<SetStateAction<typeof defaultFormValues>>
  state: CreateAccountActionState
  mode: "card" | "flat"
}) {
  const content = (
    <form ref={formRef} action={formAction} className="space-y-5">
      <FieldGroup className="gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="name" className="text-white/80">
              Nome da conta
            </FieldLabel>
            <FieldContent>
              <Input
                id="name"
                name="name"
                placeholder="Conta principal"
                value={formValues.name}
                onChange={(event) => {
                  const { value } = event.currentTarget
                  onFormValuesChange((current) => ({
                    ...current,
                    name: value,
                  }))
                }}
                className="h-10 border-white/10 bg-white/5 text-white"
              />
              <FieldError errors={state.fieldErrors?.name?.map((message) => ({ message }))} />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="institution" className="text-white/80">
              Instituição
            </FieldLabel>
            <FieldContent>
              <Input
                id="institution"
                name="institution"
                placeholder="Nubank"
                value={formValues.institution}
                onChange={(event) => {
                  const { value } = event.currentTarget
                  onFormValuesChange((current) => ({
                    ...current,
                    institution: value,
                  }))
                }}
                className="h-10 border-white/10 bg-white/5 text-white"
              />
              <FieldError
                errors={state.fieldErrors?.institution?.map((message) => ({ message }))}
              />
            </FieldContent>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="type" className="text-white/80">
              Tipo
            </FieldLabel>
            <FieldContent>
              <NativeSelect
                id="type"
                name="type"
                value={formValues.type}
                onChange={(event) => {
                  const { value } = event.currentTarget
                  onFormValuesChange((current) => ({
                    ...current,
                    type: value,
                  }))
                }}
                className="h-10 border-white/10 bg-white/5 text-sm text-white"
              >
                <NativeSelectOption value="checking">Conta corrente</NativeSelectOption>
                <NativeSelectOption value="savings">Poupança</NativeSelectOption>
                <NativeSelectOption value="cash">Carteira</NativeSelectOption>
                <NativeSelectOption value="investment">Investimento</NativeSelectOption>
              </NativeSelect>
              <FieldError errors={state.fieldErrors?.type?.map((message) => ({ message }))} />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="initialBalance" className="text-white/80">
              Saldo inicial
            </FieldLabel>
            <FieldContent>
              <Input
                id="initialBalance"
                name="initialBalance"
                inputMode="decimal"
                placeholder="0,00"
                value={formValues.initialBalance}
                onChange={(event) => {
                  const formattedValue = formatCurrencyDigitsToInput(event.currentTarget.value)
                  onFormValuesChange((current) => ({
                    ...current,
                    initialBalance: formattedValue,
                  }))
                }}
                className="h-10 border-white/10 bg-white/5 text-white"
              />
              <FieldError
                errors={state.fieldErrors?.initialBalance?.map((message) => ({ message }))}
              />
            </FieldContent>
          </Field>
        </div>

        <div className="flex items-center gap-3 border border-white/10 bg-white/5 px-3 py-3">
          <input
            id="includeInNetWorth"
            name="includeInNetWorth"
            type="checkbox"
            checked={formValues.includeInNetWorth}
            onChange={(event) => {
              const { checked } = event.currentTarget
              onFormValuesChange((current) => ({
                ...current,
                includeInNetWorth: checked,
              }))
            }}
            className="size-4 rounded-none border border-white/20 bg-transparent accent-[#d8f36a]"
          />
          <Label htmlFor="includeInNetWorth" className="text-sm text-white/78">
            Incluir essa conta no patrimônio consolidado
          </Label>
        </div>
      </FieldGroup>

      {state.message ? (
        <p
          className={
            state.status === "success" ? "text-sm text-[#d8f36a]" : "text-sm text-[#ff9c7a]"
          }
        >
          {state.message}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  )

  if (mode === "flat") {
    return content
  }

  return (
    <Card className="border border-white/10 bg-[#141414] ring-0">
      <CardHeader className="gap-3">
        <CardDescription className="text-[11px] uppercase tracking-[0.35em] text-white/55">
          Nova conta
        </CardDescription>
        <CardTitle className="text-3xl font-semibold uppercase tracking-[-0.07em] text-white">
          Cadastre uma origem de saldo.
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{content}</CardContent>
    </Card>
  )
}
