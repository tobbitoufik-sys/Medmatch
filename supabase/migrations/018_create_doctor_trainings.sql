create table if not exists public.doctor_trainings (
  id uuid primary key default gen_random_uuid(),
  doctor_profile_id uuid not null references public.doctor_profiles(id) on delete cascade,
  training_name text not null default '',
  institution text not null default '',
  from_date date,
  to_date date,
  certificate_name text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists doctor_trainings_doctor_profile_id_idx
  on public.doctor_trainings (doctor_profile_id);

create index if not exists doctor_trainings_doctor_profile_id_sort_order_idx
  on public.doctor_trainings (doctor_profile_id, sort_order);

drop trigger if exists set_doctor_trainings_updated_at on public.doctor_trainings;
create trigger set_doctor_trainings_updated_at before update on public.doctor_trainings
for each row execute function public.set_updated_at();

alter table public.doctor_trainings enable row level security;

drop policy if exists "Doctors read own trainings" on public.doctor_trainings;
create policy "Doctors read own trainings"
on public.doctor_trainings for select
to authenticated
using (
  doctor_profile_id in (
    select id
    from public.doctor_profiles
    where user_id = auth.uid()
  )
);

drop policy if exists "Doctors manage own trainings" on public.doctor_trainings;
create policy "Doctors manage own trainings"
on public.doctor_trainings for all
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
