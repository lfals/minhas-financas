import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { getAccountTone, getAccountTypeLabel } from "@/modules/accounts/domain/account-rules"
import type { AccountRecord, AccountsPageData } from "@/modules/accounts/domain/types"

export function buildAccountsPageData(accounts: AccountRecord[]): AccountsPageData {
  const items = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    institution: account.institution,
    type: account.type,
    typeLabel: getAccountTypeLabel(account.type),
    balanceCents: account.currentBalanceCents,
    initialBalanceCents: account.initialBalanceCents,
    includeInNetWorth: account.includeInNetWorth,
    createdAtLabel: format(new Date(account.createdAt), "dd MMM", { locale: ptBR }),
    tone: getAccountTone(account.type),
  }))

  return {
    accounts: items,
    totalBalanceCents: items.reduce((sum, account) => sum + account.balanceCents, 0),
    netWorthBalanceCents: items
      .filter((account) => account.includeInNetWorth)
      .reduce((sum, account) => sum + account.balanceCents, 0),
    activeCount: items.length,
  }
}
