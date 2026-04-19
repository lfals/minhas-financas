import { z } from "zod"

const signedCentsSchema = z.union([z.number(), z.string(), z.bigint()]).transform((value) => {
  const parsed =
    typeof value === "bigint"
      ? Number(value)
      : typeof value === "string"
        ? Number(value)
        : value

  if (!Number.isSafeInteger(parsed)) {
    throw new Error("Valor monetário inválido.")
  }

  return parsed
})

const optionalBooleanSchema = z.preprocess((value) => {
  if (typeof value === "boolean") return value
  if (value === "true" || value === "on") return true
  if (value === "false" || value === undefined || value === null) return false
  return value
}, z.boolean())

export const accountTypeSchema = z.enum(["checking", "savings", "cash", "investment"])

export const createAccountInputSchema = z.object({
  clientRequestId: z.uuid().optional(),
  name: z.string().trim().min(1, "Informe o nome da conta.").max(80),
  type: accountTypeSchema,
  currencyCode: z.string().trim().length(3).default("BRL").transform((value) => value.toUpperCase()),
  initialBalanceCents: signedCentsSchema.default(0),
  includeInNetWorth: optionalBooleanSchema.default(true),
  displayOrder: z.coerce.number().int().min(0).max(9999).default(0),
})

export const createAccountFormSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da conta.").max(80),
  type: accountTypeSchema,
  initialBalance: z.string().trim().default(""),
  includeInNetWorth: optionalBooleanSchema.default(true),
})

export const updateAccountInputSchema = z.object({
  accountId: z.uuid(),
  name: z.string().trim().min(1, "Informe o nome da conta.").max(80),
  type: accountTypeSchema,
  initialBalanceCents: signedCentsSchema.default(0),
  includeInNetWorth: optionalBooleanSchema.default(true),
})

export const updateAccountFormSchema = z.object({
  accountId: z.uuid(),
  name: z.string().trim().min(1, "Informe o nome da conta.").max(80),
  type: accountTypeSchema,
  initialBalance: z.string().trim().default(""),
  includeInNetWorth: optionalBooleanSchema.default(true),
})

export const listAccountsQuerySchema = z.object({
  includeArchived: optionalBooleanSchema.default(false),
})

export const deleteAccountInputSchema = z.object({
  accountId: z.uuid(),
  targetAccountId: z.uuid().optional(),
})

export const accountRecordSchema = z.object({
  id: z.uuid(),
  clerkUserId: z.string().min(1),
  name: z.string(),
  type: accountTypeSchema,
  currencyCode: z.string().length(3),
  initialBalanceCents: signedCentsSchema,
  currentBalanceCents: signedCentsSchema,
  includeInNetWorth: z.boolean(),
  isArchived: z.boolean(),
  displayOrder: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type AccountType = z.infer<typeof accountTypeSchema>
export type CreateAccountInput = z.infer<typeof createAccountInputSchema>
export type CreateAccountFormInput = z.infer<typeof createAccountFormSchema>
export type UpdateAccountInput = z.infer<typeof updateAccountInputSchema>
export type UpdateAccountFormInput = z.infer<typeof updateAccountFormSchema>
export type ListAccountsQuery = z.infer<typeof listAccountsQuerySchema>
export type AccountRecord = z.infer<typeof accountRecordSchema>
export type DeleteAccountInput = z.infer<typeof deleteAccountInputSchema>
