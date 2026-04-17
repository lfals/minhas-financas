"use client"

import { useState, useTransition } from "react"
import { Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { configureSalaryAction } from "@/modules/salaries/presentation/actions"
import type { SalaryConfig, SalaryDeduction } from "@/modules/salaries/domain/types"

interface AccountOption {
  id: string
  name: string
}

interface SalaryConfigFormProps {
  initialConfig: SalaryConfig | null
  accounts: AccountOption[]
  onSuccess?: () => void
}

function formatCurrencyDigitsToInput(value: string) {
  const digits = value.replace(/\D/g, "")
  if (!digits) return ""

  const cents = Number(digits)
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

function parseCurrencyInputToCents(value: string) {
  const digits = value.replace(/\D/g, "")
  return Number(digits)
}

export function SalaryConfigForm({ initialConfig, accounts, onSuccess }: SalaryConfigFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [grossSalary, setGrossSalary] = useState(
    initialConfig ? formatCurrencyDigitsToInput(String(initialConfig.amountCents)) : ""
  )
  const [dayOfMonth, setDayOfMonth] = useState(initialConfig?.dayOfMonth || 1)
  const [accountId, setAccountId] = useState(initialConfig?.accountId || (accounts[0]?.id || ""))
  const [deductions, setDeductions] = useState<Omit<SalaryDeduction, "id">[]>(
    initialConfig?.deductions.map(d => ({ description: d.description, amountCents: d.amountCents })) || []
  )

  const addDeduction = () => {
    setDeductions([...deductions, { description: "", amountCents: 0 }])
  }

  const removeDeduction = (index: number) => {
    setDeductions(deductions.filter((_, i) => i !== index))
  }

  const updateDeduction = (index: number, field: "description" | "amountCents", value: any) => {
    const newDeductions = [...deductions]
    newDeductions[index] = { ...newDeductions[index], [field]: value }
    setDeductions(newDeductions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!grossSalary) {
      setError("Salário bruto é obrigatório")
      return
    }

    if (!accountId) {
      setError("Selecione uma conta para o depósito")
      return
    }

    startTransition(async () => {
      try {
        const filteredDeductions = deductions.filter(d => d.description.trim() !== "" || d.amountCents > 0)
        
        await configureSalaryAction({
          amountCents: parseCurrencyInputToCents(grossSalary),
          dayOfMonth,
          accountId,
          deductions: filteredDeductions,
        })
        onSuccess?.()
        router.refresh()
      } catch (err: any) {
        setError(err.message || "Erro ao salvar configuração")
      }
    })
  }

  const netSalaryCents = parseCurrencyInputToCents(grossSalary) - deductions.reduce((acc, d) => acc + d.amountCents, 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FieldGroup className="gap-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="grossSalary" className="text-white/80">
              Salário Bruto
            </FieldLabel>
            <FieldContent>
              <Input
                id="grossSalary"
                placeholder="0,00"
                value={grossSalary}
                onChange={(e) => setGrossSalary(formatCurrencyDigitsToInput(e.target.value))}
                className="h-10 border-white/10 bg-white/5 text-white"
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="dayOfMonth" className="text-white/80">
              Dia do Recebimento
            </FieldLabel>
            <FieldContent>
              <NativeSelect
                id="dayOfMonth"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Number(e.target.value))}
                className="h-10 border-white/10 bg-white/5 text-white"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <NativeSelectOption key={day} value={day}>
                    Dia {day}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </FieldContent>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="accountId" className="text-white/80">
            Conta para Depósito
          </FieldLabel>
          <FieldContent>
            <NativeSelect
              id="accountId"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="h-10 border-white/10 bg-white/5 text-white"
            >
              <NativeSelectOption value="">Selecione uma conta</NativeSelectOption>
              {accounts.map((acc) => (
                <NativeSelectOption key={acc.id} value={acc.id}>
                  {acc.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </FieldContent>
        </Field>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium uppercase tracking-[0.1em] text-white/70">Descontos</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addDeduction}
              className="h-8 border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.1em] hover:bg-white/10"
            >
              <Plus className="mr-1 size-3" /> Adicionar
            </Button>
          </div>

          {deductions.length === 0 ? (
            <p className="text-xs text-white/40 italic">Nenhum desconto cadastrado.</p>
          ) : (
            <div className="space-y-3">
              {deductions.map((d, index) => (
                <div key={index} className="flex items-end gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="Ex: INSS"
                      value={d.description}
                      onChange={(e) => updateDeduction(index, "description", e.target.value)}
                      className="h-9 border-white/10 bg-white/5 text-xs text-white"
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      placeholder="0,00"
                      value={formatCurrencyDigitsToInput(String(d.amountCents))}
                      onChange={(e) => updateDeduction(index, "amountCents", parseCurrencyInputToCents(e.target.value))}
                      className="h-9 border-white/10 bg-white/5 text-xs text-white text-right"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDeduction(index)}
                    className="h-9 w-9 text-white/30 hover:text-red-400 hover:bg-red-400/10"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Salário Líquido Estimado</span>
            <span className="text-xl font-semibold tracking-tight text-[#d8f36a]">
              R$ {(netSalaryCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </FieldGroup>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-11 border border-[#d8f36a] bg-[#d8f36a] text-[11px] font-bold uppercase tracking-[0.25em] text-black hover:bg-[#c9e45f]"
      >
        {isPending ? "Salvando..." : "Salvar Configuração"}
      </Button>
    </form>
  )
}
