create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  doctor_user_id uuid not null references public.users(id) on delete cascade,
  offer_id uuid not null references public.job_offers(id) on delete cascade,
  facility_id uuid not null references public.facility_profiles(id) on delete cascade,
  message text not null,
  status text not null default 'submitted' check (status in ('submitted', 'reviewed', 'accepted', 'rejected')),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.applications enable row level security;

create policy "Doctors create own applications"
on public.applications for insert
to authenticated
with check (doctor_user_id = auth.uid());

create policy "Doctors read own applications"
on public.applications for select
to authenticated
using (doctor_user_id = auth.uid());

create policy "Facilities read applications for own offers"
on public.applications for select
to authenticated
using (
  facility_id in (
    select id from public.facility_profiles where user_id = auth.uid()
  )
  or public.current_user_role() = 'admin'
);
