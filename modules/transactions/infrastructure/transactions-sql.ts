export const listTransactionsSql = `
  select
    t.id,
    t.clerk_user_id,
    t.account_id,
    t.title,
    t.category,
    t.kind,
    t.status,
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
    t.updated_at::text as updated_at,
    a.name as account_name,
    a.institution as account_institution
  from transactions t
  inner join accounts a on a.id = t.account_id
  where t.clerk_user_id = $1
    and a.is_archived = false
  order by t.occurred_on desc, t.created_at desc
`

export const findTransactionByClientRequestSql = `
  select
    id,
    clerk_user_id,
    account_id,
    title,
    category,
    kind,
    status,
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
  from transactions
  where clerk_user_id = $1
    and client_request_id = $2
  limit 1
`

export const findTransactionByIdForUpdateSql = `
  select
    id,
    clerk_user_id,
    account_id,
    title,
    category,
    kind,
    status,
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
    series_id,
    is_fixed,
    fixed_expense_frequency,
    installment_number,
    installment_total,
    amount_cents,
    occurred_on,
    notes
  ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, nullif($15, ''))
  returning
    id,
    clerk_user_id,
    account_id,
    title,
    category,
    kind,
    status,
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

export const compensateTransactionSql = `
  update transactions
  set
    status = 'compensated',
    settled_amount_cents = $3,
    updated_at = now()
  where clerk_user_id = $1
    and id = $2
  returning
    id,
    clerk_user_id,
    account_id,
    title,
    category,
    kind,
    status,
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

export const deleteTransactionSql = `
  delete from transactions
  where clerk_user_id = $1
    and id = $2
`

export const listFutureTransactionsBySeriesForUpdateSql = `
  select
    id,
    clerk_user_id,
    account_id,
    title,
    category,
    kind,
    status,
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
