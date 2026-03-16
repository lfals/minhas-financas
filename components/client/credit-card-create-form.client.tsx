"use client"

import { useEffect, useState } from "react"

import type { CreditCardFormValues } from "@/components/client/credit-card-settings-page.client"
import { defaultCreditCardFormValues } from "@/components/client/credit-card-settings-page.client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Switch } from "@/components/ui/switch"
import type { TransactionAccountOption } from "@/modules/transactions/domain/types"

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

function SubmitButton() {
  return (
    <Button
      type="submit"
      className="h-10 border border-[#d8f36a] bg-[#d8f36a] px-4 text-[11px] uppercase tracking-[0.25em] text-black hover:bg-[#c9e45f]"
    >
      Salvar cartão
    </Button>
  )
}

export function CreditCardCreateForm({
  accountOptions,
  initialValues = defaultCreditCardFormValues,
  mode = "card",
  onSave,
  onSuccess,
}: {
  accountOptions: TransactionAccountOption[]
  initialValues?: CreditCardFormValues
  mode?: "card" | "flat"
  onSave: (values: CreditCardFormValues) => void
  onSuccess?: () => void
}) {
  const [formValues, setFormValues] = useState(initialValues)

  useEffect(() => {
    const hasMatchingAccount = accountOptions.some(
      (option) => option.label === formValues.expenseAccount
    )

    if (hasMatchingAccount || !accountOptions.length) {
      return
    }

    setFormValues((current) => ({
      ...current,
      expenseAccount: accountOptions[0]?.label ?? "",
    }))
  }, [accountOptions, formValues.expenseAccount])

  const content = (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault()
        onSave(formValues)
        onSuccess?.()
      }}
    >
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="nickname" className="text-white/80">
            Nome de exibição
          </FieldLabel>
          <FieldContent>
            <Input
              id="nickname"
              placeholder="Cartão Black principal"
              value={formValues.nickname}
              onChange={(event) =>
                setFormValues((current) => ({ ...current, nickname: event.currentTarget.value }))
              }
              className="h-10 border-white/10 bg-white/5 text-white"
            />
          </FieldContent>
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="finalDigits" className="text-white/80">
              Final do cartão
            </FieldLabel>
            <FieldContent>
              <Input
                id="finalDigits"
                inputMode="numeric"
                maxLength={4}
                placeholder="4821"
                value={formValues.finalDigits}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    finalDigits: event.currentTarget.value.replace(/\D/g, "").slice(0, 4),
                  }))
                }
                className="h-10 border-white/10 bg-white/5 text-white"
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="limit" className="text-white/80">
              Limite aprovado
            </FieldLabel>
            <FieldContent>
              <Input
                id="limit"
                inputMode="decimal"
                placeholder="0,00"
                value={formValues.limit}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    limit: formatCurrencyDigitsToInput(event.currentTarget.value),
                  }))
                }
                className="h-10 border-white/10 bg-white/5 text-white"
              />
            </FieldContent>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="closingDay" className="text-white/80">
              Dia de fechamento
            </FieldLabel>
            <FieldContent>
              <Input
                id="closingDay"
                inputMode="numeric"
                placeholder="18"
                value={formValues.closingDay}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    closingDay: event.currentTarget.value.replace(/\D/g, "").slice(0, 2),
                  }))
                }
                className="h-10 border-white/10 bg-white/5 text-white"
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="dueDay" className="text-white/80">
              Dia de vencimento
            </FieldLabel>
            <FieldContent>
              <Input
                id="dueDay"
                inputMode="numeric"
                placeholder="25"
                value={formValues.dueDay}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    dueDay: event.currentTarget.value.replace(/\D/g, "").slice(0, 2),
                  }))
                }
                className="h-10 border-white/10 bg-white/5 text-white"
              />
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
              value={formValues.expenseAccount}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  expenseAccount: event.currentTarget.value,
                }))
              }
              className="h-10 w-full border-white/10 bg-white/5 text-sm text-white"
              disabled={!accountOptions.length}
            >
              {accountOptions.length ? null : (
                <NativeSelectOption value="">Nenhuma conta disponível</NativeSelectOption>
              )}
              {accountOptions.map((option) => (
                <NativeSelectOption key={option.id} value={option.label}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
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
