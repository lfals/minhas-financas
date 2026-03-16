alter table credit_card_expenses
  add column if not exists series_id uuid;

create index if not exists credit_card_expenses_user_series_occurred_idx
  on credit_card_expenses (clerk_user_id, series_id, occurred_on desc);
