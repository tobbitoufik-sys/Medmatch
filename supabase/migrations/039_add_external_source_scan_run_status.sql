alter table public.external_source_scan_runs
add column if not exists run_trigger text not null default 'manual',
add column if not exists run_status text not null default 'succeeded',
add column if not exists error_message text;

create index if not exists external_source_scan_runs_run_trigger_idx
  on public.external_source_scan_runs (run_trigger);

create index if not exists external_source_scan_runs_run_status_idx
  on public.external_source_scan_runs (run_status);
