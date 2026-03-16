import { z } from "zod"

const centsSchema = z.union([z.number(), z.string(), z.bigint()]).transform((value) => {
  const parsed =
    typeof value === "bigint"
      ? Number(value)
      : typeof value === "string"
        ? Number(value)
        : value

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error("Valor monetário inválido.")
  }

  return parsed
})

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)), "Informe uma data válida.")

export const transactionKindSchema = z.enum(["income", "expense"])
export const transactionStatusSchema = z.enum(["compensated", "pending", "scheduled"])

export const createTransactionInputSchema = z.object({
  clientRequestId: z.uuid().optional(),
  accountId: z.uuid(),
  title: z.string().trim().min(1, "Informe a descrição do lançamento.").max(120),
  category: z.string().trim().min(1, "Informe a categoria.").max(80),
  kind: transactionKindSchema,
  status: transactionStatusSchema,
  amountCents: centsSchema,
  occurredOn: isoDateSchema,
  notes: z.string().trim().max(500).optional(),
})

export const createTransactionFormSchema = z.object({
  accountId: z.uuid("Selecione uma conta válida."),
  title: z.string().trim().min(1, "Informe a descrição do lançamento.").max(120),
  category: z.string().trim().min(1, "Informe a categoria.").max(80),
  kind: transactionKindSchema,
  status: transactionStatusSchema,
  amount: z.string().trim().min(1, "Informe o valor."),
  occurredOn: isoDateSchema,
  notes: z.string().trim().max(500).optional(),
})

export const transactionRecordSchema = z.object({
  id: z.uuid(),
  clerkUserId: z.string().min(1),
  accountId: z.uuid(),
  title: z.string(),
  category: z.string(),
  kind: transactionKindSchema,
  status: transactionStatusSchema,
  amountCents: centsSchema,
  occurredOn: isoDateSchema,
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const transactionListRecordSchema = transactionRecordSchema.extend({
  accountName: z.string(),
  accountInstitution: z.string(),
})

export type TransactionKind = z.infer<typeof transactionKindSchema>
export type TransactionStatus = z.infer<typeof transactionStatusSchema>
export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>
export type CreateTransactionFormInput = z.infer<typeof createTransactionFormSchema>
export type TransactionRecord = z.infer<typeof transactionRecordSchema>
export type TransactionListRecord = z.infer<typeof transactionListRecordSchema>
