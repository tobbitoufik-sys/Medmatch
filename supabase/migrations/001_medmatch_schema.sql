create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role text not null check (role in ('doctor', 'facility', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.doctor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  title text not null,
  specialty text not null,
  sub_specialty text not null default '',
  city text not null,
  country text not null,
  languages text[] not null default '{}',
  years_experience integer not null default 0,
  availability text not null,
  contract_type text not null,
  bio text not null,
  is_public boolean not null default true,
  profile_completion integer not null default 0,
  verified boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.facility_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  facility_name text not null,
  facility_type text not null,
  city text not null,
  country text not null,
  website text,
  description text not null,
  contact_person_name text not null,
  verified boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.job_offers (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facility_profiles(id) on delete cascade,
  title text not null,
  specialty text not null,
  city text not null,
  country text not null,
  contract_type text not null,
  description text not null,
  requirements text not null,
  salary_range_optional text,
  status text not null default 'draft' check (status in ('draft', 'published', 'paused')),
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid not null references public.users(id) on delete cascade,
  receiver_user_id uuid not null references public.users(id) on delete cascade,
  related_offer_id uuid references public.job_offers(id) on delete set null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'reviewed', 'accepted', 'closed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,
  target_id uuid not null,
  note text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  document_type text not null,
  file_name text not null,
  file_path text,
  status text not null default 'pending' check (status in ('pending', 'uploaded', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.calculate_profile_completion()
returns trigger
language plpgsql
as $$
declare
  total_fields integer := 10;
  score integer := 0;
begin
  if new.first_name <> '' then score := score + 1; end if;
  if new.last_name <> '' then score := score + 1; end if;
  if new.title <> '' then score := score + 1; end if;
  if new.specialty <> '' then score := score + 1; end if;
  if new.city <> '' then score := score + 1; end if;
  if new.country <> '' then score := score + 1; end if;
  if array_length(new.languages, 1) > 0 then score := score + 1; end if;
  if new.availability <> '' then score := score + 1; end if;
  if new.contract_type <> '' then score := score + 1; end if;
  if new.bio <> '' then score := score + 1; end if;

  new.profile_completion := round((score::numeric / total_fields) * 100);
  return new;
end;
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
as $$
  select role from public.users where id = auth.uid()
$$;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists set_doctor_profiles_updated_at on public.doctor_profiles;
create trigger set_doctor_profiles_updated_at before update on public.doctor_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_facility_profiles_updated_at on public.facility_profiles;
create trigger set_facility_profiles_updated_at before update on public.facility_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_job_offers_updated_at on public.job_offers;
create trigger set_job_offers_updated_at before update on public.job_offers
for each row execute function public.set_updated_at();

drop trigger if exists set_contact_requests_updated_at on public.contact_requests;
create trigger set_contact_requests_updated_at before update on public.contact_requests
for each row execute function public.set_updated_at();

drop trigger if exists set_admin_notes_updated_at on public.admin_notes;
create trigger set_admin_notes_updated_at before update on public.admin_notes
for each row execute function public.set_updated_at();

drop trigger if exists set_documents_updated_at on public.documents;
create trigger set_documents_updated_at before update on public.documents
for each row execute function public.set_updated_at();

drop trigger if exists calculate_profile_completion_trigger on public.doctor_profiles;
create trigger calculate_profile_completion_trigger
before insert or update on public.doctor_profiles
for each row execute function public.calculate_profile_completion();

alter table public.users enable row level security;
alter table public.doctor_profiles enable row level security;
alter table public.facility_profiles enable row level security;
alter table public.job_offers enable row level security;
alter table public.contact_requests enable row level security;
alter table public.admin_notes enable row level security;
alter table public.documents enable row level security;

create policy "Users can read own account"
on public.users for select
using (auth.uid() = id or public.current_user_role() = 'admin');

create policy "Users can insert own account"
on public.users for insert
with check (auth.uid() = id);

create policy "Admin manages users"
on public.users for all
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "Doctors can read public profiles"
on public.doctor_profiles for select
using (is_public = true or user_id = auth.uid() or public.current_user_role() = 'admin');

create policy "Doctors manage own profile"
on public.doctor_profiles for all
using (user_id = auth.uid() or public.current_user_role() = 'admin')
with check (user_id = auth.uid() or public.current_user_role() = 'admin');

create policy "Facilities read profiles"
on public.facility_profiles for select
using (true);

create policy "Facilities manage own profile"
on public.facility_profiles for all
using (user_id = auth.uid() or public.current_user_role() = 'admin')
with check (user_id = auth.uid() or public.current_user_role() = 'admin');

create policy "Published offers are public"
on public.job_offers for select
using (
  status = 'published'
  or facility_id in (
    select id from public.facility_profiles where user_id = auth.uid()
  )
  or public.current_user_role() = 'admin'
);

create policy "Facilities manage own offers"
on public.job_offers for all
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

create policy "Users can read relevant contact requests"
on public.contact_requests for select
using (
  sender_user_id = auth.uid()
  or receiver_user_id = auth.uid()
  or public.current_user_role() = 'admin'
);

create policy "Authenticated users create contact requests"
on public.contact_requests for insert
with check (sender_user_id = auth.uid());

create policy "Admin manages admin notes"
on public.admin_notes for all
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "Users manage own documents"
on public.documents for all
using (user_id = auth.uid() or public.current_user_role() = 'admin')
with check (user_id = auth.uid() or public.current_user_role() = 'admin');
