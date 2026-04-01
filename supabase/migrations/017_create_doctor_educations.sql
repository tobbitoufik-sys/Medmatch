create table if not exists public.doctor_educations (
  id uuid primary key default gen_random_uuid(),
  doctor_profile_id uuid not null references public.doctor_profiles(id) on delete cascade,
  education_university text not null default '',
  degree_name text not null default '',
  from_date date,
  to_date date,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists doctor_educations_doctor_profile_id_sort_order_idx
  on public.doctor_educations (doctor_profile_id, sort_order);

drop trigger if exists set_doctor_educations_updated_at on public.doctor_educations;
create trigger set_doctor_educations_updated_at before update on public.doctor_educations
for each row execute function public.set_updated_at();

alter table public.doctor_educations enable row level security;

create policy "Doctors read own educations"
on public.doctor_educations for select
using (
  doctor_profile_id in (
    select id from public.doctor_profiles where user_id = auth.uid()
  )
  or public.current_user_role() = 'admin'
);

create policy "Doctors manage own educations"
on public.doctor_educations for all
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
