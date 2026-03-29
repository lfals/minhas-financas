"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CreditCard,
  Landmark,
  LayoutDashboard,
  Settings,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react"

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

export function AppShellNav({ navigation }: { navigation: NavigationItem[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-2 border-t border-white/10 px-5 py-4">
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
  )
}
