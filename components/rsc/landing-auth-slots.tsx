import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getCachedLandingUser } from "@/lib/auth/cached-landing-user"

export function LandingNavAuthFallback() {
  return (
    <Link href="/sign-in" prefetch className="hover:text-white">
      Entrar
    </Link>
  )
}

export async function LandingNavAuthResolved() {
  const user = await getCachedLandingUser()

  return user ? (
    <Link href="/dashboard" prefetch className="text-[#d8f36a] hover:opacity-80">
      Dashboard
    </Link>
  ) : (
    <Link href="/sign-in" prefetch className="hover:text-white">
      Entrar
    </Link>
  )
}

export function LandingHeroCtaFallback() {
  return (
    <Button
      asChild
      className="h-12 border border-[#d8f36a] bg-[#d8f36a] px-8 text-[11px] font-bold uppercase tracking-[0.25em] text-black hover:bg-[#c9e45f]"
    >
      <Link href="/sign-in" prefetch>
        Entrar agora
        <ArrowRight className="ml-2 size-4" />
      </Link>
    </Button>
  )
}

export async function LandingHeroCtaResolved() {
  const user = await getCachedLandingUser()

  return (
    <Button
      asChild
      className="h-12 border border-[#d8f36a] bg-[#d8f36a] px-8 text-[11px] font-bold uppercase tracking-[0.25em] text-black hover:bg-[#c9e45f]"
    >
      <Link href={user ? "/dashboard" : "/sign-in"} prefetch>
        {user ? "Acessar Dashboard" : "Entrar agora"}
        <ArrowRight className="ml-2 size-4" />
      </Link>
    </Button>
  )
}
