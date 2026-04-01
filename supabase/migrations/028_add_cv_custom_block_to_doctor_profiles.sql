alter table public.doctor_profiles
  add column if not exists cv_custom_block jsonb;
