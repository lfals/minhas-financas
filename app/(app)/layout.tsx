import { currentUser } from "@clerk/nextjs/server"

import { AppShell } from "@/components/layout/app-shell"

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await currentUser()

  return (
    <AppShell
      user={
        user
          ? {
              fullName:
                user.fullName ??
                [user.firstName, user.lastName].filter(Boolean).join(" ") ??
                "Usuário",
            }
          : null
      }
    >
      {children}
    </AppShell>
  )
}
