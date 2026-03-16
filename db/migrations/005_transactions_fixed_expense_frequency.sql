alter table transactions
  add column if not exists fixed_expense_frequency text;

alter table transactions
  drop constraint if exists transactions_fixed_expense_frequency_check;

alter table transactions
  add constraint transactions_fixed_expense_frequency_check
  check (
    fixed_expense_frequency is null
    or fixed_expense_frequency in ('daily', 'weekly', 'fortnightly', 'monthly', 'yearly')
  );
