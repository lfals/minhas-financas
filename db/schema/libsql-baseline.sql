create table if not exists accounts (
  id text primary key,
  clerk_user_id text not null,
  client_request_id text not null,
  name text not null,
  type text not null check (type in ('checking', 'savings', 'cash', 'investment')),
  currency_code text not null default 'BRL',
  initial_balance_cents integer not null,
  current_balance_cents integer not null,
  include_in_net_worth integer not null default 1,
  is_archived integer not null default 0,
  display_order integer not null default 0,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  unique (clerk_user_id, client_request_id)
);

create unique index if not exists accounts_user_name_idx
  on accounts (clerk_user_id, lower(name));

create index if not exists accounts_user_active_idx
  on accounts (clerk_user_id, is_archived, display_order, created_at desc);

create table if not exists audit_log (
  id text primary key,
  clerk_user_id text not null,
  actor_type text not null,
  action text not null,
  entity text not null,
  entity_id text not null,
  before text,
  after text,
  request_id text,
  idempotency_key text,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create index if not exists audit_log_user_entity_idx
  on audit_log (clerk_user_id, entity, created_at desc);

create table if not exists transaction_categories (
  id text primary key,
  clerk_user_id text not null,
  name text not null,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create unique index if not exists transaction_categories_user_name_idx
  on transaction_categories (clerk_user_id, lower(trim(name)));

create table if not exists credit_cards (
  id text primary key,
  clerk_user_id text not null,
  client_request_id text not null,
  nickname text not null,
  final_digits text not null,
  limit_cents integer not null check (limit_cents >= 0),
  closing_day integer not null check (closing_day between 1 and 31),
  due_day integer not null check (due_day between 1 and 31),
  expense_account_id text not null references accounts(id),
  auto_categorization_enabled integer not null default 1,
  is_archived integer not null default 0,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  unique (clerk_user_id, client_request_id),
  check (final_digits = '' or length(final_digits) = 4)
);

create unique index if not exists credit_cards_user_nickname_idx
  on credit_cards (clerk_user_id, lower(nickname))
  where is_archived = 0;

create index if not exists credit_cards_user_active_idx
  on credit_cards (clerk_user_id, is_archived, created_at desc);

create table if not exists transactions (
  id text primary key,
  clerk_user_id text not null,
  client_request_id text not null,
  account_id text not null references accounts(id),
  title text not null,
  category text not null,
  category_id text references transaction_categories(id),
  kind text not null check (kind in ('income', 'expense')),
  status text not null check (status in ('compensated', 'pending', 'scheduled')),
  source_type text not null default 'manual' check (source_type in ('manual', 'credit_card_invoice')),
  credit_card_id text references credit_cards(id),
  invoice_month text,
  series_id text,
  is_fixed integer not null default 0,
  fixed_expense_frequency text
    check (
      fixed_expense_frequency is null
      or fixed_expense_frequency in ('daily', 'weekly', 'fortnightly', 'monthly', 'yearly')
    ),
  installment_number integer,
  installment_total integer,
  amount_cents integer not null check (amount_cents > 0),
  settled_amount_cents integer check (settled_amount_cents is null or settled_amount_cents > 0),
  occurred_on text not null,
  notes text,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  unique (clerk_user_id, client_request_id),
  check (
    (installment_number is null and installment_total is null)
    or (
      installment_number is not null
      and installment_total is not null
      and installment_number >= 1
      and installment_total >= 1
      and installment_number <= installment_total
    )
  ),
  check (
    not (
      is_fixed = 1
      and installment_total is not null
    )
  )
);

create index if not exists transactions_user_occurred_idx
  on transactions (clerk_user_id, occurred_on desc, created_at desc);

create index if not exists transactions_user_account_idx
  on transactions (clerk_user_id, account_id, occurred_on desc);

create index if not exists transactions_user_series_occurred_idx
  on transactions (clerk_user_id, series_id, occurred_on desc);

create index if not exists transactions_category_idx
  on transactions (clerk_user_id, category_id);

create unique index if not exists transactions_credit_card_invoice_idx
  on transactions (clerk_user_id, source_type, credit_card_id, invoice_month);

create table if not exists credit_card_expenses (
  id text primary key,
  clerk_user_id text not null,
  client_request_id text not null,
  card_id text not null references credit_cards(id),
  invoice_transaction_id text not null references transactions(id),
  series_id text,
  title text not null,
  category text not null,
  category_id text references transaction_categories(id),
  amount_cents integer not null check (amount_cents != 0),
  occurred_on text not null,
  is_effective integer not null default 1,
  notes text,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  unique (clerk_user_id, client_request_id)
);

create index if not exists credit_card_expenses_user_card_occurred_idx
  on credit_card_expenses (clerk_user_id, card_id, occurred_on desc, created_at desc);

create index if not exists credit_card_expenses_invoice_idx
  on credit_card_expenses (invoice_transaction_id, occurred_on desc);

create index if not exists credit_card_expenses_user_series_occurred_idx
  on credit_card_expenses (clerk_user_id, series_id, occurred_on desc);

create index if not exists credit_card_expenses_category_idx
  on credit_card_expenses (clerk_user_id, category_id);

create index if not exists credit_card_expenses_user_card_effective_idx
  on credit_card_expenses (clerk_user_id, card_id, is_effective, occurred_on desc);

create table if not exists salaries (
  id text primary key,
  clerk_user_id text not null,
  amount_cents integer not null,
  day_of_month integer not null check (day_of_month between 1 and 31),
  account_id text not null references accounts(id),
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create unique index if not exists salaries_user_idx
  on salaries (clerk_user_id);

create table if not exists salary_deductions (
  id text primary key,
  salary_id text not null references salaries(id),
  description text not null,
  amount_cents integer not null,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create index if not exists salary_deductions_salary_idx
  on salary_deductions (salary_id);

create table if not exists salary_exclusions (
  clerk_user_id text not null,
  month_year text not null, -- format: YYYY-MM
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  primary key (clerk_user_id, month_year)
);
