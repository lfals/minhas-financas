import { CreditCardSettingsPage } from "@/components/client/credit-card-settings-page.client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getClerkUserIdOrThrow } from "@/lib/auth/server"
import { isAppError } from "@/lib/errors/app-error"
import { listAccountsUseCase } from "@/modules/accounts/application/list-accounts-use-case"
import { buildTransactionAccountOptions } from "@/modules/transactions/presentation/view-model"

async function getCreditCardsPageState() {
  try {
    const clerkUserId = await getClerkUserIdOrThrow()
    const accounts = await listAccountsUseCase({ clerkUserId })

    return {
      accountOptions: buildTransactionAccountOptions(accounts),
      error: null,
    }
  } catch (error) {
    if (isAppError(error)) {
      return {
        accountOptions: [],
        error,
      }
    }

    throw error
  }
}

export default async function CreditCardsPage() {
  const state = await getCreditCardsPageState()

  if (state.error) {
    return (
      <div className="space-y-6">
        <Card className="border border-white/10 bg-[#141414] ring-0">
          <CardHeader className="gap-3">
            <CardDescription className="text-[11px] uppercase tracking-[0.35em] text-white/55">
              Cartões
            </CardDescription>
            <CardTitle className="text-3xl font-semibold uppercase tracking-[-0.07em] text-white">
              O módulo de cartões precisa de autenticação e banco configurados.
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm leading-7 text-white/65">
            {state.error.message}
          </CardContent>
        </Card>
      </div>
    )
  }

  return <CreditCardSettingsPage accountOptions={state.accountOptions} />
}
