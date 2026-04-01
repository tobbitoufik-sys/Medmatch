alter table public.applications enable row level security;

drop policy if exists "Facilities read applications for own offers" on public.applications;

create policy "Facilities read applications for own offers"
on public.applications for select
to authenticated
using (
  exists (
    select 1
    from public.facility_profiles
    where facility_profiles.id = applications.facility_id
      and facility_profiles.user_id = auth.uid()
  )
);
