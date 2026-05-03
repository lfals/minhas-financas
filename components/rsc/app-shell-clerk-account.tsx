import { currentUser } from "@clerk/nextjs/server"

import { AuthUserMenu } from "@/components/client/auth-user-menu.client"

function clerkUserDisplayName(user: NonNullable<Awaited<ReturnType<typeof currentUser>>>) {
  return (
    user.fullName ??
    [user.firstName, user.lastName].filter(Boolean).join(" ") ??
    "Usuário"
  )
}

export async function AppShellDesktopClerkAccount() {
  let user = null

  try {
    user = await currentUser()
  } catch (error) {
    console.error("Erro ao buscar usuário do Clerk:", error)
  }

  if (!user) {
    return null
  }

  const fullName = clerkUserDisplayName(user)

  return (
    <div className="flex items-center gap-3 border border-white/10 bg-white/5 px-3 py-2">
      <div className="min-w-0 text-right">
        <p className="truncate text-sm font-medium text-white">{fullName}</p>
      </div>
      <AuthUserMenu />
    </div>
  )
}

export async function AppShellMobileClerkAccount() {
  let user = null

  try {
    user = await currentUser()
  } catch (error) {
    console.error("Erro ao buscar usuário do Clerk:", error)
  }

  if (!user) {
    return null
  }

  const fullName = clerkUserDisplayName(user)

  return (
    <div className="flex items-center justify-between gap-3 border border-white/10 bg-white/5 px-3 py-2">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">Conta</p>
        <p className="truncate text-sm font-medium text-white">{fullName}</p>
      </div>
      <AuthUserMenu />
    </div>
  )
}
