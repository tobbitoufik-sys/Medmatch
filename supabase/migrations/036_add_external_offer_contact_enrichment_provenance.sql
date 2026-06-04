alter table public.external_offer_refinement_queue
  add column if not exists enriched_contact_email_source_url text,
  add column if not exists enriched_clinic_address_source_url text,
  add column if not exists enriched_contact_phone_source_url text;
