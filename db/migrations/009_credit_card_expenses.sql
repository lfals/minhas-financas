create table if not exists credit_card_expenses (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  client_request_id uuid not null,
  card_id uuid not null references credit_cards(id),
  invoice_transaction_id uuid not null references transactions(id),
  title text not null,
  category text not null,
  amount_cents bigint not null check (amount_cents > 0),
  occurred_on date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clerk_user_id, client_request_id)
);

create index if not exists credit_card_expenses_user_card_occurred_idx
  on credit_card_expenses (clerk_user_id, card_id, occurred_on desc, created_at desc);

create index if not exists credit_card_expenses_invoice_idx
  on credit_card_expenses (invoice_transaction_id, occurred_on desc);

alter table transactions
  add column if not exists source_type text not null default 'manual'
  check (source_type in ('manual', 'credit_card_invoice'));

alter table transactions
  add column if not exists credit_card_id uuid references credit_cards(id);

alter table transactions
  add column if not exists invoice_month date;

create unique index if not exists transactions_credit_card_invoice_idx
  on transactions (clerk_user_id, source_type, credit_card_id, invoice_month);
