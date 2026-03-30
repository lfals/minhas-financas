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
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-8 sm:py-6 lg:px-12">
        <header className="border border-white/10 bg-[#121212]">
          <div className="hidden min-h-16 items-center justify-end px-4 py-3 sm:flex sm:px-5 sm:py-4">
            <div className="flex flex-wrap items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3 border border-white/10 bg-white/5 px-3 py-2">
                  <div className="min-w-0 text-right">
                    <p className="truncate text-sm font-medium text-white">{user.fullName}</p>
                  </div>
                  <AuthUserMenu />
                </div>
              ) : null}
            </div>
          </div>

          <AppShellNav
            navigation={navigation}
            mobileAccountSlot={
              user ? (
                <div className="flex items-center justify-between gap-3 border border-white/10 bg-white/5 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">Conta</p>
                    <p className="truncate text-sm font-medium text-white">{user.fullName}</p>
                  </div>
                  <AuthUserMenu />
                </div>
              ) : undefined
            }
          />
        </header>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
