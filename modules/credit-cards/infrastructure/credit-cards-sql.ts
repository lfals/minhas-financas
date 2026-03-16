export const creditCardSelectColumnsSql = `
  c.id,
  c.clerk_user_id,
  c.nickname,
  c.final_digits,
  c.limit_cents::text as limit_cents,
  coalesce(open_invoices.used_limit_cents, 0)::text as used_limit_cents,
  c.closing_day,
  c.due_day,
  c.expense_account_id,
  a.name as expense_account_name,
  a.institution as expense_account_institution,
  c.auto_categorization_enabled,
  c.is_archived,
  c.created_at::text as created_at,
  c.updated_at::text as updated_at
`

export const listCreditCardsSql = `
  select
    ${creditCardSelectColumnsSql}
  from credit_cards c
  inner join accounts a
    on a.id = c.expense_account_id
  left join (
    select
      credit_card_id,
      sum(amount_cents) as used_limit_cents
    from transactions
    where clerk_user_id = $1
      and source_type = 'credit_card_invoice'
      and status != 'compensated'
      and credit_card_id is not null
    group by credit_card_id
  ) open_invoices
    on open_invoices.credit_card_id = c.id
  where c.clerk_user_id = $1
    and c.is_archived = false
  order by c.created_at desc
`

export const findCreditCardByIdSql = `
  select
    ${creditCardSelectColumnsSql}
  from credit_cards c
  inner join accounts a
    on a.id = c.expense_account_id
  left join (
    select
      credit_card_id,
      sum(amount_cents) as used_limit_cents
    from transactions
    where clerk_user_id = $1
      and source_type = 'credit_card_invoice'
      and status != 'compensated'
      and credit_card_id is not null
    group by credit_card_id
  ) open_invoices
    on open_invoices.credit_card_id = c.id
  where c.clerk_user_id = $1
    and c.id = $2
  limit 1
`

export const findCreditCardByNicknameSql = `
  select
    ${creditCardSelectColumnsSql}
  from credit_cards c
  inner join accounts a
    on a.id = c.expense_account_id
  left join (
    select
      credit_card_id,
      sum(amount_cents) as used_limit_cents
    from transactions
    where clerk_user_id = $1
      and source_type = 'credit_card_invoice'
      and status != 'compensated'
      and credit_card_id is not null
    group by credit_card_id
  ) open_invoices
    on open_invoices.credit_card_id = c.id
  where c.clerk_user_id = $1
    and lower(c.nickname) = lower($2)
    and c.is_archived = false
  limit 1
`

export const findCreditCardByClientRequestSql = `
  select
    ${creditCardSelectColumnsSql}
  from credit_cards c
  inner join accounts a
    on a.id = c.expense_account_id
  left join (
    select
      credit_card_id,
      sum(amount_cents) as used_limit_cents
    from transactions
    where clerk_user_id = $1
      and source_type = 'credit_card_invoice'
      and status != 'compensated'
      and credit_card_id is not null
    group by credit_card_id
  ) open_invoices
    on open_invoices.credit_card_id = c.id
  where c.clerk_user_id = $1
    and c.client_request_id = $2
  limit 1
`

export const insertCreditCardSql = `
  insert into credit_cards (
    clerk_user_id,
    client_request_id,
    nickname,
    final_digits,
    limit_cents,
    closing_day,
    due_day,
    expense_account_id,
    auto_categorization_enabled
  ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  returning
    id,
    clerk_user_id,
    nickname,
    final_digits,
    limit_cents::text as limit_cents,
    closing_day,
    due_day,
    expense_account_id,
    auto_categorization_enabled,
    is_archived,
    created_at::text as created_at,
    updated_at::text as updated_at
`

export const updateCreditCardSql = `
  update credit_cards
  set
    nickname = $3,
    final_digits = $4,
    limit_cents = $5,
    closing_day = $6,
    due_day = $7,
    expense_account_id = $8,
    auto_categorization_enabled = $9,
    updated_at = now()
  where clerk_user_id = $1
    and id = $2
    and is_archived = false
  returning
    id,
    clerk_user_id,
    nickname,
    final_digits,
    limit_cents::text as limit_cents,
    closing_day,
    due_day,
    expense_account_id,
    auto_categorization_enabled,
    is_archived,
    created_at::text as created_at,
    updated_at::text as updated_at
`

export const findAccountForCreditCardSql = `
  select
    id,
    name,
    institution
  from accounts
  where clerk_user_id = $1
    and id = $2
    and is_archived = false
  limit 1
`

export const insertCreditCardAuditLogSql = `
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
