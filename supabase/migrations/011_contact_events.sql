create table if not exists public.contact_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  facility_user_id uuid not null references public.users(id) on delete cascade,
  doctor_user_id uuid not null references public.users(id) on delete cascade,
  contract_type text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.contact_events enable row level security;

drop policy if exists "Facilities insert contact events for own applications" on public.contact_events;
create policy "Facilities insert contact events for own applications"
on public.contact_events for insert
to authenticated
with check (
  facility_user_id = auth.uid()
  and exists (
    select 1
    from public.applications
    join public.facility_profiles
      on facility_profiles.id = applications.facility_id
    where applications.id = contact_events.application_id
      and applications.doctor_user_id = contact_events.doctor_user_id
      and facility_profiles.user_id = auth.uid()
  )
);

create index if not exists contact_events_application_id_created_at_idx
  on public.contact_events (application_id, created_at desc);
