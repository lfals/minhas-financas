import { ValidationAppError } from "@/lib/errors/app-error"

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

export function centsToAmount(cents: number) {
  return cents / 100
}

export function formatCents(cents: number) {
  return brlFormatter.format(centsToAmount(cents))
}

export function parseCurrencyInputToCents(value: string) {
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

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new ValidationAppError("Saldo inicial inválido.")
  }

  const cents = Math.round(parsed * 100)

  if (!Number.isSafeInteger(cents)) {
    throw new ValidationAppError("Saldo inicial excede o limite suportado.")
  }

  return cents
}
