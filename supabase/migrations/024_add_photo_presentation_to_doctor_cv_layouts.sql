alter table public.doctor_cv_layouts
  add column if not exists photo_presentation jsonb not null default '{"zoom":1,"offsetXPercent":0,"offsetYPercent":0,"shape":"circle","version":1}'::jsonb;
