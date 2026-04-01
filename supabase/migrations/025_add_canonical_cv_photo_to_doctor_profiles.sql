alter table public.doctor_profiles
add column if not exists cv_photo_path text,
add column if not exists cv_photo_presentation jsonb;
