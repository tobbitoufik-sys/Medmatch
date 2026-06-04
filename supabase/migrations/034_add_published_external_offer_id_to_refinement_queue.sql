alter table public.external_offer_refinement_queue
  add column if not exists published_external_offer_id uuid references public.external_job_offers(id) on delete set null;

create index if not exists external_offer_refinement_queue_published_external_offer_id_idx
  on public.external_offer_refinement_queue (published_external_offer_id);
