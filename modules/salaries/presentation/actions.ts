"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { configureSalaryUseCase } from "@/modules/salaries/application/configure-salary-use-case"
import type { ConfigureSalaryCommand } from "@/modules/salaries/domain/types"

export async function configureSalaryAction(command: Omit<ConfigureSalaryCommand, "clerkUserId">) {
  const { userId: clerkUserId } = await auth()

  if (!clerkUserId) {
    throw new Error("Não autorizado")
  }

  const result = await configureSalaryUseCase({
    ...command,
    clerkUserId,
  })

  revalidatePath("/configuracoes")
  revalidatePath("/lancamentos")
  revalidatePath("/dashboard")

  return result
}
