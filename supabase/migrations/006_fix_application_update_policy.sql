alter table public.applications enable row level security;

drop policy if exists "Facilities update own applications" on public.applications;

create policy "Facilities update own applications"
on public.applications for update
to authenticated
using (
  exists (
    select 1
    from public.facility_profiles
    where facility_profiles.id = applications.facility_id
      and facility_profiles.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.facility_profiles
    where facility_profiles.id = applications.facility_id
      and facility_profiles.user_id = auth.uid()
  )
);
