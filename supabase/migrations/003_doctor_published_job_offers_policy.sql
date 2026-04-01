alter table public.job_offers enable row level security;

drop policy if exists "authenticated users can read published job offers" on public.job_offers;

create policy "authenticated users can read published job offers"
on public.job_offers
for select
to authenticated
using (status = 'published');
