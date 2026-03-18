export type UserRole = "doctor" | "facility" | "admin";

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
  title: string;
  specialty: string;
  sub_specialty: string;
  city: string;
  country: string;
  languages: string[];
  years_experience: number;
  availability: string;
  contract_type: string;
  bio: string;
  is_public: boolean;
  profile_completion: number;
  verified: boolean;
  created_at: string;
  updated_at: string;
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
  contract_type: string;
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
