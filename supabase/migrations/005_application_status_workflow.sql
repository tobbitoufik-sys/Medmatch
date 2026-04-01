update public.applications
set status = 'in_review'
where status = 'reviewed';

alter table public.applications
drop constraint if exists applications_status_check;

alter table public.applications
add constraint applications_status_check
check (status in ('submitted', 'received', 'in_review', 'contacted', 'accepted', 'rejected'));

drop policy if exists "Facilities update own applications" on public.applications;

create policy "Facilities update own applications"
on public.applications for update
to authenticated
using (
  facility_id in (
    select id from public.facility_profiles where user_id = auth.uid()
  )
  or public.current_user_role() = 'admin'
)
with check (
  facility_id in (
    select id from public.facility_profiles where user_id = auth.uid()
  )
  or public.current_user_role() = 'admin'
);
