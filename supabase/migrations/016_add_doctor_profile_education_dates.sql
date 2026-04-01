alter table public.doctor_profiles
  add column if not exists education_from_date date,
  add column if not exists education_to_date date;
