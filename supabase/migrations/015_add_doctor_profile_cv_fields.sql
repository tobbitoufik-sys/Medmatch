alter table public.doctor_profiles
  add column if not exists date_of_birth date,
  add column if not exists nationality text not null default '',
  add column if not exists phone text not null default '',
  add column if not exists street text not null default '',
  add column if not exists postal_code text not null default '',
  add column if not exists professional_summary text not null default '',
  add column if not exists degree_name text not null default '',
  add column if not exists graduation_year integer;
