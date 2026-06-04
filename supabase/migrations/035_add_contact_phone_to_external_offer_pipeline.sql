alter table public.external_offer_refinement_queue
  add column if not exists contact_phone text;

alter table public.external_job_offers
  add column if not exists contact_phone text;
