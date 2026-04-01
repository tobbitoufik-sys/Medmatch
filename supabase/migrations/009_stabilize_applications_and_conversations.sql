alter table public.applications enable row level security;
alter table public.application_conversations enable row level security;
alter table public.application_messages enable row level security;

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

drop policy if exists "Application participants create conversations" on public.application_conversations;
create policy "Application participants create conversations"
on public.application_conversations for insert
to authenticated
with check (
  exists (
    select 1
    from public.applications
    join public.facility_profiles
      on facility_profiles.id = applications.facility_id
    where applications.id = application_conversations.application_id
      and application_conversations.doctor_user_id = applications.doctor_user_id
      and application_conversations.facility_user_id = facility_profiles.user_id
      and (
        applications.doctor_user_id = auth.uid()
        or facility_profiles.user_id = auth.uid()
      )
  )
);

create index if not exists applications_facility_id_created_at_idx
  on public.applications (facility_id, created_at desc);

create index if not exists applications_doctor_user_id_created_at_idx
  on public.applications (doctor_user_id, created_at desc);

create index if not exists applications_offer_id_idx
  on public.applications (offer_id);

create index if not exists job_offers_status_created_at_idx
  on public.job_offers (status, created_at desc);

create index if not exists job_offers_facility_id_created_at_idx
  on public.job_offers (facility_id, created_at desc);

create index if not exists application_messages_conversation_id_created_at_idx
  on public.application_messages (conversation_id, created_at);

create index if not exists contact_requests_sender_user_id_created_at_idx
  on public.contact_requests (sender_user_id, created_at desc);

create index if not exists contact_requests_receiver_user_id_created_at_idx
  on public.contact_requests (receiver_user_id, created_at desc);
