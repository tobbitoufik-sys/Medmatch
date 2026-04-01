alter table public.doctor_profiles
  add column if not exists license_issuer text;

do $$
begin
  if exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'doctor_license_type'
      and n.nspname = 'public'
  ) and not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'doctor_license_type'
      and n.nspname = 'public'
      and e.enumlabel = 'none'
  ) then
    alter type public.doctor_license_type add value 'none';
  end if;
end
$$;
