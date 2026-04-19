import { currentUser } from "@clerk/nextjs/server"

import { AppShell } from "@/components/layout/app-shell"

export const dynamic = "force-dynamic"

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  let user = null
  try {
    user = await currentUser()
  } catch (error) {
    console.error("Erro ao buscar usuário do Clerk:", error)
    // Se falhar, continuamos como não autenticado ou mostramos erro amigável dependendo da lógica
  }

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
