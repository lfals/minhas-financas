create extension if not exists pgcrypto;

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  client_request_id uuid not null,
  name text not null,
  type text not null check (type in ('checking', 'savings', 'cash', 'investment')),
  currency_code text not null default 'BRL',
  initial_balance_cents bigint not null check (initial_balance_cents >= 0),
  current_balance_cents bigint not null check (current_balance_cents >= 0),
  include_in_net_worth boolean not null default true,
  is_archived boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clerk_user_id, client_request_id)
);

create unique index if not exists accounts_user_name_idx
  on accounts (clerk_user_id, lower(name));

create index if not exists accounts_user_active_idx
  on accounts (clerk_user_id, is_archived, display_order, created_at desc);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  actor_type text not null,
  action text not null,
  entity text not null,
  entity_id uuid not null,
  before jsonb,
  after jsonb,
  request_id text,
  idempotency_key uuid,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_user_entity_idx
  on audit_log (clerk_user_id, entity, created_at desc);
