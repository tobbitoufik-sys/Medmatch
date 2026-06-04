create table if not exists public.external_source_offer_memory (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  offer_url text not null,
  external_offer_id text,
  title text,
  hospital_name text,
  first_seen_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint external_source_offer_memory_source_url_key unique (source_name, offer_url)
);

create table if not exists public.external_source_scan_runs (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  listing_url text not null,
  scanned_count integer not null default 0,
  new_count integer not null default 0,
  known_count integer not null default 0,
  new_offers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists external_source_offer_memory_source_name_idx
  on public.external_source_offer_memory (source_name);

create index if not exists external_source_offer_memory_last_seen_at_idx
  on public.external_source_offer_memory (last_seen_at desc);

create index if not exists external_source_scan_runs_source_name_idx
  on public.external_source_scan_runs (source_name);

create index if not exists external_source_scan_runs_created_at_idx
  on public.external_source_scan_runs (created_at desc);

drop trigger if exists set_external_source_offer_memory_updated_at on public.external_source_offer_memory;
create trigger set_external_source_offer_memory_updated_at
before update on public.external_source_offer_memory
for each row
execute function public.set_updated_at();

drop trigger if exists set_external_source_scan_runs_updated_at on public.external_source_scan_runs;
create trigger set_external_source_scan_runs_updated_at
before update on public.external_source_scan_runs
for each row
execute function public.set_updated_at();

alter table public.external_source_offer_memory enable row level security;
alter table public.external_source_scan_runs enable row level security;

drop policy if exists "Admins manage external source offer memory" on public.external_source_offer_memory;
create policy "Admins manage external source offer memory"
on public.external_source_offer_memory
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

drop policy if exists "Admins manage external source scan runs" on public.external_source_scan_runs;
create policy "Admins manage external source scan runs"
on public.external_source_scan_runs
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
