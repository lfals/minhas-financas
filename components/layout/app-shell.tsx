import type { ReactNode } from "react"

import { AppShellNav, type NavigationItem } from "@/components/layout/app-shell-nav"

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: "layout-dashboard" },
  { href: "/lancamentos", label: "Lançamentos", icon: "wallet" },
  { href: "/configuracoes", label: "Configurações", icon: "settings" },
] satisfies NavigationItem[]

export function AppShell({
  desktopAccountSlot,
  mobileAccountSlot,
  children,
}: {
  desktopAccountSlot: ReactNode
  mobileAccountSlot: ReactNode
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#f7f3ea]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-8 sm:py-6 lg:px-12">
        <header className="border border-white/10 bg-[#121212]">
          <div className="hidden min-h-16 items-center justify-end px-4 py-3 sm:flex sm:px-5 sm:py-4">
            <div className="flex flex-wrap items-center gap-3">{desktopAccountSlot}</div>
          </div>

          <AppShellNav navigation={navigation} mobileAccountSlot={mobileAccountSlot} />
        </header>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
