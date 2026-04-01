create table if not exists public.doctor_cv_layouts (
  id uuid primary key default gen_random_uuid(),
  doctor_profile_id uuid not null references public.doctor_profiles(id) on delete cascade,
  template_key text not null default 'modern',
  section_order jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint doctor_cv_layouts_doctor_profile_template_key_key unique (doctor_profile_id, template_key)
);

create index if not exists doctor_cv_layouts_doctor_profile_id_idx
  on public.doctor_cv_layouts (doctor_profile_id);

drop trigger if exists set_doctor_cv_layouts_updated_at on public.doctor_cv_layouts;
create trigger set_doctor_cv_layouts_updated_at before update on public.doctor_cv_layouts
for each row execute function public.set_updated_at();

alter table public.doctor_cv_layouts enable row level security;

drop policy if exists "Doctors read own CV layouts" on public.doctor_cv_layouts;
create policy "Doctors read own CV layouts"
on public.doctor_cv_layouts for select
to authenticated
using (
  doctor_profile_id in (
    select id
    from public.doctor_profiles
    where user_id = auth.uid()
  )
);

drop policy if exists "Doctors manage own CV layouts" on public.doctor_cv_layouts;
create policy "Doctors manage own CV layouts"
on public.doctor_cv_layouts for all
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
