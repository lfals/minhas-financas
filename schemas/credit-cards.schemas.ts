import { z } from "zod"

const centsSchema = z.union([z.number(), z.string(), z.bigint()]).transform((value) => {
  const parsed =
    typeof value === "bigint"
      ? Number(value)
      : typeof value === "string"
        ? Number(value)
        : value

  if (!Number.isSafeInteger(parsed) || parsed < 0) {
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

const cardDaySchema = z.coerce
  .number()
  .int("Informe um dia válido.")
  .min(1, "Informe um dia entre 1 e 31.")
  .max(31, "Informe um dia entre 1 e 31.")

const finalDigitsSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{4}$/.test(value), {
    message: "Informe 4 dígitos ou deixe em branco.",
  })

export const createCreditCardInputSchema = z.object({
  clientRequestId: z.uuid().optional(),
  nickname: z.string().trim().min(1, "Informe o nome do cartão.").max(80),
  finalDigits: finalDigitsSchema,
  limitCents: centsSchema,
  closingDay: cardDaySchema,
  dueDay: cardDaySchema,
  expenseAccountId: z.uuid("Selecione uma conta válida."),
  autoCategorizationEnabled: optionalBooleanSchema.default(true),
})

export const updateCreditCardInputSchema = createCreditCardInputSchema.extend({
  cardId: z.uuid(),
})

export const createCreditCardFormSchema = z.object({
  nickname: z.string().trim().min(1, "Informe o nome do cartão.").max(80),
  finalDigits: finalDigitsSchema,
  limit: z.string().trim().min(1, "Informe o limite."),
  closingDay: cardDaySchema,
  dueDay: cardDaySchema,
  expenseAccountId: z.uuid("Selecione uma conta válida."),
  autoCategorizationEnabled: optionalBooleanSchema.default(true),
})

export const updateCreditCardFormSchema = createCreditCardFormSchema.extend({
  cardId: z.uuid(),
})

export const archiveCreditCardFormSchema = z.object({
  cardId: z.uuid(),
})

export const creditCardRecordSchema = z.object({
  id: z.uuid(),
  clerkUserId: z.string().min(1),
  nickname: z.string(),
  finalDigits: z.string().refine((value) => value === "" || /^\d{4}$/.test(value)),
  limitCents: centsSchema,
  usedLimitCents: centsSchema,
  closingDay: z.number().int(),
  dueDay: z.number().int(),
  expenseAccountId: z.uuid(),
  expenseAccountName: z.string(),
  autoCategorizationEnabled: z.boolean(),
  isArchived: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type CreateCreditCardInput = z.infer<typeof createCreditCardInputSchema>
export type UpdateCreditCardInput = z.infer<typeof updateCreditCardInputSchema>
export type CreateCreditCardFormInput = z.infer<typeof createCreditCardFormSchema>
export type UpdateCreditCardFormInput = z.infer<typeof updateCreditCardFormSchema>
export type CreditCardRecord = z.infer<typeof creditCardRecordSchema>
