alter table public.external_job_offers
  add column if not exists clinic_address text,
  add column if not exists contact_person text,
  add column if not exists salutation text not null default 'unbekannt',
  add column if not exists contact_email text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'external_job_offers_salutation_check'
  ) then
    alter table public.external_job_offers
      add constraint external_job_offers_salutation_check
      check (salutation in ('herr', 'frau', 'unbekannt'));
  end if;
end $$;
