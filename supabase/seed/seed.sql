insert into public.users (id, email, full_name, role, is_active)
values
  ('11111111-1111-1111-1111-111111111111', 'amelia.carter@medmatch.demo', 'Dr. Amelia Carter', 'doctor', true),
  ('22222222-2222-2222-2222-222222222222', 'james.wilson@medmatch.demo', 'Dr. James Wilson', 'doctor', true),
  ('33333333-3333-3333-3333-333333333333', 'talent@northstarclinic.demo', 'NorthStar Clinic', 'facility', true),
  ('44444444-4444-4444-4444-444444444444', 'admin@medmatch.demo', 'Platform Admin', 'admin', true)
on conflict (id) do nothing;

insert into public.doctor_profiles (
  id, user_id, first_name, last_name, title, specialty, sub_specialty, city, country, languages,
  years_experience, availability, contract_type, bio, is_public, verified
)
values
  (
    'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    '11111111-1111-1111-1111-111111111111',
    'Amelia',
    'Carter',
    'MD',
    'Cardiology',
    'Interventional Cardiology',
    'London',
    'United Kingdom',
    '{"English","French"}',
    9,
    'Available in 30 days',
    'Permanent',
    'Cardiologist with extensive experience in tertiary referral hospitals and premium clinics.',
    true,
    true
  ),
  (
    'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    '22222222-2222-2222-2222-222222222222',
    'James',
    'Wilson',
    'MD',
    'Radiology',
    'Emergency Imaging',
    'Berlin',
    'Germany',
    '{"German","English"}',
    6,
    'Immediate',
    'Locum',
    'Radiologist used to fast-paced emergency imaging and flexible international assignments.',
    true,
    false
  )
on conflict (id) do nothing;

insert into public.facility_profiles (
  id, user_id, facility_name, facility_type, city, country, website, description, contact_person_name, verified
)
values
  (
    'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    '33333333-3333-3333-3333-333333333333',
    'NorthStar Clinic',
    'Private Clinic',
    'Dubai',
    'United Arab Emirates',
    'https://northstarclinic.example',
    'Fast-growing specialty clinic looking for internationally minded consultants.',
    'Sophie Lang',
    true
  )
on conflict (id) do nothing;

insert into public.job_offers (
  id, facility_id, title, specialty, city, country, contract_type, description, requirements, salary_range_optional, status, published_at
)
values
  (
    'ccccccc1-cccc-cccc-cccc-ccccccccccc1',
    'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'Consultant Cardiologist',
    'Cardiology',
    'Dubai',
    'United Arab Emirates',
    'Permanent',
    'Lead outpatient and inpatient cardiology activity in a premium clinic with strong international demand.',
    'Board certification, consultant experience, fluent English.',
    'Competitive package + relocation',
    'published',
    timezone('utc', now())
  ),
  (
    'ccccccc2-cccc-cccc-cccc-ccccccccccc2',
    'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'Radiology Locum',
    'Radiology',
    'Dubai',
    'United Arab Emirates',
    'Locum',
    'Short-term diagnostic imaging support with optional remote reporting.',
    'CT and MRI experience, flexible availability.',
    null,
    'published',
    timezone('utc', now())
  )
on conflict (id) do nothing;

insert into public.contact_requests (
  id, sender_user_id, receiver_user_id, related_offer_id, message, status
)
values
  (
    'ddddddd1-dddd-dddd-dddd-ddddddddddd1',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333333',
    'ccccccc1-cccc-cccc-cccc-ccccccccccc1',
    'I would be interested in discussing the cardiology opportunity and your onboarding timeline.',
    'new'
  )
on conflict (id) do nothing;
