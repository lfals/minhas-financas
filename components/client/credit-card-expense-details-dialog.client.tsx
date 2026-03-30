"use client"

import { startTransition, useActionState, useEffect, useEffectEvent, useState, type KeyboardEvent, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { CalendarIcon } from "lucide-react"

import { ClickPropagationStopper } from "@/components/client/click-propagation-stopper.client"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  updateCreditCardExpenseAction,
  type UpdateCreditCardExpenseActionState,
} from "@/modules/transactions/presentation/actions"
import type {
  CreditCardInvoiceExpensePageItem,
  TransactionCategoryOption,
} from "@/modules/transactions/domain/types"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const initialState: UpdateCreditCardExpenseActionState = {
  status: "idle",
}

type CreditCardExpenseFormValues = {
  expenseId: string
  title: string
  category: string
  amount: string
  occurredOn: string
  targetInvoiceMonth: string
  notes: string
}

function formatCentsToInput(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100)
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

function getBaseTitle(expense: CreditCardInvoiceExpensePageItem) {
  if (!expense.installmentNumber || !expense.installmentTotal) {
    return expense.title
  }

  return expense.title.replace(/ \d+\/\d+$/, "")
}

function buildInitialValues(expense: CreditCardInvoiceExpensePageItem): CreditCardExpenseFormValues {
  return {
    expenseId: expense.id,
    title: getBaseTitle(expense),
    category: expense.category,
    amount: formatCentsToInput(Math.abs(expense.amountCents)),
    occurredOn: expense.occurredOn,
    targetInvoiceMonth: expense.invoiceMonth,
    notes: expense.notes ?? "",
  }
}

function addMonthsToIsoMonth(isoMonth: string, monthOffset: number) {
  const [year, month] = isoMonth.split("-").map(Number)
  const targetMonthIndex = month - 1 + monthOffset
  const targetYear = year + Math.floor(targetMonthIndex / 12)
  const normalizedMonthIndex = ((targetMonthIndex % 12) + 12) % 12

  return `${targetYear}-${String(normalizedMonthIndex + 1).padStart(2, "0")}`
}

function formatInvoiceMonthLabel(isoMonth: string) {
  return format(new Date(`${isoMonth}-01T00:00:00`), "MMMM yyyy", { locale: ptBR })
}

function buildInvoiceMonthOptions(expense: CreditCardInvoiceExpensePageItem) {
  const baseMonth = expense.invoiceMonth
  const months = new Set<string>()

  for (let offset = -6; offset <= 12; offset += 1) {
    months.add(addMonthsToIsoMonth(baseMonth, offset))
  }

  months.add(expense.occurredOn.slice(0, 7))

  return [...months]
    .sort((left, right) => left.localeCompare(right))
    .map((value) => ({
      value,
      label: formatInvoiceMonthLabel(value),
    }))
}

function SubmitButton() {
  return (
    <Button
      type="submit"
      className="h-10 border border-[#d8f36a] bg-[#d8f36a] px-4 text-[11px] uppercase tracking-[0.25em] text-black hover:bg-[#c9e45f]"
    >
      Salvar alterações
    </Button>
  )
}

export function CreditCardExpenseDetailsDialog({
  expense,
  categoryOptions,
  children,
}: {
  expense: CreditCardInvoiceExpensePageItem
  categoryOptions: TransactionCategoryOption[]
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [state, formAction] = useActionState(updateCreditCardExpenseAction, initialState)
  const [formValues, setFormValues] = useState(() => buildInitialValues(expense))
  const router = useRouter()
  const invoiceMonthOptions = buildInvoiceMonthOptions(expense)

  const handleSuccess = useEffectEvent(() => {
    setFormValues(buildInitialValues(expense))
    setOpen(false)
    startTransition(() => {
      router.refresh()
    })
  })

  useEffect(() => {
    setFormValues(buildInitialValues(expense))
  }, [expense])

  useEffect(() => {
    if (state.status === "success") {
      handleSuccess()
    }
  }, [state.status])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") {
      return
    }

    event.preventDefault()
    setOpen(true)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setFormValues(buildInitialValues(expense))
        }
      }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#d8f36a]/60 focus-visible:ring-offset-0"
      >
        {children}
      </div>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] max-w-2xl flex-col overflow-hidden border border-white/10 bg-[#141414] p-0 text-white ring-0">
        <DialogHeader className="shrink-0 border-b border-white/10 px-6 py-5">
          <DialogTitle className="text-3xl font-semibold uppercase tracking-[-0.07em] text-white">
            Detalhes do lançamento
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto px-6 py-5">
          <form action={formAction} className="space-y-5">
            <input type="hidden" name="expenseId" value={formValues.expenseId} />

            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="expense-title" className="text-white/80">
                  Descrição
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="expense-title"
                    name="title"
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
                  <FieldLabel htmlFor="expense-category" className="text-white/80">
                    Categoria
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="expense-category"
                      name="category"
                      list="credit-card-expense-category-options"
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
                    <datalist id="credit-card-expense-category-options">
                      {categoryOptions.map((option) => (
                        <option key={option.value} value={option.value} />
                      ))}
                    </datalist>
                    <FieldError errors={state.fieldErrors?.category?.map((message) => ({ message }))} />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="expense-amount" className="text-white/80">
                    Valor
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="expense-amount"
                      name="amount"
                      inputMode="decimal"
                      value={formValues.amount}
                      onChange={(event) => {
                        const { value } = event.currentTarget
                        setFormValues((current) => ({
                          ...current,
                          amount: formatCurrencyDigitsToInput(value),
                        }))
                      }}
                      className="h-10 border-white/10 bg-white/5 text-white"
                    />
                    <FieldError errors={state.fieldErrors?.amount?.map((message) => ({ message }))} />
                  </FieldContent>
                </Field>
              </div>

              <Field className="md:w-fit">
                <FieldLabel htmlFor="expense-occurred-on" className="text-white/80">
                  Data
                </FieldLabel>
                <FieldContent className="md:w-fit">
                  <input name="occurredOn" value={formValues.occurredOn} type="hidden" />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="expense-occurred-on"
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

              <Field>
                <FieldLabel htmlFor="expense-invoice-month" className="text-white/80">
                  Fatura
                </FieldLabel>
                <FieldContent>
                  <NativeSelect
                    id="expense-invoice-month"
                    name="targetInvoiceMonth"
                    value={formValues.targetInvoiceMonth}
                    onChange={(event) => {
                      const { value } = event.currentTarget
                      setFormValues((current) => ({
                        ...current,
                        targetInvoiceMonth: value,
                      }))
                    }}
                    className="h-10 w-full border-white/10 bg-white/5 text-sm text-white"
                  >
                    {invoiceMonthOptions.map((option) => (
                      <NativeSelectOption key={option.value} value={option.value}>
                        {option.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <FieldError
                    errors={state.fieldErrors?.targetInvoiceMonth?.map((message) => ({ message }))}
                  />
                  <p className="text-xs text-white/55">
                    Move a despesa para outra fatura do mesmo cartão.
                  </p>
                </FieldContent>
              </Field>

              {(expense.installmentNumber || expense.installmentTotal) && (
                <div className="border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                  Compra parcelada em {expense.installmentNumber}/{expense.installmentTotal}.
                </div>
              )}

              <Field>
                <FieldLabel htmlFor="expense-notes" className="text-white/80">
                  Observações
                </FieldLabel>
                <FieldContent>
                  <Textarea
                    id="expense-notes"
                    name="notes"
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

            {state.message ? (
              <p
                className={
                  state.status === "success" ? "text-sm text-[#d8f36a]" : "text-sm text-[#ff9c7a]"
                }
              >
                {state.message}
              </p>
            ) : null}

            <ClickPropagationStopper>
              <SubmitButton />
            </ClickPropagationStopper>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
