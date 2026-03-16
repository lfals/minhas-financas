import { ConflictAppError } from "@/lib/errors/app-error"
import type { AccountRecord, AccountType } from "@/modules/accounts/domain/types"

const typeLabels: Record<AccountType, string> = {
  checking: "Conta corrente",
  savings: "Poupança",
  cash: "Carteira",
  investment: "Investimento",
}

const typeTones: Record<AccountType, string> = {
  checking: "bg-[#d8f36a]",
  savings: "bg-[#c4f1ff]",
  cash: "bg-[#ffe07a]",
  investment: "bg-[#ffb4a2]",
}

export function getAccountTypeLabel(type: AccountType) {
  return typeLabels[type]
}

export function getAccountTone(type: AccountType) {
  return typeTones[type]
}

export function normalizeComparableText(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR")
}

export function ensureAccountDoesNotConflict(existingAccount: AccountRecord | null) {
  if (existingAccount) {
    throw new ConflictAppError("Já existe uma conta com esse nome nessa instituição.")
  }
}
