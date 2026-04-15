const accountColumns = `
  id,
  clerk_user_id,
  name,
  type,
  currency_code,
  initial_balance_cents as initial_balance_cents,
  (
    initial_balance_cents +
    coalesce(
      (
        select sum(
          case
            when t.kind = 'income' then coalesce(t.settled_amount_cents, t.amount_cents)
            else -coalesce(t.settled_amount_cents, t.amount_cents)
          end
        )
        from transactions t
        where t.account_id = a.id
          and t.status = 'compensated'
      ),
      0
    )
  ) as current_balance_cents,
  include_in_net_worth,
  is_archived,
  display_order,
  created_at as created_at,
  updated_at as updated_at
`

export const listAccountsSql = `
  select
    ${accountColumns}
  from accounts a
  where clerk_user_id = ?1
    and is_archived = false
  order by display_order asc, created_at asc
`

export const listAllAccountsSql = `
  select
    ${accountColumns}
  from accounts a
  where clerk_user_id = ?1
  order by display_order asc, created_at asc
`

export const findAccountByNameSql = `
  select
    id,
    clerk_user_id,
    name,
    type,
    currency_code,
    initial_balance_cents as initial_balance_cents,
    current_balance_cents as current_balance_cents,
    include_in_net_worth,
    is_archived,
    display_order,
    created_at as created_at,
    updated_at as updated_at
  from accounts
  where clerk_user_id = ?1
    and lower(name) = lower(?2)
  limit 1
`

export const findAccountByClientRequestSql = `
  select
    id,
    clerk_user_id,
    name,
    type,
    currency_code,
    initial_balance_cents as initial_balance_cents,
    current_balance_cents as current_balance_cents,
    include_in_net_worth,
    is_archived,
    display_order,
    created_at as created_at,
    updated_at as updated_at
  from accounts
  where clerk_user_id = ?1
    and client_request_id = ?2
  limit 1
`

export const findAccountByIdSql = `
  select
    id,
    clerk_user_id,
    name,
    type,
    currency_code,
    initial_balance_cents as initial_balance_cents,
    current_balance_cents as current_balance_cents,
    include_in_net_worth,
    is_archived,
    display_order,
    created_at as created_at,
    updated_at as updated_at
  from accounts
  where clerk_user_id = ?1
    and id = ?2
  limit 1
`

export const insertAccountSql = `
  insert into accounts (
    id,
    clerk_user_id,
    client_request_id,
    name,
    type,
    currency_code,
    initial_balance_cents,
    current_balance_cents,
    include_in_net_worth,
    display_order
  ) values (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-a' || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))), ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
  returning
    id,
    clerk_user_id,
    name,
    type,
    currency_code,
    initial_balance_cents as initial_balance_cents,
    current_balance_cents as current_balance_cents,
    include_in_net_worth,
    is_archived,
    display_order,
    created_at as created_at,
    updated_at as updated_at
`

export const archiveAccountSql = `
  update accounts
  set
    is_archived = true,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  where clerk_user_id = ?1
    and id = ?2
    and is_archived = false
  returning
    id,
    clerk_user_id,
    name,
    type,
    currency_code,
    initial_balance_cents as initial_balance_cents,
    current_balance_cents as current_balance_cents,
    include_in_net_worth,
    is_archived,
    display_order,
    created_at as created_at,
    updated_at as updated_at
`

export const updateAccountSql = `
  update accounts
  set
    name = ?3,
    type = ?4,
    initial_balance_cents = ?5,
    current_balance_cents = current_balance_cents + ?5 - initial_balance_cents,
    include_in_net_worth = ?6,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  where clerk_user_id = ?1
    and id = ?2
    and is_archived = false
  returning
    id,
    clerk_user_id,
    name,
    type,
    currency_code,
    initial_balance_cents as initial_balance_cents,
    current_balance_cents as current_balance_cents,
    include_in_net_worth,
    is_archived,
    display_order,
    created_at as created_at,
    updated_at as updated_at
`

export const insertAuditLogSql = `
  insert into audit_log (
    id,
    clerk_user_id,
    actor_type,
    action,
    entity,
    entity_id,
    before,
    after,
    request_id,
    idempotency_key
  ) values (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-a' || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))), ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
`
