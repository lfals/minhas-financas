const transactionColumns = `
  id,
  clerk_user_id,
  account_id,
  title,
  category,
  kind,
  status,
  source_type,
  credit_card_id,
  invoice_month::text as invoice_month,
  series_id,
  is_fixed,
  fixed_expense_frequency,
  installment_number,
  installment_total,
  amount_cents::text as amount_cents,
  settled_amount_cents::text as settled_amount_cents,
  occurred_on::text as occurred_on,
  notes,
  created_at::text as created_at,
  updated_at::text as updated_at
`

const transactionColumnsWithAlias = `
  t.id,
  t.clerk_user_id,
  t.account_id,
  t.title,
  t.category,
  t.kind,
  t.status,
  t.source_type,
  t.credit_card_id,
  t.invoice_month::text as invoice_month,
  t.series_id,
  t.is_fixed,
  t.fixed_expense_frequency,
  t.installment_number,
  t.installment_total,
  t.amount_cents::text as amount_cents,
  t.settled_amount_cents::text as settled_amount_cents,
  t.occurred_on::text as occurred_on,
  t.notes,
  t.created_at::text as created_at,
  t.updated_at::text as updated_at
`

export const listTransactionsSql = `
  select
    ${transactionColumnsWithAlias},
    a.name as account_name,
    a.institution as account_institution
  from transactions t
  inner join accounts a on a.id = t.account_id
  where t.clerk_user_id = $1
    and a.is_archived = false
  order by t.occurred_on desc, t.created_at desc
`

export const listCreditCardInvoiceExpensesSql = `
  select
    e.id,
    e.card_id,
    c.nickname as card_name,
    e.invoice_transaction_id,
    e.title,
    e.category,
    e.amount_cents::text as amount_cents,
    e.occurred_on::text as occurred_on,
    e.notes,
    e.created_at::text as created_at,
    e.updated_at::text as updated_at
  from credit_card_expenses e
  inner join credit_cards c on c.id = e.card_id
  where e.clerk_user_id = $1
  order by e.occurred_on desc, e.created_at desc
`

export const findTransactionByClientRequestSql = `
  select
    ${transactionColumns}
  from transactions
  where clerk_user_id = $1
    and client_request_id = $2
  limit 1
`

export const findTransactionByIdForUpdateSql = `
  select
    ${transactionColumns}
  from transactions
  where clerk_user_id = $1
    and id = $2
  limit 1
  for update
`

export const findAccountForTransactionSql = `
  select
    id,
    clerk_user_id,
    name,
    institution,
    current_balance_cents::text as current_balance_cents,
    is_archived
  from accounts
  where clerk_user_id = $1
    and id = $2
  limit 1
  for update
`

export const insertTransactionSql = `
  insert into transactions (
    clerk_user_id,
    client_request_id,
    account_id,
    title,
    category,
    kind,
    status,
    source_type,
    credit_card_id,
    invoice_month,
    series_id,
    is_fixed,
    fixed_expense_frequency,
    installment_number,
    installment_total,
    amount_cents,
    occurred_on,
    notes
  ) values (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    $8,
    $9,
    $10,
    $11,
    $12,
    $13,
    $14,
    $15,
    $16,
    $17,
    nullif($18, '')
  )
  returning
    ${transactionColumns}
`

export const compensateTransactionSql = `
  update transactions
  set
    status = 'compensated',
    settled_amount_cents = $3,
    updated_at = now()
  where clerk_user_id = $1
    and id = $2
  returning
    ${transactionColumns}
`

export const deleteTransactionSql = `
  delete from transactions
  where clerk_user_id = $1
    and id = $2
`

export const listFutureTransactionsBySeriesForUpdateSql = `
  select
    ${transactionColumns}
  from transactions
  where clerk_user_id = $1
    and series_id = $2
    and occurred_on >= $3::date
  order by occurred_on asc, created_at asc
  for update
`

export const deleteFutureTransactionsBySeriesSql = `
  delete from transactions
  where clerk_user_id = $1
    and series_id = $2
    and occurred_on >= $3::date
`

export const updateAccountBalanceSql = `
  update accounts
  set
    current_balance_cents = $3,
    updated_at = now()
  where clerk_user_id = $1
    and id = $2
`

export const insertTransactionAuditLogSql = `
  insert into audit_log (
    clerk_user_id,
    actor_type,
    action,
    entity,
    entity_id,
    before,
    after,
    request_id,
    idempotency_key
  ) values ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9)
`

export const findCreditCardForExpenseSql = `
  select
    c.id,
    c.nickname,
    c.closing_day,
    c.due_day,
    c.expense_account_id,
    c.is_archived
  from credit_cards c
  where c.clerk_user_id = $1
    and c.id = $2
  limit 1
  for update
`

export const findCreditCardExpenseByClientRequestSql = `
  select
    ${transactionColumnsWithAlias}
  from credit_card_expenses e
  inner join transactions t on t.id = e.invoice_transaction_id
  where e.clerk_user_id = $1
    and e.client_request_id = $2
  limit 1
`

export const findCreditCardInvoiceByMonthForUpdateSql = `
  select
    ${transactionColumns}
  from transactions
  where clerk_user_id = $1
    and source_type = 'credit_card_invoice'
    and credit_card_id = $2
    and invoice_month = $3::date
  limit 1
  for update
`

export const updateCreditCardInvoiceSql = `
  update transactions
  set
    account_id = $3,
    title = $4,
    category = $5,
    amount_cents = amount_cents + $6,
    occurred_on = $7::date,
    updated_at = now()
  where clerk_user_id = $1
    and id = $2
  returning
    ${transactionColumns}
`

export const insertCreditCardExpenseSql = `
  insert into credit_card_expenses (
    clerk_user_id,
    client_request_id,
    card_id,
    invoice_transaction_id,
    title,
    category,
    amount_cents,
    occurred_on,
    notes
  ) values ($1, $2, $3, $4, $5, $6, $7, $8, nullif($9, ''))
`
