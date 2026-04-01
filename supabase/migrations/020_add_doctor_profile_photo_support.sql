alter table public.doctor_profiles
  add column if not exists profile_photo_path text not null default '';

insert into storage.buckets (id, name, public)
values ('doctor-profile-photos', 'doctor-profile-photos', true)
on conflict (id) do nothing;

drop policy if exists "Public read doctor profile photos" on storage.objects;
create policy "Public read doctor profile photos"
on storage.objects for select
to public
using (bucket_id = 'doctor-profile-photos');

drop policy if exists "Doctors upload own profile photos" on storage.objects;
create policy "Doctors upload own profile photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'doctor-profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Doctors update own profile photos" on storage.objects;
create policy "Doctors update own profile photos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'doctor-profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'doctor-profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Doctors delete own profile photos" on storage.objects;
create policy "Doctors delete own profile photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'doctor-profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
