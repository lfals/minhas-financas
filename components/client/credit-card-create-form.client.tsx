"use client"

import { useActionState, useEffect, useState } from "react"
import { useFormStatus } from "react-dom"

import type { CreditCardFormValues } from "@/components/client/credit-card-settings-page.client"
import { defaultCreditCardFormValues } from "@/components/client/credit-card-settings-page.client"
import {
  createCreditCardAction,
  type CreditCardActionState,
  updateCreditCardAction,
} from "@/modules/credit-cards/presentation/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Switch } from "@/components/ui/switch"
import type { TransactionAccountOption } from "@/modules/transactions/domain/types"

const initialState: CreditCardActionState = {
  status: "idle",
}

function formatCurrencyDigitsToInput(value: string) {
  const digits = value.replace(/\D/g, "")

  if (!digits) {
    return ""
  }

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(digits) / 100)
}

function FormSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      className="h-10 border border-[#d8f36a] bg-[#d8f36a] px-4 text-[11px] uppercase tracking-[0.25em] text-black hover:bg-[#c9e45f]"
      disabled={pending}
    >
      {pending ? "Salvando..." : label}
    </Button>
  )
}

export function CreditCardCreateForm({
  accountOptions,
  initialValues = defaultCreditCardFormValues,
  mode = "card",
  actionType = "create",
  onSuccess,
  submitLabel = "Salvar cartão",
}: {
  accountOptions: TransactionAccountOption[]
  initialValues?: CreditCardFormValues
  mode?: "card" | "flat"
  actionType?: "create" | "update"
  onSuccess?: () => void
  submitLabel?: string
}) {
  const [formValues, setFormValues] = useState(initialValues)
  const [state, formAction] = useActionState(
    actionType === "update" ? updateCreditCardAction : createCreditCardAction,
    initialState
  )

  useEffect(() => {
    const hasMatchingAccount = accountOptions.some(
      (option) => option.id === formValues.expenseAccountId
    )

    if (hasMatchingAccount || !accountOptions.length) {
      return
    }

    setFormValues((current) => ({
      ...current,
      expenseAccountId: accountOptions[0]?.id ?? "",
    }))
  }, [accountOptions, formValues.expenseAccountId])

  useEffect(() => {
    setFormValues(initialValues)
  }, [initialValues])

  useEffect(() => {
    if (state.status === "success") {
      setFormValues({
        ...(actionType === "update" ? initialValues : defaultCreditCardFormValues),
        expenseAccountId:
          actionType === "update"
            ? initialValues.expenseAccountId
            : accountOptions[0]?.id ?? "",
      })
      onSuccess?.()
    }
  }, [accountOptions, actionType, initialValues, onSuccess, state.status])

  const content = (
    <form action={formAction} className="space-y-5">
      {actionType === "update" && formValues.cardId ? (
        <input type="hidden" name="cardId" value={formValues.cardId} />
      ) : null}

      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="nickname" className="text-white/80">
            Nome de exibição <span className="text-[#ff9c7a]">*</span>
          </FieldLabel>
          <FieldContent>
            <Input
              id="nickname"
              name="nickname"
              placeholder="Cartão Black principal"
              value={formValues.nickname}
              onChange={(event) => {
                const { value } = event.currentTarget

                setFormValues((current) => ({ ...current, nickname: value }))
              }}
              className="h-10 border-white/10 bg-white/5 text-white"
            />
            <FieldError errors={state.fieldErrors?.nickname?.map((message) => ({ message }))} />
          </FieldContent>
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="finalDigits" className="text-white/80">
              Final do cartão (opcional)
            </FieldLabel>
            <FieldContent>
              <Input
                id="finalDigits"
                name="finalDigits"
                inputMode="numeric"
                maxLength={4}
                placeholder="4821"
                value={formValues.finalDigits}
                onChange={(event) => {
                  const finalDigits = event.currentTarget.value.replace(/\D/g, "").slice(0, 4)

                  setFormValues((current) => ({
                    ...current,
                    finalDigits,
                  }))
                }}
                className="h-10 border-white/10 bg-white/5 text-white"
              />
              <FieldError
                errors={state.fieldErrors?.finalDigits?.map((message) => ({ message }))}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="limit" className="text-white/80">
              Limite aprovado (opcional)
            </FieldLabel>
            <FieldContent>
              <Input
                id="limit"
                name="limit"
                inputMode="decimal"
                placeholder="0,00"
                value={formValues.limit}
                onChange={(event) => {
                  const limit = formatCurrencyDigitsToInput(event.currentTarget.value)

                  setFormValues((current) => ({
                    ...current,
                    limit,
                  }))
                }}
                className="h-10 border-white/10 bg-white/5 text-white"
              />
              <FieldError errors={state.fieldErrors?.limit?.map((message) => ({ message }))} />
            </FieldContent>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="closingDay" className="text-white/80">
              Dia de fechamento (opcional)
            </FieldLabel>
            <FieldContent>
              <Input
                id="closingDay"
                name="closingDay"
                inputMode="numeric"
                placeholder="18"
                value={formValues.closingDay}
                onChange={(event) => {
                  const closingDay = event.currentTarget.value.replace(/\D/g, "").slice(0, 2)

                  setFormValues((current) => ({
                    ...current,
                    closingDay,
                  }))
                }}
                className="h-10 border-white/10 bg-white/5 text-white"
              />
              <FieldError
                errors={state.fieldErrors?.closingDay?.map((message) => ({ message }))}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="dueDay" className="text-white/80">
              Dia de vencimento (opcional)
            </FieldLabel>
            <FieldContent>
              <Input
                id="dueDay"
                name="dueDay"
                inputMode="numeric"
                placeholder="25"
                value={formValues.dueDay}
                onChange={(event) => {
                  const dueDay = event.currentTarget.value.replace(/\D/g, "").slice(0, 2)

                  setFormValues((current) => ({
                    ...current,
                    dueDay,
                  }))
                }}
                className="h-10 border-white/10 bg-white/5 text-white"
              />
              <FieldError errors={state.fieldErrors?.dueDay?.map((message) => ({ message }))} />
            </FieldContent>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="expenseAccount" className="text-white/80">
            Conta para pagamento
          </FieldLabel>
          <FieldContent>
            <NativeSelect
              id="expenseAccount"
              name="expenseAccountId"
              value={formValues.expenseAccountId}
              onChange={(event) => {
                const { value } = event.currentTarget

                setFormValues((current) => ({
                  ...current,
                  expenseAccountId: value,
                }))
              }}
              className="h-10 w-full border-white/10 bg-white/5 text-sm text-white"
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
            <FieldError
              errors={state.fieldErrors?.expenseAccountId?.map((message) => ({ message }))}
            />
          </FieldContent>
        </Field>

        <div className="grid gap-4">
          <Field>
            <FieldLabel htmlFor="autoCategorizationEnabled" className="text-white/80">
              Categorização automática
            </FieldLabel>
            <div className="flex h-10 items-center justify-between border border-white/10 bg-white/5 px-3">
              <span className="text-sm text-white/65">Aplicar regras automáticas nas despesas</span>
              <Switch
                id="autoCategorizationEnabled"
                name="autoCategorizationEnabled"
                checked={formValues.autoCategorizationEnabled}
                onCheckedChange={(checked) =>
                  setFormValues((current) => ({ ...current, autoCategorizationEnabled: checked }))
                }
                className="data-checked:bg-[#d8f36a] data-unchecked:bg-white/15"
              />
            </div>
          </Field>
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

      <FormSubmitButton label={submitLabel} />
    </form>
  )

  if (mode === "flat") {
    return content
  }

  return (
    <Card className="border border-white/10 bg-[#141414] ring-0">
      <CardHeader className="gap-3">
        <CardDescription className="text-[11px] uppercase tracking-[0.35em] text-white/55">
          Novo cartão
        </CardDescription>
        <CardTitle className="text-3xl font-semibold uppercase tracking-[-0.07em] text-white">
          Configure o cartão de crédito.
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{content}</CardContent>
    </Card>
  )
}
