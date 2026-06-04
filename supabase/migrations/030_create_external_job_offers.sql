create table if not exists public.external_job_offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  hospital_name text not null,
  location text,
  source_name text,
  source_url text,
  external_offer_id text,
  specialty text,
  contract_type text check (contract_type in ('honorar', 'befristet', 'unbefristet')),
  summary text,
  is_active boolean not null default true,
  imported_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists external_job_offers_source_identity_idx
  on public.external_job_offers (source_name, external_offer_id)
  where source_name is not null and external_offer_id is not null;

create index if not exists external_job_offers_is_active_idx
  on public.external_job_offers (is_active);

create index if not exists external_job_offers_updated_at_idx
  on public.external_job_offers (updated_at desc);

drop trigger if exists set_external_job_offers_updated_at on public.external_job_offers;
create trigger set_external_job_offers_updated_at before update on public.external_job_offers
for each row execute function public.set_updated_at();

alter table public.external_job_offers enable row level security;

drop policy if exists "Doctors read active external job offers" on public.external_job_offers;
create policy "Doctors read active external job offers"
on public.external_job_offers for select
using (is_active = true or public.current_user_role() = 'admin');

drop policy if exists "Admins manage external job offers" on public.external_job_offers;
create policy "Admins manage external job offers"
on public.external_job_offers for all
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');
