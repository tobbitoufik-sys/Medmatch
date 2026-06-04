alter table public.external_source_offer_memory
add column if not exists pipeline_imported_at timestamptz,
add column if not exists pipeline_import_run_id uuid references public.external_offer_import_runs (id) on delete set null;

create index if not exists external_source_offer_memory_pipeline_imported_at_idx
  on public.external_source_offer_memory (pipeline_imported_at desc);
