import "server-only"

import { z } from "zod"

import { ConfigurationAppError } from "@/lib/errors/app-error"

const serverEnvSchema = z.object({
  TURSO_DATABASE_URL: z.string().min(1, "TURSO_DATABASE_URL é obrigatória."),
  TURSO_AUTH_TOKEN: z.string().min(1, "TURSO_AUTH_TOKEN é obrigatória."),
})

export function getServerEnv() {
  const result = serverEnvSchema.safeParse({
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
  })

  if (!result.success) {
    throw new ConfigurationAppError(
      "As variáveis de ambiente do servidor não estão configuradas para o módulo financeiro.",
      result.error.flatten()
    )
  }

  return result.data
}

export function hasClerkCredentials() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.CLERK_SECRET_KEY
  )
}
