import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase environment variables. Check .env.local first.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const users = [
  {
    email: "amelia.carter@medmatch.demo",
    password: "DemoPass123!",
    full_name: "Dr. Amelia Carter",
    role: "doctor"
  },
  {
    email: "james.wilson@medmatch.demo",
    password: "DemoPass123!",
    full_name: "Dr. James Wilson",
    role: "doctor"
  },
  {
    email: "talent@northstarclinic.demo",
    password: "DemoPass123!",
    full_name: "NorthStar Clinic",
    role: "facility"
  },
  {
    email: "admin@medmatch.demo",
    password: "DemoPass123!",
    full_name: "Platform Admin",
    role: "admin"
  }
];

async function ensureAuthUser(user) {
  const { data: existingList, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;

  const existing = existingList.users.find((item) => item.email === user.email);
  if (existing) return existing;

  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: {
      full_name: user.full_name,
      role: user.role
    }
  });

  if (error) throw error;
  return data.user;
}

async function main() {
  const createdUsers = [];

  for (const user of users) {
    const authUser = await ensureAuthUser(user);
    createdUsers.push({ ...user, id: authUser.id });
  }

  await supabase.from("users").upsert(
    createdUsers.map((user) => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: true
    })),
    { onConflict: "id" }
  );

  const doctor1 = createdUsers.find((user) => user.email === "amelia.carter@medmatch.demo");
  const doctor2 = createdUsers.find((user) => user.email === "james.wilson@medmatch.demo");
  const facilityUser = createdUsers.find((user) => user.email === "talent@northstarclinic.demo");

  await supabase.from("doctor_profiles").upsert(
    [
      {
        user_id: doctor1.id,
        first_name: "Amelia",
        last_name: "Carter",
        title: "MD",
        specialty: "Cardiology",
        sub_specialty: "Interventional Cardiology",
        city: "London",
        country: "United Kingdom",
        languages: ["English", "French"],
        years_experience: 9,
        availability: "Available in 30 days",
        contract_type: "Permanent",
        bio: "Cardiologist with extensive experience in tertiary referral hospitals and premium clinics.",
        is_public: true,
        verified: true
      },
      {
        user_id: doctor2.id,
        first_name: "James",
        last_name: "Wilson",
        title: "MD",
        specialty: "Radiology",
        sub_specialty: "Emergency Imaging",
        city: "Berlin",
        country: "Germany",
        languages: ["German", "English"],
        years_experience: 6,
        availability: "Immediate",
        contract_type: "Locum",
        bio: "Radiologist used to fast-paced emergency imaging and flexible international assignments.",
        is_public: true,
        verified: false
      }
    ],
    { onConflict: "user_id" }
  );

  const { data: facilityProfile, error: facilityError } = await supabase
    .from("facility_profiles")
    .upsert(
      {
        user_id: facilityUser.id,
        facility_name: "NorthStar Clinic",
        facility_type: "Private Clinic",
        city: "Dubai",
        country: "United Arab Emirates",
        website: "https://northstarclinic.example",
        description: "Fast-growing specialty clinic looking for internationally minded consultants.",
        contact_person_name: "Sophie Lang",
        verified: true
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (facilityError) throw facilityError;

  const offers = [
    {
      facility_id: facilityProfile.id,
      title: "Consultant Cardiologist",
      specialty: "Cardiology",
      city: "Dubai",
      country: "United Arab Emirates",
      contract_type: "Permanent",
      description: "Lead outpatient and inpatient cardiology activity in a premium clinic with strong international demand.",
      requirements: "Board certification, consultant experience, fluent English.",
      salary_range_optional: "Competitive package + relocation",
      status: "published",
      published_at: new Date().toISOString()
    },
    {
      facility_id: facilityProfile.id,
      title: "Radiology Locum",
      specialty: "Radiology",
      city: "Dubai",
      country: "United Arab Emirates",
      contract_type: "Locum",
      description: "Short-term diagnostic imaging support with optional remote reporting.",
      requirements: "CT and MRI experience, flexible availability.",
      salary_range_optional: null,
      status: "published",
      published_at: new Date().toISOString()
    }
  ];

  for (const offer of offers) {
    const { data: existingOffer } = await supabase
      .from("job_offers")
      .select("id")
      .eq("facility_id", offer.facility_id)
      .eq("title", offer.title)
      .maybeSingle();

    if (!existingOffer) {
      await supabase.from("job_offers").insert(offer);
    }
  }

  const { data: firstOffer } = await supabase
    .from("job_offers")
    .select("id")
    .eq("facility_id", facilityProfile.id)
    .eq("title", "Consultant Cardiologist")
    .single();

  const { data: existingContact } = await supabase
    .from("contact_requests")
    .select("id")
    .eq("sender_user_id", doctor1.id)
    .eq("receiver_user_id", facilityUser.id)
    .maybeSingle();

  if (!existingContact) {
    await supabase.from("contact_requests").insert({
      sender_user_id: doctor1.id,
      receiver_user_id: facilityUser.id,
      related_offer_id: firstOffer?.id ?? null,
      message: "I would be interested in discussing the cardiology opportunity and your onboarding timeline.",
      status: "new"
    });
  }

  console.log("Demo seed complete.");
  console.log("Demo login emails:");
  for (const user of users) {
    console.log(`- ${user.email} / ${user.password}`);
  }
}

main().catch((error) => {
  console.error("Seed failed:");
  console.error(error);
  process.exit(1);
});
