drop index if exists accounts_user_name_institution_idx;

alter table accounts
  drop column if exists institution;

create unique index if not exists accounts_user_name_idx
  on accounts (clerk_user_id, lower(name));
