create table if not exists public.doctor_additional_sections (
  id uuid primary key default gen_random_uuid(),
  doctor_profile_id uuid not null references public.doctor_profiles(id) on delete cascade,
  section_title text not null default '',
  bullet_1 text not null default '',
  bullet_2 text not null default '',
  bullet_3 text not null default '',
  bullet_4 text not null default '',
  bullet_5 text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists doctor_additional_sections_doctor_profile_id_idx
  on public.doctor_additional_sections (doctor_profile_id);

create index if not exists doctor_additional_sections_doctor_profile_id_sort_order_idx
  on public.doctor_additional_sections (doctor_profile_id, sort_order);

drop trigger if exists set_doctor_additional_sections_updated_at on public.doctor_additional_sections;
create trigger set_doctor_additional_sections_updated_at before update on public.doctor_additional_sections
for each row execute function public.set_updated_at();

alter table public.doctor_additional_sections enable row level security;

drop policy if exists "Doctors read own additional sections" on public.doctor_additional_sections;
create policy "Doctors read own additional sections"
on public.doctor_additional_sections for select
to authenticated
using (
  doctor_profile_id in (
    select id
    from public.doctor_profiles
    where user_id = auth.uid()
  )
);

drop policy if exists "Doctors manage own additional sections" on public.doctor_additional_sections;
create policy "Doctors manage own additional sections"
on public.doctor_additional_sections for all
to authenticated
using (
  doctor_profile_id in (
    select id
    from public.doctor_profiles
    where user_id = auth.uid()
  )
)
with check (
  doctor_profile_id in (
    select id
    from public.doctor_profiles
    where user_id = auth.uid()
  )
);
