create table if not exists public.external_offer_refinement_queue (
  id uuid primary key default gen_random_uuid(),
  import_run_id uuid not null references public.external_offer_import_runs(id) on delete cascade,
  import_item_id uuid not null unique references public.external_offer_import_items(id) on delete cascade,
  source_url text not null,
  source_name text,
  refinement_status text not null default 'pending',
  error_message text,
  raw_text_snapshot text,
  title text,
  hospital_name text,
  location text,
  clinic_address text,
  contact_person text,
  salutation text not null default 'unbekannt',
  contact_email text,
  specialty text,
  contract_type text,
  summary text,
  external_offer_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint external_offer_refinement_queue_status_check
    check (refinement_status in ('pending', 'succeeded', 'failed')),
  constraint external_offer_refinement_queue_salutation_check
    check (salutation in ('herr', 'frau', 'unbekannt')),
  constraint external_offer_refinement_queue_contract_type_check
    check (contract_type in ('honorar', 'befristet', 'unbefristet') or contract_type is null)
);

create index if not exists external_offer_refinement_queue_updated_at_idx
  on public.external_offer_refinement_queue (updated_at desc);

create index if not exists external_offer_refinement_queue_status_idx
  on public.external_offer_refinement_queue (refinement_status);

drop trigger if exists set_external_offer_refinement_queue_updated_at on public.external_offer_refinement_queue;
create trigger set_external_offer_refinement_queue_updated_at
before update on public.external_offer_refinement_queue
for each row
execute function public.set_updated_at();

alter table public.external_offer_refinement_queue enable row level security;

drop policy if exists "Admins manage external offer refinement queue" on public.external_offer_refinement_queue;
create policy "Admins manage external offer refinement queue"
on public.external_offer_refinement_queue
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
