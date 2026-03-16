alter table transactions
  add column if not exists series_id uuid;

create index if not exists transactions_user_series_occurred_idx
  on transactions (clerk_user_id, series_id, occurred_on desc);
