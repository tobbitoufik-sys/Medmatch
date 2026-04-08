create table if not exists public.doctor_gmail_connections (
  id uuid primary key default gen_random_uuid(),
  doctor_user_id uuid not null unique references public.users(id) on delete cascade,
  provider text not null default 'google',
  access_token text not null,
  refresh_token text,
  token_type text,
  scope text,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint doctor_gmail_connections_provider_check check (provider = 'google')
);

create index if not exists doctor_gmail_connections_doctor_user_id_idx
  on public.doctor_gmail_connections (doctor_user_id);

drop trigger if exists set_doctor_gmail_connections_updated_at on public.doctor_gmail_connections;
create trigger set_doctor_gmail_connections_updated_at before update on public.doctor_gmail_connections
for each row execute function public.set_updated_at();

alter table public.doctor_gmail_connections enable row level security;

drop policy if exists "Doctors read own Gmail connections" on public.doctor_gmail_connections;
create policy "Doctors read own Gmail connections"
on public.doctor_gmail_connections for select
to authenticated
using (doctor_user_id = auth.uid());

drop policy if exists "Doctors manage own Gmail connections" on public.doctor_gmail_connections;
create policy "Doctors manage own Gmail connections"
on public.doctor_gmail_connections for all
to authenticated
using (doctor_user_id = auth.uid())
with check (doctor_user_id = auth.uid());
