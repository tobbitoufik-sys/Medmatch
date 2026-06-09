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
    email: "amina.schneider@medmatch.demo",
    full_name: "Dr. Amina Schneider",
    role: "doctor",
    created_at: now,
    updated_at: now,
    is_active: true
  },
  {
    id: "user-doctor-2",
    email: "maximilian.weber@medmatch.demo",
    full_name: "Dr. Maximilian Weber",
    role: "doctor",
    created_at: now,
    updated_at: now,
    is_active: true
  },
  {
    id: "user-facility-1",
    email: "karriere@mvz-rhein-main.demo",
    full_name: "Medizinisches Zentrum Rhein-Main",
    role: "facility",
    created_at: now,
    updated_at: now,
    is_active: true
  },
  {
    id: "user-admin-1",
    email: "admin@medmatch.demo",
    full_name: "Plattform-Admin",
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
    first_name: "Amina",
    last_name: "Schneider",
    date_of_birth: null,
    nationality: "Deutsch",
    phone: "",
    street: "",
    postal_code: "",
    profile_photo_path: "",
    headline: "Fachärztin für Kardiologie",
    specialty: "Kardiologie",
    city: "Berlin",
    country: "Deutschland",
    professional_summary: "Erfahrene Kardiologin mit Schwerpunkt auf strukturierter Patientenversorgung, klaren Behandlungspfaden und Teamarbeit.",
    languages: ["Deutsch", "Englisch"],
    years_experience: 9,
    availability: "Verfügbar in 30 Tagen",
    desired_contract_type: "Unbefristet",
    bio: "Kardiologin mit breiter Erfahrung in Klinik und ambulanter Versorgung, fokussiert auf klare Behandlungspfade und kollegiale Zusammenarbeit.",
    license_type: "approbation",
    license_since: "2017-01-01",
    license_issuer: "Landesamt für Gesundheit Berlin",
    current_position: "Facharzt",
    degree_name: "Staatsexamen Medizin",
    graduation_year: 2013,
    education_university: "Charite Berlin",
    education_country: "Deutschland",
    education_from_date: "2007-09-01",
    education_to_date: "2013-06-30",
    educations: [
      {
        id: "education-1",
        doctor_profile_id: "doctor-1",
        education_university: "Charite Berlin",
        degree_name: "Staatsexamen Medizin",
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
        institution: "Deutsche Gesellschaft für Kardiologie",
        from_date: "2024-03-01",
        to_date: "2024-03-03",
        certificate_name: "CME-Zertifikat",
        sort_order: 0
      }
    ],
    additional_sections: [
      {
        id: "additional-section-1",
        doctor_profile_id: "doctor-1",
        section_title: "Publikationen",
        bullet_1: "Mitautorin einer kardiologischen Fallserie in einer Fachzeitschrift",
        bullet_2: "Präsentation klinischer Ergebnisdaten auf einem regionalen Kardiologiekongress",
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
    first_name: "Maximilian",
    last_name: "Weber",
    date_of_birth: null,
    nationality: "German",
    phone: "",
    street: "",
    postal_code: "",
    profile_photo_path: "",
    headline: "Radiologe für Honorar- und Projektarbeit",
    specialty: "Radiologie",
    city: "Berlin",
    country: "Deutschland",
    professional_summary: "Radiologe mit Erfahrung in dynamischen Bildgebungsumgebungen, strukturierter Befundung und flexiblen Einsätzen.",
    languages: ["Deutsch", "Englisch"],
    years_experience: 6,
    availability: "Sofort verfügbar",
    desired_contract_type: "Honorar",
    bio: "Radiologe mit Erfahrung in hoher Taktung, strukturierter Befundung und flexiblen kurz- bis mittelfristigen Einsätzen.",
    license_type: "approbation",
    license_since: "2020-01-01",
    license_issuer: "Landesamt für Gesundheit Berlin",
    current_position: "Assistenzarzt",
    degree_name: "Staatsexamen Medizin",
    graduation_year: 2018,
    education_university: "Charite",
    education_country: "Deutschland",
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
        section_title: "IT-Kenntnisse",
        bullet_1: "Sicher in RIS/PACS-Workflows und strukturierter Befundung",
        bullet_2: "Erfahrung mit teleradiologischen Plattformen",
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
    facility_name: "Medizinisches Zentrum Rhein-Main",
    facility_type: "MVZ",
    city: "Frankfurt am Main",
    country: "Deutschland",
    website: "https://mvz-rhein-main.example",
    description: "Modernes medizinisches Versorgungszentrum mit Fokus auf strukturierte Patientenversorgung und nachhaltige Teamkultur.",
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
    title: "Fachärztin/Facharzt für Kardiologie",
    specialty: "Kardiologie",
    city: "Frankfurt am Main",
    country: "Deutschland",
    contract_type: "unbefristet",
    description: "Übernehmen Sie Verantwortung in der ambulanten und stationären kardiologischen Versorgung eines modernen Zentrums.",
    requirements: "Facharztanerkennung, mindestens 5 Jahre Berufserfahrung, sichere Kommunikation mit Patienten und Team.",
    salary_range_optional: "Attraktives Paket nach Vereinbarung",
    status: "published",
    published_at: now,
    created_at: now,
    updated_at: now,
    facility: demoFacilities[0]
  },
  {
    id: "offer-2",
    facility_id: "facility-1",
    title: "Honorararzt Radiologie",
    specialty: "Radiologie",
    city: "Frankfurt am Main",
    country: "Deutschland",
    contract_type: "honorar",
    description: "Kurzfristige Unterstützung in der diagnostischen Bildgebung mit strukturierter Befundung.",
    requirements: "Erfahrung in CT/MRT, Approbation und vollständige Qualifikationsnachweise.",
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
    message: "Ich möchte die kardiologische Position und den weiteren Bewerbungsablauf gerne besprechen.",
    status: "new",
    created_at: now,
    updated_at: now,
    sender_name: "Dr. Amina Schneider",
    receiver_name: "Medizinisches Zentrum Rhein-Main",
    related_offer_title: "Fachärztin/Facharzt für Kardiologie"
  }
];
