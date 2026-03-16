"use client"

import { UserButton } from "@clerk/nextjs"

export function AuthUserMenu() {
  return (
    <UserButton
      appearance={{
        elements: {
          userButtonAvatarBox: "size-10 rounded-none",
          userButtonTrigger:
            "flex size-10 items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10",
        },
      }}
    />
  )
}
