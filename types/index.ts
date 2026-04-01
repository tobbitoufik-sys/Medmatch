export type UserRole = "doctor" | "facility" | "admin";

export type DoctorCurrentPosition =
  | "Assistenzarzt"
  | "Facharzt"
  | "Oberarzt"
  | "Leitender Oberarzt"
  | "Chefarzt";

export type DoctorLicenseType = "approbation" | "berufserlaubnis" | "none";
export type JobOfferContractType = "honorar" | "befristet" | "unbefristet";
export type DoctorLanguageCefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type DoctorLanguageLabelLevel =
  | "Anfänger"
  | "Grundkenntnisse"
  | "Gute Kenntnisse"
  | "Fließend"
  | "Verhandlungssicher"
  | "Muttersprache";

export type UserRecord = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  is_active: boolean;
};

export type DoctorProfile = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  nationality: string;
  phone: string;
  street: string;
  postal_code: string;
  profile_photo_path: string;
  cv_photo_path?: string | null;
  cv_photo_presentation?: {
    shape: "circle" | "roundedRect";
    version: 1;
    zoom: number;
    offsetXPercent: number;
    offsetYPercent: number;
  } | null;
  headline: string;
  specialty: string;
  city: string;
  country: string;
  professional_summary: string;
  languages: string[];
  years_experience: number;
  availability: string;
  desired_contract_type: string;
  bio: string;
  license_type: DoctorLicenseType | "";
  license_since: string | null;
  license_issuer?: string | null;
  current_position: DoctorCurrentPosition | "";
  degree_name: string;
  graduation_year: number | null;
  education_university: string;
  education_country: string;
  education_from_date: string | null;
  education_to_date: string | null;
  is_public: boolean;
  experiences?: DoctorExperience[];
  educations?: DoctorEducation[];
  trainings?: DoctorTraining[];
  doctor_languages?: DoctorLanguage[];
  additional_sections?: DoctorAdditionalSection[];
  cv_custom_block?: DoctorCvCustomBlock | null;
  created_at?: string;
  updated_at: string;
};

export type DoctorLanguage = {
  id: string;
  doctor_profile_id: string;
  language_name: string;
  level_cefr: DoctorLanguageCefrLevel;
  level_label: DoctorLanguageLabelLevel;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export type DoctorExperience = {
  id: string;
  doctor_profile_id: string;
  title: string;
  institution: string;
  from_date: string | null;
  to_date: string | null;
  description: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export type DoctorEducation = {
  id: string;
  doctor_profile_id: string;
  education_university: string;
  degree_name: string;
  from_date: string | null;
  to_date: string | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export type DoctorTraining = {
  id: string;
  doctor_profile_id: string;
  training_name: string;
  institution: string;
  from_date: string | null;
  to_date: string | null;
  certificate_name: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export type DoctorAdditionalSection = {
  id: string;
  doctor_profile_id: string;
  section_title: string;
  bullet_1: string;
  bullet_2: string;
  bullet_3: string;
  bullet_4: string;
  bullet_5: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export type DoctorCvCustomBlockEntry = {
  id: string;
  content: string;
  description?: string | null;
  from_date: string | null;
  to_date: string | null;
};

export type DoctorCvCustomBlock = {
  title: string;
  entries: DoctorCvCustomBlockEntry[];
};

export type CvHeader = {
  full_name: string;
  subtitle: string | null;
  photo_url: string | null;
  prepared_photo_url?: string | null;
  initials: string;
  photo_presentation?: {
    shape: "circle" | "roundedRect";
    version: 1;
    zoom: number;
    offsetXPercent: number;
    offsetYPercent: number;
  } | null;
};

export type CvPersonalInfo = {
  items: string[];
  address_line: string | null;
};

export type CvWorkExperienceItem = {
  id: string;
  title: string;
  organization_line: string | null;
  date_label: string;
  bullets: string[];
};

export type CvEducationItem = {
  id: string;
  title: string;
  subtitle: string | null;
  meta: string | null;
  date_label: string | null;
  item_type?: "education" | "medical_license";
  issuer_line?: string | null;
  since_label?: string | null;
};

export type CvQualificationItem = {
  id: string;
  label: string;
  detail: string | null;
};

export type CvTrainingItem = {
  id: string;
  title: string;
  detail: string | null;
  date_label: string | null;
};

export type CvLanguageItem = {
  id: string;
  label: string;
  cefrLevel?: string | null;
  levelLabel?: string | null;
};

export type CvAdditionalSectionItem = {
  id: string;
  title: string;
  bullets: string[];
};

export type CvSectionKey =
  | "work_experience"
  | "education"
  | "languages"
  | "qualifications"
  | "trainings"
  | "additional_sections";

export type DoctorCvModel = {
  header: CvHeader;
  personalInfo: CvPersonalInfo;
  workExperience: CvWorkExperienceItem[];
  education: CvEducationItem[];
  qualifications: CvQualificationItem[];
  trainings: CvTrainingItem[];
  languages: CvLanguageItem[];
  additionalSections: CvAdditionalSectionItem[];
  customBlock?: {
    title: string | null;
    entries: Array<{
      id: string;
      content: string;
      description?: string | null;
      date_label: string | null;
    }>;
  } | null;
};

export type DoctorCvLayout = {
  id: string;
  doctor_profile_id: string;
  template_key: string;
  section_order: CvSectionKey[];
  item_visibility?: Record<string, boolean>;
  photo_presentation?: {
    shape: "circle" | "roundedRect";
    version: 1;
    zoom: number;
    offsetXPercent: number;
    offsetYPercent: number;
  };
  created_at?: string;
  updated_at?: string;
};

export type FacilityProfile = {
  id: string;
  user_id: string;
  facility_name: string;
  facility_type: string;
  city: string;
  country: string;
  website: string | null;
  description: string;
  contact_person_name: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
};

export type JobOffer = {
  id: string;
  facility_id: string;
  title: string;
  specialty: string;
  city: string;
  country: string;
  contract_type: JobOfferContractType;
  description: string;
  requirements: string;
  salary_range_optional: string | null;
  status: "draft" | "published" | "paused";
  published_at: string | null;
  created_at: string;
  updated_at: string;
  facility?: FacilityProfile;
};

export type ContactRequest = {
  id: string;
  sender_user_id: string;
  receiver_user_id: string;
  related_offer_id: string | null;
  message: string;
  status: "new" | "reviewed" | "accepted" | "closed";
  created_at: string;
  updated_at: string;
  sender_name?: string;
  receiver_name?: string;
  related_offer_title?: string;
};

export type ApplicationRecord = {
  id: string;
  doctor_user_id: string;
  offer_id: string;
  facility_id: string;
  message: string;
  status: "submitted" | "received" | "in_review" | "contacted" | "accepted" | "rejected";
  hired?: boolean;
  commission_due?: boolean;
  created_at: string;
};
