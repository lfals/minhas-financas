alter table accounts
  drop constraint if exists accounts_initial_balance_cents_check;

alter table accounts
  drop constraint if exists accounts_current_balance_cents_check;
