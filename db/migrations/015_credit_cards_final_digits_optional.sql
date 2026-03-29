alter table credit_cards
  drop constraint if exists credit_cards_final_digits_check;

alter table credit_cards
  add constraint credit_cards_final_digits_check
  check (final_digits = '' or final_digits ~ '^[0-9]{4}$');
