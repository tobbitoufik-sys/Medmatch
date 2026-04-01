do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'doctor_current_position'
      and n.nspname = 'public'
  ) then
    create type public.doctor_current_position as enum (
      'Assistenzarzt',
      'Facharzt',
      'Oberarzt',
      'Leitender Oberarzt',
      'Chefarzt'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'doctor_license_type'
      and n.nspname = 'public'
  ) then
    create type public.doctor_license_type as enum (
      'approbation',
      'berufserlaubnis'
    );
  end if;
end
$$;

alter table public.doctor_profiles
  add column if not exists license_type public.doctor_license_type,
  add column if not exists license_since date,
  add column if not exists current_position public.doctor_current_position,
  add column if not exists education_university text not null default '',
  add column if not exists education_country text not null default 'Germany';

create table if not exists public.doctor_experiences (
  id uuid primary key default gen_random_uuid(),
  doctor_profile_id uuid not null references public.doctor_profiles(id) on delete cascade,
  title text not null default '',
  institution text not null default '',
  from_date date,
  to_date date,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists doctor_experiences_profile_sort_idx
  on public.doctor_experiences (doctor_profile_id, sort_order);

drop trigger if exists set_doctor_experiences_updated_at on public.doctor_experiences;
create trigger set_doctor_experiences_updated_at before update on public.doctor_experiences
for each row execute function public.set_updated_at();

alter table public.doctor_experiences enable row level security;

create policy "Doctors read own experiences"
on public.doctor_experiences for select
using (
  doctor_profile_id in (
    select id from public.doctor_profiles where user_id = auth.uid()
  )
  or public.current_user_role() = 'admin'
);

create policy "Doctors manage own experiences"
on public.doctor_experiences for all
using (
  doctor_profile_id in (
    select id from public.doctor_profiles where user_id = auth.uid()
  )
  or public.current_user_role() = 'admin'
)
with check (
  doctor_profile_id in (
    select id from public.doctor_profiles where user_id = auth.uid()
  )
  or public.current_user_role() = 'admin'
);
