import { currentUser } from "@clerk/nextjs/server"
import { cache } from "react"

export const getCachedLandingUser = cache(async () => {
  try {
    return await currentUser()
  } catch {
    return null
  }
})
