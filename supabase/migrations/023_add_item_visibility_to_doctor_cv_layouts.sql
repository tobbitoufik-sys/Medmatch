alter table public.doctor_cv_layouts
  add column if not exists item_visibility jsonb not null default '{}'::jsonb;
