alter table credit_card_expenses
  add column if not exists is_effective boolean not null default true;

create index if not exists credit_card_expenses_user_card_effective_idx
  on credit_card_expenses (clerk_user_id, card_id, is_effective, occurred_on desc);
