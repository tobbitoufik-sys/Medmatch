import type {
  ContactRequest,
  DoctorProfile,
  FacilityProfile,
  JobOffer,
  UserRecord
} from "@/types";

const now = new Date().toISOString();

export const demoUsers: UserRecord[] = [
  {
    id: "user-doctor-1",
    email: "amelia.carter@medmatch.demo",
    full_name: "Dr. Amelia Carter",
    role: "doctor",
    created_at: now,
    updated_at: now,
    is_active: true
  },
  {
    id: "user-doctor-2",
    email: "james.wilson@medmatch.demo",
    full_name: "Dr. James Wilson",
    role: "doctor",
    created_at: now,
    updated_at: now,
    is_active: true
  },
  {
    id: "user-facility-1",
    email: "talent@northstarclinic.demo",
    full_name: "NorthStar Clinic",
    role: "facility",
    created_at: now,
    updated_at: now,
    is_active: true
  },
  {
    id: "user-admin-1",
    email: "admin@medmatch.demo",
    full_name: "Platform Admin",
    role: "admin",
    created_at: now,
    updated_at: now,
    is_active: true
  }
];

export const demoDoctors: DoctorProfile[] = [
  {
    id: "doctor-1",
    user_id: "user-doctor-1",
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
    bio: "Cardiologist with extensive experience in tertiary referral hospitals and private clinics, focused on patient pathways and team mentoring.",
    is_public: true,
    profile_completion: 92,
    verified: true,
    created_at: now,
    updated_at: now
  },
  {
    id: "doctor-2",
    user_id: "user-doctor-2",
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
    bio: "Radiologist used to fast-paced environments, remote reads and cross-border placements for short and mid-term assignments.",
    is_public: true,
    profile_completion: 84,
    verified: false,
    created_at: now,
    updated_at: now
  }
];

export const demoFacilities: FacilityProfile[] = [
  {
    id: "facility-1",
    user_id: "user-facility-1",
    facility_name: "NorthStar Clinic",
    facility_type: "Private Clinic",
    city: "Dubai",
    country: "United Arab Emirates",
    website: "https://northstarclinic.example",
    description: "Fast-growing specialty clinic looking for experienced physicians ready to join an ambitious international team.",
    contact_person_name: "Sophie Lang",
    verified: true,
    created_at: now,
    updated_at: now
  }
];

export const demoOffers: JobOffer[] = [
  {
    id: "offer-1",
    facility_id: "facility-1",
    title: "Consultant Cardiologist",
    specialty: "Cardiology",
    city: "Dubai",
    country: "United Arab Emirates",
    contract_type: "Permanent",
    description: "Lead outpatient and inpatient cardiology activity in a premium clinic with strong international patient demand.",
    requirements: "Board certification, 5+ years consultant experience, fluent English.",
    salary_range_optional: "Competitive package + relocation",
    status: "published",
    published_at: now,
    created_at: now,
    updated_at: now,
    facility: demoFacilities[0]
  },
  {
    id: "offer-2",
    facility_id: "facility-1",
    title: "Radiology Locum",
    specialty: "Radiology",
    city: "Dubai",
    country: "United Arab Emirates",
    contract_type: "Locum",
    description: "Short-term coverage for diagnostic imaging with remote reporting options.",
    requirements: "CT/MRI experience, cross-border compliance documentation.",
    salary_range_optional: null,
    status: "published",
    published_at: now,
    created_at: now,
    updated_at: now,
    facility: demoFacilities[0]
  }
];

export const demoContacts: ContactRequest[] = [
  {
    id: "contact-1",
    sender_user_id: "user-doctor-1",
    receiver_user_id: "user-facility-1",
    related_offer_id: "offer-1",
    message: "I would be interested in discussing the cardiology opportunity and the onboarding timeline.",
    status: "new",
    created_at: now,
    updated_at: now,
    sender_name: "Dr. Amelia Carter",
    receiver_name: "NorthStar Clinic",
    related_offer_title: "Consultant Cardiologist"
  }
];
