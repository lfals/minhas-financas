"use client"

import { startTransition, useActionState, useEffect, useEffectEvent, useRef, useState } from "react"
import { useRouter } from "next/navigation"
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
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { MonthPicker } from "@/components/ui/month-picker"
import {
  createTransactionAction,
  type CreateTransactionActionState,
  updateTransactionAction,
  type UpdateTransactionActionState,
} from "@/modules/transactions/presentation/actions"
import type {
  FixedExpenseFrequency,
  InstallmentAmountInputMode,
  TransactionAccountOption,
  TransactionCategoryOption,
  TransactionCreditCardOption,
  TransactionFormKind,
  TransactionTitleSuggestion,
} from "@/modules/transactions/domain/types"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const initialState: CreateTransactionActionState | UpdateTransactionActionState = {
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

export type TransactionFormValues = {
  transactionId?: string
  accountId: string
  cardId: string
  title: string
  category: string
  kind: TransactionFormKind | "expense" | "income"
  status: "compensated" | "pending" | "scheduled"
  amount: string
  occurredOn: string
  cadence: TransactionCadence
  isFixed: boolean
  fixedExpenseFrequency: FixedExpenseFrequency
  installmentNumber: string
  installmentTotal: string
  installmentAmountInputMode: InstallmentAmountInputMode
  targetInvoiceMonth: string
}

export function getDefaultTransactionFormValues(
  defaultOccurredOn: string,
  defaultAccountId: string
): TransactionFormValues {
  return {
    accountId: defaultAccountId,
    cardId: "",
    title: "",
    category: "",
    kind: "expense" as TransactionFormKind,
    status: "compensated",
    amount: "",
    occurredOn: defaultOccurredOn,
    cadence: "single" as TransactionCadence,
    isFixed: false,
    fixedExpenseFrequency: "monthly" as FixedExpenseFrequency,
    installmentNumber: "1",
    installmentTotal: "2",
    installmentAmountInputMode: "installment" as InstallmentAmountInputMode,
    targetInvoiceMonth: "",
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

function parseCurrencyInputToCents(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return 0
  }

  const normalized = trimmed
    .replace(/\s/g, "")
    .replace(/R\$/gi, "")
    .replace(/\./g, "")
    .replace(",", ".")

  const parsed = Number(normalized)

  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0
}

function formatCentsToCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100)
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

function formatInvoiceMonthLabel(isoMonth: string) {
  if (!isoMonth) {
    return "Selecione a fatura"
  }
  return format(new Date(`${isoMonth}-01T00:00:00`), "MMMM yyyy", { locale: ptBR })
}

function SubmitButton({ disabled, label }: { disabled?: boolean; label: string }) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      className="h-10 border border-[#d8f36a] bg-[#d8f36a] px-4 text-[11px] uppercase tracking-[0.25em] text-black hover:bg-[#c9e45f]"
      disabled={pending || disabled}
    >
      {pending ? "Salvando..." : label}
    </Button>
  )
}

export function TransactionCreateForm({
  accountOptions,
  creditCardOptions,
  categoryOptions,
  titleSuggestions,
  defaultOccurredOn,
  initialValues,
  mode = "card",
  actionType = "create",
  onSuccess,
  submitLabel = "Criar lançamento",
}: {
  accountOptions: TransactionAccountOption[]
  creditCardOptions: TransactionCreditCardOption[]
  categoryOptions: TransactionCategoryOption[]
  titleSuggestions: TransactionTitleSuggestion[]
  defaultOccurredOn: string
  initialValues?: TransactionFormValues
  mode?: "card" | "flat"
  actionType?: "create" | "update"
  onSuccess?: () => void
  submitLabel?: string
}) {
  const [state, formAction] = useActionState(
    actionType === "update" ? updateTransactionAction : createTransactionAction,
    initialState
  )
  const [keepOpen, setKeepOpen] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const defaultAccountId = accountOptions[0]?.id ?? ""
  const defaultCardId = creditCardOptions[0]?.id ?? ""
  const router = useRouter()
  const [formValues, setFormValues] = useState<TransactionFormValues>(() => {
    if (initialValues) {
      return initialValues
    }

    const currentIsoMonth = format(new Date(), "yyyy-MM")
    return {
      ...getDefaultTransactionFormValues(defaultOccurredOn, defaultAccountId),
      cardId: defaultCardId,
      targetInvoiceMonth: defaultCardId ? currentIsoMonth : "",
    }
  })
  const allowCardExpense = actionType === "create"
  const isCardExpense = allowCardExpense && formValues.kind === "card-expense"
  const forcePendingStatus =
    isCardExpense || (formValues.cadence === "fixed" && formValues.kind === "expense")
  const fixedLabel = formValues.kind === "income" ? "Receita fixa" : "Despesa fixa"
  const installmentLabel = formValues.kind === "income" ? "Receita parcelada" : "Despesa parcelada"
  const installmentTotalCount = Number(formValues.installmentTotal)
  const installmentPreviewCents =
    formValues.cadence === "installment" &&
    formValues.installmentAmountInputMode === "total" &&
    installmentTotalCount > 0
      ? Math.floor(parseCurrencyInputToCents(formValues.amount) / installmentTotalCount)
      : null

  const currentIsoMonth = format(new Date(), "yyyy-MM")
  const handleSuccess = useEffectEvent(() => {
    if (keepOpen) {
      // Keep kind, accountId, cardId, and status — only clear text/value fields
      setFormValues((current) => ({
        ...getDefaultTransactionFormValues(defaultOccurredOn, defaultAccountId),
        kind: current.kind,
        accountId: current.accountId,
        cardId: current.cardId,
        status: current.status,
        targetInvoiceMonth: current.targetInvoiceMonth,
        occurredOn: current.occurredOn,
      }))
      setShowSuccessMessage(true)
      titleInputRef.current?.focus()
    } else {
      setFormValues(
        actionType === "update"
          ? (initialValues ?? {
              ...getDefaultTransactionFormValues(defaultOccurredOn, defaultAccountId),
              cardId: defaultCardId,
            })
          : {
              ...getDefaultTransactionFormValues(defaultOccurredOn, defaultAccountId),
              cardId: defaultCardId,
            }
      )
      onSuccess?.()
    }

    startTransition(() => {
      router.refresh()
    })
  })

  useEffect(() => {
    if (initialValues) {
      setFormValues(initialValues)
      return
    }

    setFormValues({
      ...getDefaultTransactionFormValues(defaultOccurredOn, defaultAccountId),
      cardId: defaultCardId,
    })
  }, [defaultAccountId, defaultCardId, defaultOccurredOn, initialValues])

  useEffect(() => {
    if (state.status === "success") {
      handleSuccess()
    }
  }, [state])

  const content = (
    <form action={formAction} className="space-y-5" onFocus={() => setShowSuccessMessage(false)}>
      {actionType === "update" && formValues.transactionId ? (
        <input type="hidden" name="transactionId" value={formValues.transactionId} />
      ) : null}
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="title" className="text-white/80">
            Descrição
          </FieldLabel>
          <FieldContent>
            <Input
              ref={titleInputRef}
              id="title"
              name="title"
              list="transaction-title-options"
              placeholder="Supermercado"
              value={formValues.title}
              onChange={(event) => {
                const { value } = event.currentTarget
                setFormValues((current) => {
                  const newState = {
                    ...current,
                    title: value,
                  }

                  // Auto-fill category if title matches a suggestion
                  const matchingSuggestion = titleSuggestions.find(
                    (s) => s.title.toLocaleLowerCase("pt-BR") === value.trim().toLocaleLowerCase("pt-BR")
                  )

                  if (matchingSuggestion) {
                    newState.category = matchingSuggestion.category
                  }

                  return newState
                })
              }}
              className="h-10 border-white/10 bg-white/5 text-white"
            />
            <datalist id="transaction-title-options">
              {titleSuggestions.map((suggestion) => (
                <option key={suggestion.title} value={suggestion.title} />
              ))}
            </datalist>
            <FieldError errors={state.fieldErrors?.title?.map((message) => ({ message }))} />
          </FieldContent>
        </Field>

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
                    kind: value as TransactionFormKind,
                    cardId: value === "card-expense" ? current.cardId || defaultCardId : "",
                    status:
                      value === "card-expense"
                        ? "pending"
                        : value === "expense" && current.cadence === "fixed"
                          ? "pending"
                          : current.status,
                    fixedExpenseFrequency:
                      value === "card-expense" && current.cadence === "fixed"
                        ? "monthly"
                        : current.fixedExpenseFrequency,
                    installmentNumber: value === "card-expense" ? "1" : current.installmentNumber,
                    installmentTotal: value === "card-expense" ? "2" : current.installmentTotal,
                    installmentAmountInputMode:
                      value === "card-expense" ? "installment" : current.installmentAmountInputMode,
                    targetInvoiceMonth:
                      value === "card-expense" && !current.targetInvoiceMonth
                        ? format(new Date(), "yyyy-MM")
                        : current.targetInvoiceMonth,
                  }))
                }}
                className="h-10 w-full border-white/10 bg-white/5 text-sm text-white"
              >
                <NativeSelectOption value="expense">Despesa</NativeSelectOption>
                {allowCardExpense ? (
                  <NativeSelectOption value="card-expense">Despesa cartão</NativeSelectOption>
                ) : null}
                <NativeSelectOption value="income">Receita</NativeSelectOption>
              </NativeSelect>
              <FieldError errors={state.fieldErrors?.kind?.map((message) => ({ message }))} />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor={isCardExpense ? "cardId" : "accountId"} className="text-white/80">
              {isCardExpense ? "Cartão" : "Conta"}
            </FieldLabel>
            <FieldContent>
              {isCardExpense ? (
                <>
                  <NativeSelect
                    id="cardId"
                    name="cardId"
                    value={formValues.cardId}
                    onChange={(event) => {
                      const { value } = event.currentTarget
                      setFormValues((current) => ({
                        ...current,
                        cardId: value,
                      }))
                    }}
                    className="h-10 w-full border-white/10 bg-white/5 text-sm text-white"
                    disabled={!creditCardOptions.length}
                  >
                    {creditCardOptions.length ? null : (
                      <NativeSelectOption value="">Nenhum cartão disponível</NativeSelectOption>
                    )}
                    {creditCardOptions.map((option) => (
                      <NativeSelectOption key={option.id} value={option.id}>
                        {option.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <input type="hidden" name="accountId" value="" />
                  <FieldError errors={state.fieldErrors?.cardId?.map((message) => ({ message }))} />
                </>
              ) : (
                <>
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
                  <input type="hidden" name="cardId" value="" />
                  <FieldError errors={state.fieldErrors?.accountId?.map((message) => ({ message }))} />
                </>
              )}
            </FieldContent>
          </Field>

        </div>

        <div className="grid gap-4 md:grid-cols-2">
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

          {isCardExpense ? (
            <input type="hidden" name="status" value="pending" />
          ) : (
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
                      status: value as TransactionFormValues["status"],
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
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_max-content]">
          <Field>
            <FieldLabel htmlFor="amount" className="text-white/80">
              {formValues.cadence === "installment" &&
              formValues.installmentAmountInputMode === "total"
                ? "Valor total"
                : "Valor"}
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
              {installmentPreviewCents !== null ? (
                <p className="mt-2 text-xs text-white/55">
                  Cada parcela ficará em torno de {formatCentsToCurrency(installmentPreviewCents)}.
                </p>
              ) : null}
              <FieldError errors={state.fieldErrors?.amount?.map((message) => ({ message }))} />
            </FieldContent>
          </Field>

          {isCardExpense ? (
            <Field className="md:w-full">
              <FieldLabel htmlFor="targetInvoiceMonth" className="text-white/80">
                Fatura
              </FieldLabel>
              <FieldContent>
                <input type="hidden" name="targetInvoiceMonth" value={formValues.targetInvoiceMonth} />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="targetInvoiceMonth"
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-10 w-full justify-between border-white/10 bg-white/5 px-3 text-left text-sm text-white hover:bg-white/10 hover:text-white md:min-w-0",
                        !formValues.targetInvoiceMonth && "text-white/55"
                      )}
                    >
                      <span className="capitalize">
                        {formatInvoiceMonthLabel(formValues.targetInvoiceMonth)}
                      </span>
                      <CalendarIcon className="size-4 text-white/70" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-auto border border-white/10 bg-[#141414] p-0 text-white"
                  >
                    <MonthPicker
                      value={formValues.targetInvoiceMonth}
                      onChange={(month) => {
                        setFormValues((current) => ({
                          ...current,
                          targetInvoiceMonth: month,
                        }))
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <FieldError
                  errors={state.fieldErrors?.targetInvoiceMonth?.map((message) => ({
                    message,
                  }))}
                />
              </FieldContent>
              <input type="hidden" name="occurredOn" value={formValues.occurredOn} />
            </Field>
          ) : (
            <Field className="md:w-fit">
              <FieldLabel htmlFor="occurredOn" className="text-white/80">
                Data
              </FieldLabel>
              <FieldContent className="md:w-fit">
                <input name="occurredOn" value={formValues.occurredOn} type="hidden" />
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
                  errors={state.fieldErrors?.occurredOn?.map((message) => ({
                    message,
                  }))}
                />
              </FieldContent>
            </Field>
          )}
        </div>

        {actionType === "create" ? (
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
                    installmentAmountInputMode:
                      cadence === "installment" ? current.installmentAmountInputMode : "installment",
                  }))
                }}
                className="h-10 w-full border-white/10 bg-white/5 text-sm text-white"
              >
                <NativeSelectOption value="single">Lançamento avulso</NativeSelectOption>
                <NativeSelectOption value="fixed">{fixedLabel}</NativeSelectOption>
                <NativeSelectOption value="installment">{installmentLabel}</NativeSelectOption>
              </NativeSelect>

              {formValues.cadence === "fixed" ? (
                isCardExpense ? (
                  <input type="hidden" name="fixedExpenseFrequency" value="monthly" />
                ) : (
                  <Field className="w-full">
                    <>
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
                    </>
                  </Field>
                )
              ) : (
                <input type="hidden" name="fixedExpenseFrequency" value="" />
              )}

              {formValues.cadence === "installment" ? (
                <div className="space-y-4">
                  <Field>
                    <FieldLabel htmlFor="installmentAmountInputMode" className="text-white/80">
                      O valor informado corresponde a
                    </FieldLabel>
                    <FieldContent>
                      <NativeSelect
                        id="installmentAmountInputMode"
                        name="installmentAmountInputMode"
                        value={formValues.installmentAmountInputMode}
                        onChange={(event) => {
                          const { value } = event.currentTarget
                          setFormValues((current) => ({
                            ...current,
                            installmentAmountInputMode: value as InstallmentAmountInputMode,
                          }))
                        }}
                        className="h-10 w-full border-white/10 bg-white/5 text-sm text-white"
                      >
                        <NativeSelectOption value="installment">
                          {isCardExpense ? "Valor de cada parcela" : "Valor da parcela"}
                        </NativeSelectOption>
                        <NativeSelectOption value="total">Valor total</NativeSelectOption>
                      </NativeSelect>
                    </FieldContent>
                  </Field>

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
                </div>
              ) : (
                <>
                  <input type="hidden" name="installmentNumber" value="" />
                  <input type="hidden" name="installmentTotal" value="" />
                  <input type="hidden" name="installmentAmountInputMode" value="installment" />
                </>
              )}

              <p className="text-xs text-white/55">
                {isCardExpense
                  ? formValues.cadence === "installment"
                    ? formValues.installmentAmountInputMode === "total"
                      ? "O sistema divide o valor total entre as parcelas e lança cada uma na fatura correspondente dos próximos meses."
                      : "O sistema mantém o valor informado em cada parcela e lança cada uma na fatura correspondente dos próximos meses."
                    : "A compra é registrada no cartão e consolidada automaticamente na fatura do mês de vencimento."
                  : formValues.cadence === "installment"
                  ? formValues.installmentAmountInputMode === "total"
                    ? "O sistema divide o valor total entre as parcelas e cria as restantes nos meses seguintes, mantendo o dia de vencimento escolhido."
                    : "O sistema mantém o valor informado em cada parcela e cria as restantes nos meses seguintes, mantendo o dia de vencimento escolhido."
                  : formValues.cadence === "fixed"
                    ? isCardExpense
                      ? "O sistema agenda uma compra mensal no cartão e só envia cada competência para a fatura quando você efetivar."
                      : "A lógica de recorrência fixa do sistema é aplicada automaticamente."
                    : "Use lançamento avulso para registrar apenas esta ocorrência."}
              </p>

              <FieldError errors={state.fieldErrors?.isFixed?.map((message) => ({ message }))} />
              <FieldError errors={state.fieldErrors?.installmentNumber?.map((message) => ({ message }))} />
              <FieldError errors={state.fieldErrors?.installmentTotal?.map((message) => ({ message }))} />
              <FieldError
                errors={state.fieldErrors?.installmentAmountInputMode?.map((message) => ({
                  message,
                }))}
              />
            </FieldContent>
          </Field>
        ) : (
          <>
            <input type="hidden" name="isFixed" value={formValues.isFixed ? "true" : "false"} />
            <input
              type="hidden"
              name="fixedExpenseFrequency"
              value={formValues.isFixed ? formValues.fixedExpenseFrequency : ""}
            />
            <input
              type="hidden"
              name="installmentNumber"
              value={formValues.cadence === "installment" ? formValues.installmentNumber : ""}
            />
            <input
              type="hidden"
              name="installmentTotal"
              value={formValues.cadence === "installment" ? formValues.installmentTotal : ""}
            />
            <input
              type="hidden"
              name="installmentAmountInputMode"
              value={formValues.cadence === "installment" ? formValues.installmentAmountInputMode : "installment"}
            />
            {formValues.cadence !== "single" ? (
              <div className="border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                {formValues.cadence === "fixed"
                  ? `Modelo atual: ${
                      formValues.kind === "income" ? "receita fixa" : "despesa fixa"
                    } ${fixedExpenseFrequencyOptions.find(
                      (option) => option.value === formValues.fixedExpenseFrequency
                    )?.label.toLowerCase()}.`
                  : `Modelo atual: parcelado em ${formValues.installmentNumber}/${formValues.installmentTotal}.`}
              </div>
            ) : null}
          </>
        )}


      </FieldGroup>

      {!accountOptions.length && !isCardExpense ? (
        <p className="text-sm text-[#ff9c7a]">
          Cadastre uma conta antes de adicionar o primeiro lançamento.
        </p>
      ) : null}

      {!creditCardOptions.length && isCardExpense ? (
        <p className="text-sm text-[#ff9c7a]">
          Cadastre um cartão antes de registrar compras na fatura.
        </p>
      ) : null}

      {state.message && (state.status !== "success" || showSuccessMessage) ? (
        <p
          className={
            state.status === "success" ? "text-sm text-[#d8f36a]" : "text-sm text-[#ff9c7a]"
          }
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        {actionType === "create" ? (
          <div className="flex items-center gap-2">
            <Switch
              id="keep-open"
              checked={keepOpen}
              onCheckedChange={setKeepOpen}
              size="sm"
              className="data-checked:bg-[#d8f36a]"
            />
            <Label htmlFor="keep-open" className="cursor-pointer text-[10px] uppercase tracking-wider text-white/60">
              Salvar e continuar
            </Label>
          </div>
        ) : <div />}

        <SubmitButton
          disabled={isCardExpense ? !creditCardOptions.length : !accountOptions.length}
          label={submitLabel}
        />
      </div>
    </form>
  )

  if (mode === "flat") {
    return content
  }

  return (
    <Card className="border border-white/10 bg-[#141414] ring-0">
      <CardHeader className="gap-3">
        <CardDescription className="text-[11px] uppercase tracking-[0.35em] text-white/55">
          {actionType === "update" ? "Editar lançamento" : "Novo lançamento"}
        </CardDescription>
        <CardTitle className="text-3xl font-semibold uppercase tracking-[-0.07em] text-white">
          {actionType === "update" ? "Atualize os dados deste lançamento." : "Registre uma entrada ou saída."}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{content}</CardContent>
    </Card>
  )
}
