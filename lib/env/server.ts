import "server-only"

import { z } from "zod"

import { ConfigurationAppError } from "@/lib/errors/app-error"

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória."),
})

export function getServerEnv() {
  const result = serverEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
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
