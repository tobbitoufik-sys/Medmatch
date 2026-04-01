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
    date_of_birth: null,
    nationality: "British",
    phone: "",
    street: "",
    postal_code: "",
    profile_photo_path: "",
    headline: "Consultant Cardiologist",
    specialty: "Cardiology",
    city: "London",
    country: "United Kingdom",
    professional_summary: "Experienced cardiologist focused on tertiary care, patient pathways and team mentoring.",
    languages: ["English", "French"],
    years_experience: 9,
    availability: "Available in 30 days",
    desired_contract_type: "Permanent",
    bio: "Cardiologist with extensive experience in tertiary referral hospitals and private clinics, focused on patient pathways and team mentoring.",
    license_type: "approbation",
    license_since: "2017-01-01",
    license_issuer: "General Medical Council",
    current_position: "Facharzt",
    degree_name: "MBBS",
    graduation_year: 2013,
    education_university: "King's College London",
    education_country: "United Kingdom",
    education_from_date: "2007-09-01",
    education_to_date: "2013-06-30",
    educations: [
      {
        id: "education-1",
        doctor_profile_id: "doctor-1",
        education_university: "King's College London",
        degree_name: "MBBS",
        from_date: "2007-09-01",
        to_date: "2013-06-30",
        sort_order: 0
      }
    ],
    trainings: [
      {
        id: "training-1",
        doctor_profile_id: "doctor-1",
        training_name: "Echokardiographie Fortbildung",
        institution: "European Society of Cardiology",
        from_date: "2024-03-01",
        to_date: "2024-03-03",
        certificate_name: "ESC CME Certificate",
        sort_order: 0
      }
    ],
    additional_sections: [
      {
        id: "additional-section-1",
        doctor_profile_id: "doctor-1",
        section_title: "Publications",
        bullet_1: "Co-author of a cardiology case series in a peer-reviewed journal",
        bullet_2: "Presented outcomes data at a regional cardiology congress",
        bullet_3: "",
        bullet_4: "",
        bullet_5: "",
        sort_order: 0
      }
    ],
    experiences: [],
    is_public: true,
    created_at: now,
    updated_at: now
  },
  {
    id: "doctor-2",
    user_id: "user-doctor-2",
    first_name: "James",
    last_name: "Wilson",
    date_of_birth: null,
    nationality: "German",
    phone: "",
    street: "",
    postal_code: "",
    profile_photo_path: "",
    headline: "Radiology Locum",
    specialty: "Radiology",
    city: "Berlin",
    country: "Germany",
    professional_summary: "Radiologist comfortable with fast-paced imaging environments, remote reads and cross-border placements.",
    languages: ["German", "English"],
    years_experience: 6,
    availability: "Immediate",
    desired_contract_type: "Locum",
    bio: "Radiologist used to fast-paced environments, remote reads and cross-border placements for short and mid-term assignments.",
    license_type: "approbation",
    license_since: "2020-01-01",
    license_issuer: "Landesamt fuer Gesundheit Berlin",
    current_position: "Assistenzarzt",
    degree_name: "Staatsexamen Medizin",
    graduation_year: 2018,
    education_university: "Charite",
    education_country: "Germany",
    education_from_date: "2012-10-01",
    education_to_date: "2018-09-30",
    educations: [
      {
        id: "education-2",
        doctor_profile_id: "doctor-2",
        education_university: "Charite",
        degree_name: "Staatsexamen Medizin",
        from_date: "2012-10-01",
        to_date: "2018-09-30",
        sort_order: 0
      }
    ],
    trainings: [
      {
        id: "training-2",
        doctor_profile_id: "doctor-2",
        training_name: "MRT Intensivkurs",
        institution: "DRG Akademie",
        from_date: "2023-11-10",
        to_date: "2023-11-12",
        certificate_name: "Teilnahmebescheinigung",
        sort_order: 0
      }
    ],
    additional_sections: [
      {
        id: "additional-section-2",
        doctor_profile_id: "doctor-2",
        section_title: "IT skills",
        bullet_1: "Confident in RIS/PACS workflows and structured reporting",
        bullet_2: "Experienced with teleradiology platforms",
        bullet_3: "",
        bullet_4: "",
        bullet_5: "",
        sort_order: 0
      }
    ],
    experiences: [],
    is_public: true,
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
    contract_type: "unbefristet",
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
    contract_type: "honorar",
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
