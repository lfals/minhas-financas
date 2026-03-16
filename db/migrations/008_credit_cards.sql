create table if not exists credit_cards (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  client_request_id uuid not null,
  nickname text not null,
  final_digits text not null check (final_digits ~ '^[0-9]{4}$'),
  limit_cents bigint not null check (limit_cents >= 0),
  closing_day integer not null check (closing_day between 1 and 31),
  due_day integer not null check (due_day between 1 and 31),
  expense_account_id uuid not null references accounts(id),
  auto_categorization_enabled boolean not null default true,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clerk_user_id, client_request_id)
);

create unique index if not exists credit_cards_user_nickname_idx
  on credit_cards (clerk_user_id, lower(nickname))
  where is_archived = false;

create index if not exists credit_cards_user_active_idx
  on credit_cards (clerk_user_id, is_archived, created_at desc);
