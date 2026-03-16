export const listAccountsSql = `
  select
    id,
    clerk_user_id,
    name,
    institution,
    type,
    currency_code,
    initial_balance_cents::text as initial_balance_cents,
    current_balance_cents::text as current_balance_cents,
    include_in_net_worth,
    is_archived,
    display_order,
    created_at::text as created_at,
    updated_at::text as updated_at
  from accounts
  where clerk_user_id = $1
    and is_archived = false
  order by display_order asc, created_at asc
`

export const listAllAccountsSql = `
  select
    id,
    clerk_user_id,
    name,
    institution,
    type,
    currency_code,
    initial_balance_cents::text as initial_balance_cents,
    current_balance_cents::text as current_balance_cents,
    include_in_net_worth,
    is_archived,
    display_order,
    created_at::text as created_at,
    updated_at::text as updated_at
  from accounts
  where clerk_user_id = $1
  order by display_order asc, created_at asc
`

export const findAccountByNameAndInstitutionSql = `
  select
    id,
    clerk_user_id,
    name,
    institution,
    type,
    currency_code,
    initial_balance_cents::text as initial_balance_cents,
    current_balance_cents::text as current_balance_cents,
    include_in_net_worth,
    is_archived,
    display_order,
    created_at::text as created_at,
    updated_at::text as updated_at
  from accounts
  where clerk_user_id = $1
    and lower(name) = lower($2)
    and lower(institution) = lower($3)
  limit 1
`

export const findAccountByClientRequestSql = `
  select
    id,
    clerk_user_id,
    name,
    institution,
    type,
    currency_code,
    initial_balance_cents::text as initial_balance_cents,
    current_balance_cents::text as current_balance_cents,
    include_in_net_worth,
    is_archived,
    display_order,
    created_at::text as created_at,
    updated_at::text as updated_at
  from accounts
  where clerk_user_id = $1
    and client_request_id = $2
  limit 1
`

export const findAccountByIdSql = `
  select
    id,
    clerk_user_id,
    name,
    institution,
    type,
    currency_code,
    initial_balance_cents::text as initial_balance_cents,
    current_balance_cents::text as current_balance_cents,
    include_in_net_worth,
    is_archived,
    display_order,
    created_at::text as created_at,
    updated_at::text as updated_at
  from accounts
  where clerk_user_id = $1
    and id = $2
  limit 1
`

export const insertAccountSql = `
  insert into accounts (
    clerk_user_id,
    client_request_id,
    name,
    institution,
    type,
    currency_code,
    initial_balance_cents,
    current_balance_cents,
    include_in_net_worth,
    display_order
  ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  returning
    id,
    clerk_user_id,
    name,
    institution,
    type,
    currency_code,
    initial_balance_cents::text as initial_balance_cents,
    current_balance_cents::text as current_balance_cents,
    include_in_net_worth,
    is_archived,
    display_order,
    created_at::text as created_at,
    updated_at::text as updated_at
`

export const archiveAccountSql = `
  update accounts
  set
    is_archived = true,
    updated_at = now()
  where clerk_user_id = $1
    and id = $2
    and is_archived = false
  returning
    id,
    clerk_user_id,
    name,
    institution,
    type,
    currency_code,
    initial_balance_cents::text as initial_balance_cents,
    current_balance_cents::text as current_balance_cents,
    include_in_net_worth,
    is_archived,
    display_order,
    created_at::text as created_at,
    updated_at::text as updated_at
`

export const updateAccountSql = `
  update accounts
  set
    name = $3,
    institution = $4,
    type = $5,
    initial_balance_cents = $6,
    current_balance_cents = current_balance_cents + $6 - initial_balance_cents,
    include_in_net_worth = $7,
    updated_at = now()
  where clerk_user_id = $1
    and id = $2
    and is_archived = false
  returning
    id,
    clerk_user_id,
    name,
    institution,
    type,
    currency_code,
    initial_balance_cents::text as initial_balance_cents,
    current_balance_cents::text as current_balance_cents,
    include_in_net_worth,
    is_archived,
    display_order,
    created_at::text as created_at,
    updated_at::text as updated_at
`

export const insertAuditLogSql = `
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
