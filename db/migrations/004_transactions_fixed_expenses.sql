alter table transactions
  add column if not exists is_fixed boolean not null default false;
