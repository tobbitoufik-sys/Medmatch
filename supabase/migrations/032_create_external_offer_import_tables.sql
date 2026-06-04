create table if not exists public.external_offer_import_runs (
  id uuid primary key default gen_random_uuid(),
  source_url text not null,
  source_name text,
  import_status text not null default 'pending',
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint external_offer_import_runs_status_check
    check (import_status in ('pending', 'succeeded', 'failed'))
);

create table if not exists public.external_offer_import_items (
  id uuid primary key default gen_random_uuid(),
  import_run_id uuid not null references public.external_offer_import_runs(id) on delete cascade,
  source_url text not null,
  source_name text,
  raw_html text,
  raw_text text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists external_offer_import_runs_updated_at_idx
  on public.external_offer_import_runs (updated_at desc);

create index if not exists external_offer_import_items_run_id_idx
  on public.external_offer_import_items (import_run_id);

drop trigger if exists set_external_offer_import_runs_updated_at on public.external_offer_import_runs;
create trigger set_external_offer_import_runs_updated_at
before update on public.external_offer_import_runs
for each row
execute function public.set_updated_at();

drop trigger if exists set_external_offer_import_items_updated_at on public.external_offer_import_items;
create trigger set_external_offer_import_items_updated_at
before update on public.external_offer_import_items
for each row
execute function public.set_updated_at();

alter table public.external_offer_import_runs enable row level security;
alter table public.external_offer_import_items enable row level security;

drop policy if exists "Admins manage external offer import runs" on public.external_offer_import_runs;
create policy "Admins manage external offer import runs"
on public.external_offer_import_runs
for all
using (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.role = 'admin'
  )
);

drop policy if exists "Admins manage external offer import items" on public.external_offer_import_items;
create policy "Admins manage external offer import items"
on public.external_offer_import_items
for all
using (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.role = 'admin'
  )
);
