"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CreditCard,
  Landmark,
  LayoutDashboard,
  Menu,
  Settings,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react"

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const icons = {
  "credit-card": CreditCard,
  landmark: Landmark,
  "layout-dashboard": LayoutDashboard,
  settings: Settings,
  "trending-up": TrendingUp,
  wallet: Wallet,
} satisfies Record<string, LucideIcon>

type NavigationItem = {
  href: string
  label: string
  icon: keyof typeof icons
}

export type { NavigationItem }

export function AppShellNav({
  navigation,
  mobileAccountSlot,
}: {
  navigation: NavigationItem[]
  mobileAccountSlot?: ReactNode
}) {
  const pathname = usePathname()
  const activeItem = navigation.find(({ href }) => pathname === href)

  return (
    <>
      <nav className="hidden flex-wrap gap-2 border-t border-white/10 px-5 py-4 sm:flex">
        {navigation.map(({ href, label, icon }) => {
          const isActive = pathname === href
          const Icon = icons[icon]

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 border px-3 py-2 text-[11px] uppercase tracking-[0.24em] transition-colors",
                isActive
                  ? "border-[#d8f36a] bg-[#d8f36a] text-black"
                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-3 sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/45">Navegação</p>
            <p className="truncate text-sm font-medium uppercase tracking-[0.14em] text-white">
              {activeItem?.label ?? "Menu"}
            </p>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Abrir menu"
                className="flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-white transition-colors hover:bg-white/10"
              >
                <Menu className="size-4" />
                Menu
              </button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="border-l border-white/10 bg-[#121212] p-0 text-white"
            >
              <SheetHeader className="border-b border-white/10 px-4 py-5">
                <SheetTitle className="text-xl font-semibold uppercase tracking-[-0.06em] text-white">
                  Navegação
                </SheetTitle>
                <SheetDescription className="text-sm leading-6 text-white/60">
                  Acesse os módulos principais do aplicativo.
                </SheetDescription>
              </SheetHeader>

              {mobileAccountSlot ? (
                <div className="border-b border-white/10 px-4 py-4">{mobileAccountSlot}</div>
              ) : null}

              <nav className="grid gap-2 px-4 py-4">
                {navigation.map(({ href, label, icon }) => {
                  const isActive = pathname === href
                  const Icon = icons[icon]

                  return (
                    <SheetClose key={href} asChild>
                      <Link
                        href={href}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 border px-4 py-3 text-sm uppercase tracking-[0.18em] transition-colors",
                          isActive
                            ? "border-[#d8f36a] bg-[#d8f36a] text-black"
                            : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
                        )}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="min-w-0 truncate">{label}</span>
                      </Link>
                    </SheetClose>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  )
}
