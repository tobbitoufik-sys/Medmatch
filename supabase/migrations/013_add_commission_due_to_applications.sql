alter table public.applications
  add column if not exists commission_due boolean not null default false;
