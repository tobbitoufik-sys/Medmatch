create table if not exists public.doctor_languages (
  id uuid primary key default gen_random_uuid(),
  doctor_profile_id uuid not null references public.doctor_profiles(id) on delete cascade,
  language_name text not null,
  level_cefr text not null check (level_cefr in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  level_label text not null check (
    level_label in (
      'Anfänger',
      'Grundkenntnisse',
      'Gute Kenntnisse',
      'Fließend',
      'Verhandlungssicher',
      'Muttersprache'
    )
  ),
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint doctor_languages_doctor_profile_id_language_name_key unique (doctor_profile_id, language_name)
);

create index if not exists doctor_languages_doctor_profile_id_sort_order_idx
  on public.doctor_languages (doctor_profile_id, sort_order);

create index if not exists doctor_languages_language_name_level_cefr_idx
  on public.doctor_languages (language_name, level_cefr);

drop trigger if exists set_doctor_languages_updated_at on public.doctor_languages;
create trigger set_doctor_languages_updated_at before update on public.doctor_languages
for each row execute function public.set_updated_at();

alter table public.doctor_languages enable row level security;

drop policy if exists "Doctors read own languages" on public.doctor_languages;
create policy "Doctors read own languages"
on public.doctor_languages for select
to authenticated
using (
  exists (
    select 1
    from public.doctor_profiles
    where doctor_profiles.id = doctor_languages.doctor_profile_id
      and doctor_profiles.user_id = auth.uid()
  )
);

drop policy if exists "Doctors insert own languages" on public.doctor_languages;
create policy "Doctors insert own languages"
on public.doctor_languages for insert
to authenticated
with check (
  exists (
    select 1
    from public.doctor_profiles
    where doctor_profiles.id = doctor_languages.doctor_profile_id
      and doctor_profiles.user_id = auth.uid()
  )
);

drop policy if exists "Doctors update own languages" on public.doctor_languages;
create policy "Doctors update own languages"
on public.doctor_languages for update
to authenticated
using (
  exists (
    select 1
    from public.doctor_profiles
    where doctor_profiles.id = doctor_languages.doctor_profile_id
      and doctor_profiles.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.doctor_profiles
    where doctor_profiles.id = doctor_languages.doctor_profile_id
      and doctor_profiles.user_id = auth.uid()
  )
);

drop policy if exists "Doctors delete own languages" on public.doctor_languages;
create policy "Doctors delete own languages"
on public.doctor_languages for delete
to authenticated
using (
  exists (
    select 1
    from public.doctor_profiles
    where doctor_profiles.id = doctor_languages.doctor_profile_id
      and doctor_profiles.user_id = auth.uid()
  )
);

insert into public.doctor_languages (
  doctor_profile_id,
  language_name,
  level_cefr,
  level_label,
  sort_order
)
select
  doctor_profile.id,
  trimmed_language.language_name,
  'B2',
  'Gute Kenntnisse',
  trimmed_language.sort_order
from public.doctor_profiles as doctor_profile
cross join lateral (
  select
    trim(language_item.language_name) as language_name,
    language_item.ordinality - 1 as sort_order
  from unnest(coalesce(doctor_profile.languages, '{}'::text[])) with ordinality as language_item(language_name, ordinality)
) as trimmed_language
where trimmed_language.language_name <> ''
on conflict (doctor_profile_id, language_name) do nothing;
