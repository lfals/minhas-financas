import { z } from "zod"

export const salaryDeductionSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Descrição é obrigatória"),
  amountCents: z.number().int().positive("Valor deve ser positivo"),
})

export const salaryConfigSchema = z.object({
  id: z.string(),
  clerkUserId: z.string(),
  amountCents: z.number().int().positive("Salário bruto deve ser positivo"),
  dayOfMonth: z.number().int().min(1).max(31),
  accountId: z.string().min(1, "Conta é obrigatória"),
  deductions: z.array(salaryDeductionSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type SalaryDeduction = z.infer<typeof salaryDeductionSchema>
export type SalaryConfig = z.infer<typeof salaryConfigSchema>

export type ConfigureSalaryCommand = {
  clerkUserId: string
  amountCents: number
  dayOfMonth: number
  accountId: string
  deductions: Array<{
    description: string
    amountCents: number
  }>
}
