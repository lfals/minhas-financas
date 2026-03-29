import "server-only"

import { auth } from "@clerk/nextjs/server"

import { UnauthorizedAppError } from "@/lib/errors/app-error"

export async function getClerkUserIdOrThrow() {
  const { userId } = await auth()

  if (!userId) {
    throw new UnauthorizedAppError()
  }

  return userId
}
