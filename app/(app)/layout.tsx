import { Suspense, type ReactNode } from "react"

import { AppShell } from "@/components/layout/app-shell"
import {
  AppShellDesktopAccountSkeleton,
  AppShellMobileAccountSkeleton,
} from "@/components/layout/app-shell-account-skeleton"
import {
  AppShellDesktopClerkAccount,
  AppShellMobileClerkAccount,
} from "@/components/rsc/app-shell-clerk-account"

export default function AuthenticatedLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <AppShell
      desktopAccountSlot={
        <Suspense fallback={<AppShellDesktopAccountSkeleton />}>
          <AppShellDesktopClerkAccount />
        </Suspense>
      }
      mobileAccountSlot={
        <Suspense fallback={<AppShellMobileAccountSkeleton />}>
          <AppShellMobileClerkAccount />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  )
}
