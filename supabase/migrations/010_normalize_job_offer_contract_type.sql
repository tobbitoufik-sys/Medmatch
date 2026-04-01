do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'job_offer_contract_type'
      and n.nspname = 'public'
  ) then
    create type public.job_offer_contract_type as enum (
      'honorar',
      'befristet',
      'unbefristet'
    );
  end if;
end
$$;

update public.job_offers
set contract_type = case
  when lower(trim(contract_type)) in ('honorar', 'locum', 'freelance', 'freelancer', 'contract') then 'honorar'
  when lower(trim(contract_type)) in ('befristet', 'fixed term', 'fixed-term', 'temporary', 'temp') then 'befristet'
  when lower(trim(contract_type)) in ('unbefristet', 'permanent', 'full time', 'full-time') then 'unbefristet'
  else 'unbefristet'
end
where contract_type is not null;

alter table public.job_offers
  alter column contract_type type public.job_offer_contract_type
  using (contract_type::public.job_offer_contract_type);
