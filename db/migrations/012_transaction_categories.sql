create table if not exists transaction_categories (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists transaction_categories_user_name_idx
  on transaction_categories (clerk_user_id, lower(trim(name)));

alter table transactions
  add column if not exists category_id uuid references transaction_categories(id);

alter table credit_card_expenses
  add column if not exists category_id uuid references transaction_categories(id);

create index if not exists transactions_category_idx
  on transactions (clerk_user_id, category_id);

create index if not exists credit_card_expenses_category_idx
  on credit_card_expenses (clerk_user_id, category_id);

insert into transaction_categories (clerk_user_id, name)
select distinct
  t.clerk_user_id,
  t.category
from transactions t
where t.category is not null
  and trim(t.category) <> ''
  and not exists (
    select 1
    from transaction_categories c
    where c.clerk_user_id = t.clerk_user_id
      and lower(trim(c.name)) = lower(trim(t.category))
  );

update transactions t
set category_id = c.id
from transaction_categories c
where t.category_id is null
  and c.clerk_user_id = t.clerk_user_id
  and lower(trim(c.name)) = lower(trim(t.category));

insert into transaction_categories (clerk_user_id, name)
select distinct
  e.clerk_user_id,
  e.category
from credit_card_expenses e
where e.category is not null
  and trim(e.category) <> ''
  and not exists (
    select 1
    from transaction_categories c
    where c.clerk_user_id = e.clerk_user_id
      and lower(trim(c.name)) = lower(trim(e.category))
  );

update credit_card_expenses e
set category_id = c.id
from transaction_categories c
where e.category_id is null
  and c.clerk_user_id = e.clerk_user_id
  and lower(trim(c.name)) = lower(trim(e.category));
