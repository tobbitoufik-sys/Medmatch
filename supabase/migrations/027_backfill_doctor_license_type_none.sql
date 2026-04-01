update public.doctor_profiles
set license_type = 'none'
where license_type is null;
