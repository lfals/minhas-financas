import { AccountCreateDialog } from "@/components/client/account-create-dialog.client"
import { AccountsPageView } from "@/components/rsc/accounts-page-view"
import { getClerkUserIdOrThrow } from "@/lib/auth/server"
import { isAppError } from "@/lib/errors/app-error"
import { listAccountsUseCase } from "@/modules/accounts/application/list-accounts-use-case"
import { buildAccountsPageData } from "@/modules/accounts/presentation/view-model"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

async function getAccountsPageState() {
  try {
    const clerkUserId = await getClerkUserIdOrThrow()
    const accounts = await listAccountsUseCase({ clerkUserId })

    return {
      data: buildAccountsPageData(accounts),
      error: null,
    }
  } catch (error) {
    if (isAppError(error)) {
      return {
        data: null,
        error,
      }
    }

    throw error
  }
}

export default async function AccountsPage() {
  const state = await getAccountsPageState()

  if (state.error) {
    return (
      <div className="space-y-0">
        <Card className="border border-white/10 bg-[#141414] ring-0">
          <CardHeader className="gap-3">
            <CardDescription className="text-[11px] uppercase tracking-[0.35em] text-white/55">
              Accounts
            </CardDescription>
            <CardTitle className="text-3xl font-semibold uppercase tracking-[-0.07em] text-white">
              O módulo de contas precisa de autenticação e banco configurados.
            </CardTitle>
            <CardAction>
              <AccountCreateDialog />
            </CardAction>
          </CardHeader>
          <CardContent className="pt-0 text-sm leading-7 text-white/65">
            {state.error.message}
          </CardContent>
        </Card>
      </div>
    )
  }

  return <AccountsPageView data={state.data} />
}
