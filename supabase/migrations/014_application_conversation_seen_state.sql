alter table public.application_conversations
  add column if not exists doctor_last_seen_at timestamptz,
  add column if not exists facility_last_seen_at timestamptz;

alter table public.application_conversations enable row level security;

drop policy if exists "Application participants update conversations" on public.application_conversations;
create policy "Application participants update conversations"
on public.application_conversations for update
to authenticated
using (
  doctor_user_id = auth.uid()
  or facility_user_id = auth.uid()
)
with check (
  doctor_user_id = auth.uid()
  or facility_user_id = auth.uid()
);
