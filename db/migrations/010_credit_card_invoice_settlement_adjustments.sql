alter table credit_card_expenses
  drop constraint if exists credit_card_expenses_amount_cents_check;

alter table credit_card_expenses
  add constraint credit_card_expenses_amount_cents_check
  check (amount_cents != 0);
