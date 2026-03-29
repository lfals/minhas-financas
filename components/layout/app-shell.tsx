import { AuthUserMenu } from "@/components/client/auth-user-menu.client"
import { AppShellNav, type NavigationItem } from "@/components/layout/app-shell-nav"

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: "layout-dashboard" },
  { href: "/contas", label: "Contas", icon: "landmark" },
  { href: "/lancamentos", label: "Lançamentos", icon: "wallet" },
  { href: "/cartoes", label: "Cartões", icon: "credit-card" },
  { href: "/investimentos", label: "Investimentos", icon: "trending-up" },
  { href: "/configuracoes", label: "Configurações", icon: "settings" },
] satisfies NavigationItem[]

export function AppShell({
  user,
  children,
}: {
  user: {
    fullName: string
  } | null
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#f7f3ea]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-12">
        <header className="border border-white/10 bg-[#121212]">
          <div className="flex flex-col gap-5 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center border border-white/10 bg-[#d8f36a] text-xs font-semibold uppercase tracking-[0.3em] text-black">
                MF
              </div>
              <div>
                <p className="text-sm font-medium text-white/85">Minhas Finanças</p>
                <p className="text-sm text-white/65">
                  Acompanhe contas, lançamentos e investimentos.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3 border border-white/10 bg-white/5 px-3 py-2">
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{user.fullName}</p>
                  </div>
                  <AuthUserMenu />
                </div>
              ) : null}
            </div>
          </div>

          <AppShellNav navigation={navigation} />
        </header>

        <div className="flex-1 py-6">{children}</div>
      </div>
    </div>
  )
}
