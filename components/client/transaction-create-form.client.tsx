"use client"

import { useActionState, useEffect, useEffectEvent, useState } from "react"
import { useFormStatus } from "react-dom"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import {
  createTransactionAction,
  type CreateTransactionActionState,
} from "@/modules/transactions/presentation/actions"
import type {
  FixedExpenseFrequency,
  TransactionAccountOption,
  TransactionCategoryOption,
} from "@/modules/transactions/domain/types"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const initialState: CreateTransactionActionState = {
  status: "idle",
}

const fixedExpenseFrequencyOptions: Array<{ value: FixedExpenseFrequency; label: string }> = [
  { value: "monthly", label: "Mensal" },
  { value: "fortnightly", label: "Quinzenal" },
  { value: "daily", label: "Diária" },
  { value: "weekly", label: "Semanal" },
  { value: "yearly", label: "Anual" },
]

type TransactionCadence = "single" | "fixed" | "installment"

function getDefaultFormValues(defaultOccurredOn: string, defaultAccountId: string) {
  return {
    accountId: defaultAccountId,
    title: "",
    category: "",
    kind: "expense",
    status: "compensated",
    amount: "",
    occurredOn: defaultOccurredOn,
    cadence: "single" as TransactionCadence,
    isFixed: false,
    fixedExpenseFrequency: "monthly" as FixedExpenseFrequency,
    installmentNumber: "1",
    installmentTotal: "2",
    notes: "",
  }
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

function getDateFromIsoDate(value: string) {
  return value ? new Date(`${value}T00:00:00`) : undefined
}

function formatDateForButton(value: string) {
  const date = getDateFromIsoDate(value)

  if (!date) {
    return "Selecione uma data"
  }

  return format(date, "dd/MM/yyyy", { locale: ptBR })
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
  categoryOptions,
  defaultOccurredOn,
  mode = "card",
  onSuccess,
}: {
  accountOptions: TransactionAccountOption[]
  categoryOptions: TransactionCategoryOption[]
  defaultOccurredOn: string
  mode?: "card" | "flat"
  onSuccess?: () => void
}) {
  const [state, formAction] = useActionState(createTransactionAction, initialState)
  const defaultAccountId = accountOptions[0]?.id ?? ""
  const [formValues, setFormValues] = useState(() =>
    getDefaultFormValues(defaultOccurredOn, defaultAccountId)
  )
  const forcePendingStatus = formValues.cadence === "fixed" && formValues.kind === "expense"
  const fixedLabel = formValues.kind === "income" ? "Receita fixa" : "Despesa fixa"
  const installmentLabel =
    formValues.kind === "income" ? "Receita parcelada" : "Despesa parcelada"
  const handleSuccess = useEffectEvent(() => {
    setFormValues(getDefaultFormValues(defaultOccurredOn, defaultAccountId))
    onSuccess?.()
  })

  useEffect(() => {
    if (state.status === "success") {
      handleSuccess()
    }
  }, [state.status])

  const content = (
    <form action={formAction} className="space-y-5">
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="title" className="text-white/80">
            Descrição
          </FieldLabel>
          <FieldContent>
            <Input
              id="title"
              name="title"
              placeholder="Supermercado"
              value={formValues.title}
              onChange={(event) => {
                const { value } = event.currentTarget
                setFormValues((current) => ({
                  ...current,
                  title: value,
                }))
              }}
              className="h-10 border-white/10 bg-white/5 text-white"
            />
            <FieldError errors={state.fieldErrors?.title?.map((message) => ({ message }))} />
          </FieldContent>
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="accountId" className="text-white/80">
              Conta
            </FieldLabel>
            <FieldContent>
              <NativeSelect
                id="accountId"
                name="accountId"
                value={formValues.accountId}
                onChange={(event) => {
                  const { value } = event.currentTarget
                  setFormValues((current) => ({
                    ...current,
                    accountId: value,
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
              <FieldError errors={state.fieldErrors?.accountId?.map((message) => ({ message }))} />
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
                list="transaction-category-options"
                placeholder="Alimentação"
                value={formValues.category}
                onChange={(event) => {
                  const { value } = event.currentTarget
                  setFormValues((current) => ({
                    ...current,
                    category: value,
                  }))
                }}
                className="h-10 border-white/10 bg-white/5 text-white"
              />
              <datalist id="transaction-category-options">
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value} />
                ))}
              </datalist>
              <FieldError errors={state.fieldErrors?.category?.map((message) => ({ message }))} />
            </FieldContent>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="kind" className="text-white/80">
              Tipo
            </FieldLabel>
            <FieldContent>
              <NativeSelect
                id="kind"
                name="kind"
                value={formValues.kind}
                onChange={(event) => {
                  const { value } = event.currentTarget
                  setFormValues((current) => ({
                    ...current,
                    kind: value,
                    status:
                      value === "expense" && current.cadence === "fixed" ? "pending" : current.status,
                  }))
                }}
                className="h-10 w-full border-white/10 bg-white/5 text-sm text-white"
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
              {forcePendingStatus ? (
                <input type="hidden" name="status" value="pending" />
              ) : null}
              <NativeSelect
                id="status"
                name={forcePendingStatus ? undefined : "status"}
                value={formValues.status}
                onChange={(event) => {
                  const { value } = event.currentTarget
                  setFormValues((current) => ({
                    ...current,
                    status: value,
                  }))
                }}
                className="h-10 border-white/10 bg-white/5 text-sm text-white"
                disabled={forcePendingStatus}
              >
                <NativeSelectOption value="compensated">Compensado</NativeSelectOption>
                <NativeSelectOption value="pending">Pendente</NativeSelectOption>
                <NativeSelectOption value="scheduled">Agendado</NativeSelectOption>
              </NativeSelect>
              <FieldError errors={state.fieldErrors?.status?.map((message) => ({ message }))} />
              {forcePendingStatus ? (
                <p className="text-xs text-white/55">
                  Despesas fixas sao criadas como pendentes em todos os meses.
                </p>
              ) : null}
            </FieldContent>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_max-content]">
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
                value={formValues.amount}
                onChange={(event) => {
                  const formattedValue = formatCurrencyDigitsToInput(event.currentTarget.value)
                  setFormValues((current) => ({
                    ...current,
                    amount: formattedValue,
                  }))
                }}
                className="h-10 border-white/10 bg-white/5 text-white"
              />
              <FieldError errors={state.fieldErrors?.amount?.map((message) => ({ message }))} />
            </FieldContent>
          </Field>

          <Field className="md:w-fit">
            <FieldLabel htmlFor="occurredOn" className="text-white/80">
              Data
            </FieldLabel>
            <FieldContent className="md:w-fit">
              <input
                name="occurredOn"
                value={formValues.occurredOn}
                type="hidden"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="occurredOn"
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-10 w-full justify-between border-white/10 bg-white/5 px-3 text-left text-sm text-white hover:bg-white/10 hover:text-white md:w-auto md:min-w-0",
                      !formValues.occurredOn && "text-white/55"
                    )}
                  >
                    <span>{formatDateForButton(formValues.occurredOn)}</span>
                    <CalendarIcon className="size-4 text-white/70" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-auto border border-white/10 bg-[#141414] p-2 text-white"
                >
                  <Calendar
                    mode="single"
                    locale={ptBR}
                    selected={getDateFromIsoDate(formValues.occurredOn)}
                    onSelect={(date) => {
                      if (!date) {
                        return
                      }

                      setFormValues((current) => ({
                        ...current,
                        occurredOn: format(date, "yyyy-MM-dd"),
                      }))
                    }}
                  />
                </PopoverContent>
              </Popover>
              <FieldError
                errors={state.fieldErrors?.occurredOn?.map((message) => ({ message }))}
              />
            </FieldContent>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="cadence" className="text-white/80">
            Modelo
          </FieldLabel>
          <FieldContent className="gap-3">
            <input type="hidden" name="isFixed" value={formValues.cadence === "fixed" ? "true" : "false"} />
            <NativeSelect
              id="cadence"
              value={formValues.cadence}
              onChange={(event) => {
                const { value } = event.currentTarget
                const cadence = value as TransactionCadence

                setFormValues((current) => ({
                  ...current,
                  cadence,
                  isFixed: cadence === "fixed",
                  status:
                    cadence === "fixed" && current.kind === "expense" ? "pending" : current.status,
                  fixedExpenseFrequency:
                    cadence === "fixed" ? current.fixedExpenseFrequency : "monthly",
                  installmentNumber: cadence === "installment" ? current.installmentNumber : "1",
                  installmentTotal: cadence === "installment" ? current.installmentTotal : "2",
                }))
              }}
              className="h-10 w-full border-white/10 bg-white/5 text-sm text-white"
            >
              <NativeSelectOption value="single">Lançamento avulso</NativeSelectOption>
              <NativeSelectOption value="fixed">{fixedLabel}</NativeSelectOption>
              <NativeSelectOption value="installment">{installmentLabel}</NativeSelectOption>
            </NativeSelect>

            {formValues.cadence === "fixed" ? (
              <Field className="w-full">
                <FieldLabel htmlFor="fixedExpenseFrequency" className="text-white/80">
                  Recorrência
                </FieldLabel>
                <FieldContent className="w-full">
                  <NativeSelect
                    id="fixedExpenseFrequency"
                    name="fixedExpenseFrequency"
                    value={formValues.fixedExpenseFrequency}
                    onChange={(event) => {
                      const { value } = event.currentTarget
                      setFormValues((current) => ({
                        ...current,
                        fixedExpenseFrequency: value as FixedExpenseFrequency,
                      }))
                    }}
                    className="h-10 w-full border-white/10 bg-white/5 text-sm text-white"
                  >
                    {fixedExpenseFrequencyOptions.map((option) => (
                      <NativeSelectOption key={option.value} value={option.value}>
                        {option.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <FieldError
                    errors={state.fieldErrors?.fixedExpenseFrequency?.map((message) => ({
                      message,
                    }))}
                  />
                </FieldContent>
              </Field>
            ) : (
              <input type="hidden" name="fixedExpenseFrequency" value="" />
            )}

            {formValues.cadence === "installment" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="installmentNumber" className="text-white/80">
                    Parcela inicial
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="installmentNumber"
                      name="installmentNumber"
                      inputMode="numeric"
                      min={1}
                      value={formValues.installmentNumber}
                      onChange={(event) => {
                        const digits = event.currentTarget.value.replace(/\D/g, "")
                        setFormValues((current) => ({
                          ...current,
                          installmentNumber: digits || "",
                        }))
                      }}
                      className="h-10 border-white/10 bg-white/5 text-white"
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="installmentTotal" className="text-white/80">
                    Total de parcelas
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="installmentTotal"
                      name="installmentTotal"
                      inputMode="numeric"
                      min={1}
                      value={formValues.installmentTotal}
                      onChange={(event) => {
                        const digits = event.currentTarget.value.replace(/\D/g, "")
                        setFormValues((current) => ({
                          ...current,
                          installmentTotal: digits || "",
                        }))
                      }}
                      className="h-10 border-white/10 bg-white/5 text-white"
                    />
                  </FieldContent>
                </Field>
              </div>
            ) : (
              <>
                <input type="hidden" name="installmentNumber" value="" />
                <input type="hidden" name="installmentTotal" value="" />
              </>
            )}

            <p className="text-xs text-white/55">
              {formValues.cadence === "installment"
                ? "O sistema cria as parcelas restantes nos meses seguintes, mantendo o dia de vencimento escolhido."
                : formValues.cadence === "fixed"
                  ? "A lógica de recorrência fixa do sistema é aplicada automaticamente."
                  : "Use lançamento avulso para registrar apenas esta ocorrência."}
            </p>

            <FieldError errors={state.fieldErrors?.isFixed?.map((message) => ({ message }))} />
            <FieldError errors={state.fieldErrors?.installmentNumber?.map((message) => ({ message }))} />
            <FieldError errors={state.fieldErrors?.installmentTotal?.map((message) => ({ message }))} />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="notes" className="text-white/80">
            Observações
          </FieldLabel>
          <FieldContent>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Opcional"
              value={formValues.notes}
              onChange={(event) => {
                const { value } = event.currentTarget
                setFormValues((current) => ({
                  ...current,
                  notes: value,
                }))
              }}
              className="min-h-20 border-white/10 bg-white/5 text-white"
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
