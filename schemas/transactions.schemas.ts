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

const booleanInputSchema = z
  .union([z.boolean(), z.literal("true"), z.literal("false"), z.literal("on"), z.null(), z.undefined()])
  .transform((value) => value === true || value === "true" || value === "on")

const optionalInstallmentNumberSchema = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return null
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? value : parsed
  }

  return value
}, z.number().int("Informe um número inteiro.").positive("Informe um valor maior que zero.").nullable())

const optionalUuidInputSchema = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return null
  }

  return value
}, z.uuid().nullable())

export const transactionKindSchema = z.enum(["income", "expense"])
export const transactionStatusSchema = z.enum(["compensated", "pending", "scheduled"])
export const transactionFormKindSchema = z.enum(["income", "expense", "card-expense"])
export const fixedExpenseFrequencySchema = z.enum(["daily", "weekly", "fortnightly", "monthly", "yearly"])
export const installmentAmountInputModeSchema = z.enum(["installment", "total"])
export const transactionSourceTypeSchema = z.enum(["manual", "credit_card_invoice"])

export const createTransactionInputSchema = z.object({
  clientRequestId: z.uuid().optional(),
  accountId: z.uuid(),
  title: z.string().trim().min(1, "Informe a descrição do lançamento.").max(120),
  category: z.string().trim().min(1, "Informe a categoria.").max(80),
  kind: transactionKindSchema,
  status: transactionStatusSchema,
  amountCents: centsSchema,
  occurredOn: isoDateSchema,
  isFixed: booleanInputSchema,
  fixedExpenseFrequency: fixedExpenseFrequencySchema.nullable().optional(),
  installmentNumber: optionalInstallmentNumberSchema,
  installmentTotal: optionalInstallmentNumberSchema,
  installmentAmountInputMode: installmentAmountInputModeSchema.default("installment"),
  notes: z.string().trim().max(500).optional(),
  sourceType: transactionSourceTypeSchema.default("manual"),
  creditCardId: z.uuid().nullable().optional(),
  invoiceMonth: isoDateSchema.nullable().optional(),
}).superRefine((value, context) => {
  if (value.isFixed && !value.fixedExpenseFrequency) {
    context.addIssue({
      code: "custom",
      path: ["fixedExpenseFrequency"],
      message: "Selecione a recorrência do lançamento fixo.",
    })
  }

  if (!value.isFixed && value.fixedExpenseFrequency) {
    context.addIssue({
      code: "custom",
      path: ["fixedExpenseFrequency"],
      message: "A recorrência só pode ser informada para lançamentos fixos.",
    })
  }

  const hasInstallmentData = value.installmentNumber !== null || value.installmentTotal !== null

  if (value.isFixed && hasInstallmentData) {
    context.addIssue({
      code: "custom",
      path: ["installmentNumber"],
      message: "Lançamentos fixos não podem ser parcelados.",
    })
  }

  if (hasInstallmentData && (value.installmentNumber === null || value.installmentTotal === null)) {
    context.addIssue({
      code: "custom",
      path: ["installmentNumber"],
      message: "Informe a parcela inicial e o total de parcelas.",
    })
  }

  if (
    value.installmentNumber !== null &&
    value.installmentTotal !== null &&
    value.installmentNumber > value.installmentTotal
  ) {
    context.addIssue({
      code: "custom",
      path: ["installmentNumber"],
      message: "A parcela inicial não pode ser maior que o total de parcelas.",
    })
  }

  if (
    (value.installmentNumber === null || value.installmentTotal === null) &&
    value.installmentAmountInputMode !== "installment"
  ) {
    context.addIssue({
      code: "custom",
      path: ["installmentAmountInputMode"],
      message: "Esse campo só pode ser usado em lançamentos parcelados.",
    })
  }

  if (value.sourceType === "credit_card_invoice") {
    if (!value.creditCardId || !value.invoiceMonth) {
      context.addIssue({
        code: "custom",
        path: ["creditCardId"],
        message: "A fatura do cartão precisa estar vinculada a um cartão e a uma competência.",
      })
    }
  }
})

export const createTransactionFormSchema = z.object({
  accountId: optionalUuidInputSchema,
  cardId: optionalUuidInputSchema,
  title: z.string().trim().min(1, "Informe a descrição do lançamento.").max(120),
  category: z.string().trim().min(1, "Informe a categoria.").max(80),
  kind: transactionFormKindSchema,
  status: z.union([transactionStatusSchema, z.literal(""), z.null(), z.undefined()])
    .transform((value) => (value ? value : null)),
  amount: z.string().trim().min(1, "Informe o valor."),
  occurredOn: isoDateSchema,
  isFixed: booleanInputSchema,
  fixedExpenseFrequency: z.union([fixedExpenseFrequencySchema, z.literal(""), z.null(), z.undefined()])
    .transform((value) => (value ? value : null)),
  installmentNumber: optionalInstallmentNumberSchema,
  installmentTotal: optionalInstallmentNumberSchema,
  installmentAmountInputMode: z.union([
    installmentAmountInputModeSchema,
    z.literal(""),
    z.null(),
    z.undefined(),
  ]).transform((value) => (value ? value : "installment")),
  notes: z.string().trim().max(500).optional(),
}).superRefine((value, context) => {
  const isCardExpense = value.kind === "card-expense"

  if (isCardExpense) {
    if (!value.cardId) {
      context.addIssue({
        code: "custom",
        path: ["cardId"],
        message: "Selecione um cartão válido.",
      })
    }
  } else if (!value.accountId) {
    context.addIssue({
      code: "custom",
      path: ["accountId"],
      message: "Selecione uma conta válida.",
    })
  }

  if (!value.status) {
    context.addIssue({
      code: "custom",
      path: ["status"],
      message: "Selecione um status válido.",
    })
  }

  if (value.isFixed && !value.fixedExpenseFrequency) {
    context.addIssue({
      code: "custom",
      path: ["fixedExpenseFrequency"],
      message: "Selecione a recorrência do lançamento fixo.",
    })
  }

  if (!value.isFixed && value.fixedExpenseFrequency) {
    context.addIssue({
      code: "custom",
      path: ["fixedExpenseFrequency"],
      message: "A recorrência só pode ser informada para lançamentos fixos.",
    })
  }

  const hasInstallmentData = value.installmentNumber !== null || value.installmentTotal !== null

  if (isCardExpense && value.isFixed) {
    context.addIssue({
      code: "custom",
      path: ["isFixed"],
      message: "Compras no cartão não aceitam recorrência fixa neste formulário.",
    })
  }

  if (value.isFixed && hasInstallmentData) {
    context.addIssue({
      code: "custom",
      path: ["installmentNumber"],
      message: "Lançamentos fixos não podem ser parcelados.",
    })
  }

  if (hasInstallmentData && (value.installmentNumber === null || value.installmentTotal === null)) {
    context.addIssue({
      code: "custom",
      path: ["installmentNumber"],
      message: "Informe a parcela inicial e o total de parcelas.",
    })
  }

  if (
    value.installmentNumber !== null &&
    value.installmentTotal !== null &&
    value.installmentNumber > value.installmentTotal
  ) {
    context.addIssue({
      code: "custom",
      path: ["installmentNumber"],
      message: "A parcela inicial não pode ser maior que o total de parcelas.",
    })
  }

  if (
    (value.installmentNumber === null || value.installmentTotal === null) &&
    value.installmentAmountInputMode !== "installment"
  ) {
    context.addIssue({
      code: "custom",
      path: ["installmentAmountInputMode"],
      message: "Esse campo só pode ser usado em lançamentos parcelados.",
    })
  }
})

export const createCreditCardExpenseInputSchema = z.object({
  clientRequestId: z.uuid().optional(),
  cardId: z.uuid("Selecione um cartão válido."),
  title: z.string().trim().min(1, "Informe a descrição da compra.").max(120),
  category: z.string().trim().min(1, "Informe a categoria.").max(80),
  amountCents: centsSchema,
  occurredOn: isoDateSchema,
  installmentNumber: optionalInstallmentNumberSchema,
  installmentTotal: optionalInstallmentNumberSchema,
  installmentAmountInputMode: installmentAmountInputModeSchema.default("installment"),
  notes: z.string().trim().max(500).optional(),
}).superRefine((value, context) => {
  const hasInstallmentData = value.installmentNumber !== null || value.installmentTotal !== null

  if (hasInstallmentData && (value.installmentNumber === null || value.installmentTotal === null)) {
    context.addIssue({
      code: "custom",
      path: ["installmentNumber"],
      message: "Informe a parcela inicial e o total de parcelas.",
    })
  }

  if (
    value.installmentNumber !== null &&
    value.installmentTotal !== null &&
    value.installmentNumber > value.installmentTotal
  ) {
    context.addIssue({
      code: "custom",
      path: ["installmentNumber"],
      message: "A parcela inicial não pode ser maior que o total de parcelas.",
    })
  }

  if (
    (value.installmentNumber === null || value.installmentTotal === null) &&
    value.installmentAmountInputMode !== "installment"
  ) {
    context.addIssue({
      code: "custom",
      path: ["installmentAmountInputMode"],
      message: "Esse campo só pode ser usado em compras parceladas.",
    })
  }
})

export const settleTransactionInputSchema = z.object({
  transactionId: z.uuid("Lançamento inválido para efetivação."),
  amount: z.preprocess((value) => {
    if (value === null || value === undefined) {
      return null
    }

    const normalized = String(value).trim()
    return normalized ? normalized : null
  }, z.string().nullable().optional()),
})

export const removeTransactionScopeSchema = z.enum(["single", "future"])

export const removeTransactionInputSchema = z.object({
  transactionId: z.uuid("Lançamento inválido para remoção."),
  scope: removeTransactionScopeSchema.default("single"),
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
  seriesId: z.uuid().nullable().optional(),
  isFixed: z.boolean(),
  fixedExpenseFrequency: fixedExpenseFrequencySchema.nullable().optional(),
  installmentNumber: z.number().int().positive().nullable().optional(),
  installmentTotal: z.number().int().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
  sourceType: transactionSourceTypeSchema.default("manual"),
  creditCardId: z.uuid().nullable().optional(),
  invoiceMonth: isoDateSchema.nullable().optional(),
  settledAmountCents: centsSchema.nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const transactionListRecordSchema = transactionRecordSchema.extend({
  accountName: z.string(),
  accountInstitution: z.string(),
})

export const creditCardInvoiceExpenseRecordSchema = z.object({
  id: z.uuid(),
  cardId: z.uuid(),
  cardName: z.string(),
  invoiceTransactionId: z.uuid(),
  title: z.string(),
  category: z.string(),
  amountCents: centsSchema,
  occurredOn: isoDateSchema,
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type TransactionKind = z.infer<typeof transactionKindSchema>
export type TransactionFormKind = z.infer<typeof transactionFormKindSchema>
export type TransactionStatus = z.infer<typeof transactionStatusSchema>
export type FixedExpenseFrequency = z.infer<typeof fixedExpenseFrequencySchema>
export type InstallmentAmountInputMode = z.infer<typeof installmentAmountInputModeSchema>
export type TransactionSourceType = z.infer<typeof transactionSourceTypeSchema>
export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>
export type CreateTransactionFormInput = z.infer<typeof createTransactionFormSchema>
export type CreateCreditCardExpenseInput = z.infer<typeof createCreditCardExpenseInputSchema>
export type SettleTransactionInput = z.infer<typeof settleTransactionInputSchema>
export type RemoveTransactionScope = z.infer<typeof removeTransactionScopeSchema>
export type RemoveTransactionInput = z.infer<typeof removeTransactionInputSchema>
export type TransactionRecord = z.infer<typeof transactionRecordSchema>
export type TransactionListRecord = z.infer<typeof transactionListRecordSchema>
export type CreditCardInvoiceExpenseRecord = z.infer<typeof creditCardInvoiceExpenseRecordSchema>
