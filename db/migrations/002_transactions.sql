create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  client_request_id uuid not null,
  account_id uuid not null references accounts(id),
  title text not null,
  category text not null,
  kind text not null check (kind in ('income', 'expense')),
  status text not null check (status in ('compensated', 'pending', 'scheduled')),
  amount_cents bigint not null check (amount_cents > 0),
  occurred_on date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clerk_user_id, client_request_id)
);

create index if not exists transactions_user_occurred_idx
  on transactions (clerk_user_id, occurred_on desc, created_at desc);

create index if not exists transactions_user_account_idx
  on transactions (clerk_user_id, account_id, occurred_on desc);
