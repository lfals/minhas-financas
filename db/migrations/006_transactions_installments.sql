alter table transactions
  add column if not exists installment_number integer,
  add column if not exists installment_total integer;

alter table transactions
  drop constraint if exists transactions_installments_check;

alter table transactions
  add constraint transactions_installments_check
  check (
    (installment_number is null and installment_total is null)
    or (
      installment_number is not null
      and installment_total is not null
      and installment_number >= 1
      and installment_total >= 1
      and installment_number <= installment_total
    )
  );

alter table transactions
  drop constraint if exists transactions_fixed_or_installment_check;

alter table transactions
  add constraint transactions_fixed_or_installment_check
  check (
    not (
      is_fixed = true
      and installment_total is not null
    )
  );
