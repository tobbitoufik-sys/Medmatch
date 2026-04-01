create table if not exists public.application_conversations (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete cascade,
  doctor_user_id uuid not null references public.users(id) on delete cascade,
  facility_user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.application_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.application_conversations(id) on delete cascade,
  sender_user_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.application_conversations enable row level security;
alter table public.application_messages enable row level security;

drop policy if exists "Application participants read conversations" on public.application_conversations;
create policy "Application participants read conversations"
on public.application_conversations for select
to authenticated
using (
  doctor_user_id = auth.uid()
  or facility_user_id = auth.uid()
);

drop policy if exists "Application participants create conversations" on public.application_conversations;
create policy "Application participants create conversations"
on public.application_conversations for insert
to authenticated
with check (
  doctor_user_id = auth.uid()
  or facility_user_id = auth.uid()
);

drop policy if exists "Application participants read messages" on public.application_messages;
create policy "Application participants read messages"
on public.application_messages for select
to authenticated
using (
  exists (
    select 1
    from public.application_conversations
    where application_conversations.id = application_messages.conversation_id
      and (
        application_conversations.doctor_user_id = auth.uid()
        or application_conversations.facility_user_id = auth.uid()
      )
  )
);

drop policy if exists "Application participants create messages" on public.application_messages;
create policy "Application participants create messages"
on public.application_messages for insert
to authenticated
with check (
  sender_user_id = auth.uid()
  and exists (
    select 1
    from public.application_conversations
    where application_conversations.id = application_messages.conversation_id
      and (
        application_conversations.doctor_user_id = auth.uid()
        or application_conversations.facility_user_id = auth.uid()
      )
  )
);
