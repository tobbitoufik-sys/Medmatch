import { cache } from "react";

import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  demoContacts,
  demoDoctors,
  demoFacilities,
  demoOffers,
  demoUsers
} from "@/lib/data/demo-data";
import type {
  ContactRequest,
  DoctorAdditionalSection,
  DoctorCvLayout,
  DoctorEducation,
  DoctorExperience,
  DoctorLanguage,
  DoctorProfile,
  DoctorTraining,
  FacilityProfile,
  JobOffer,
  UserRecord,
  UserRole
} from "@/types";

export const getCurrentUser = cache(
  async (preferredRole?: UserRole): Promise<UserRecord | null> => {
    if (!hasSupabaseEnv()) {
      if (preferredRole) {
        return demoUsers.find((user) => user.role === preferredRole) ?? demoUsers[0];
      }
      return demoUsers[0];
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (data) return data as UserRecord;

    const roleFromMetadata = user.user_metadata.role;
    const role =
      roleFromMetadata === "doctor" || roleFromMetadata === "facility" || roleFromMetadata === "admin"
        ? roleFromMetadata
        : preferredRole ?? "doctor";
    const fullName =
      typeof user.user_metadata.full_name === "string" && user.user_metadata.full_name.trim().length > 0
        ? user.user_metadata.full_name
        : user.email?.split("@")[0] ?? "User";

    const fallbackUser = {
      id: user.id,
      email: user.email ?? "",
      full_name: fullName,
      role,
      is_active: true
    };

    const { data: inserted } = await supabase
      .from("users")
      .upsert(fallbackUser, { onConflict: "id" })
      .select("*")
      .single();

    return (inserted as UserRecord | null) ?? null;
  }
);

export async function getUsers() {
  if (!hasSupabaseEnv()) return demoUsers;

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as UserRecord[]) ?? [];
}

function filterDoctors(data: DoctorProfile[], filters?: Partial<Record<string, string>>) {
  return data.filter((doctor) => {
    const match = (field: string, value?: string) =>
      !value || field.toLowerCase().includes(value.toLowerCase());
    const languageMatch =
      !filters?.language ||
      doctor.languages.some((lang) =>
        lang.toLowerCase().includes(filters.language!.toLowerCase())
      );

    return (
      match(doctor.specialty, filters?.specialty) &&
      match(doctor.city, filters?.city) &&
      match(doctor.country, filters?.country) &&
      match(doctor.desired_contract_type, filters?.contract_type) &&
      match(doctor.availability, filters?.availability) &&
      languageMatch
    );
  });
}

export async function getDoctorProfiles(filters?: Partial<Record<string, string>>) {
  if (!hasSupabaseEnv()) return filterDoctors(demoDoctors, filters);

  const supabase = await createServerSupabaseClient();
  let query = supabase.from("doctor_profiles").select("*").eq("is_public", true);
  if (filters?.specialty) query = query.ilike("specialty", `%${filters.specialty}%`);
  if (filters?.city) query = query.ilike("city", `%${filters.city}%`);
  if (filters?.country) query = query.ilike("country", `%${filters.country}%`);
  if (filters?.contract_type)
    query = query.ilike("desired_contract_type", `%${filters.contract_type}%`);
  if (filters?.availability)
    query = query.ilike("availability", `%${filters.availability}%`);
  const { data } = await query.order("updated_at", { ascending: false });

  let doctors = (data as DoctorProfile[]) ?? [];
  if (filters?.language) {
    doctors = doctors.filter((doctor) =>
      doctor.languages.some((lang) =>
        lang.toLowerCase().includes(filters.language!.toLowerCase())
      )
    );
  }
  return doctors;
}

export async function getFacilityProfiles() {
  if (!hasSupabaseEnv()) return demoFacilities;

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("facility_profiles").select("*");
  return (data as FacilityProfile[]) ?? [];
}

function filterOffers(data: JobOffer[], filters?: Partial<Record<string, string>>) {
  return data.filter((offer) => {
    const match = (field: string, value?: string) =>
      !value || field.toLowerCase().includes(value.toLowerCase());

    return (
      match(offer.specialty, filters?.specialty) &&
      match(offer.city, filters?.city) &&
      match(offer.country, filters?.country) &&
      match(offer.contract_type, filters?.contract_type)
    );
  });
}

export async function getJobOffers(filters?: Partial<Record<string, string>>) {
  if (!hasSupabaseEnv()) return filterOffers(demoOffers, filters);

  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("job_offers")
    .select("*, facility:facility_profiles(*)")
    .eq("status", "published");
  if (filters?.specialty) query = query.ilike("specialty", `%${filters.specialty}%`);
  if (filters?.city) query = query.ilike("city", `%${filters.city}%`);
  if (filters?.country) query = query.ilike("country", `%${filters.country}%`);
  if (filters?.contract_type)
    query = query.ilike("contract_type", `%${filters.contract_type}%`);
  const { data } = await query.order("published_at", { ascending: false });
  return (data as JobOffer[]) ?? [];
}

export async function getContactRequests() {
  if (!hasSupabaseEnv()) return demoContacts;

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("contact_requests").select("*");
  return (data as ContactRequest[]) ?? [];
}

export async function getDoctorByUserId(userId: string) {
  if (!hasSupabaseEnv()) {
    return demoDoctors.find((doctor) => doctor.user_id === userId) ?? null;
  }

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("doctor_profiles")
    .select("id, user_id, first_name, last_name, date_of_birth, nationality, phone, street, postal_code, profile_photo_path, cv_photo_path, cv_photo_presentation, headline, specialty, city, country, professional_summary, languages, years_experience, availability, desired_contract_type, bio, license_type, license_since, license_issuer, current_position, degree_name, graduation_year, education_university, education_country, education_from_date, education_to_date, is_public, created_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  return (data as DoctorProfile | null) ?? null;
}

export async function getCurrentDoctorProfile() {
  if (!hasSupabaseEnv()) {
    return demoDoctors[0] ?? null;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("doctor_profiles")
    .select("*, experiences:doctor_experiences(*), educations:doctor_educations(*), trainings:doctor_trainings(*), doctor_languages(*), additional_sections:doctor_additional_sections(*)")
    .eq("user_id", user.id)
    .maybeSingle();

  const profile = (data as (DoctorProfile & {
    additional_sections?: DoctorAdditionalSection[];
    experiences?: DoctorExperience[];
    educations?: DoctorEducation[];
    doctor_languages?: DoctorLanguage[];
    trainings?: DoctorTraining[];
  }) | null) ?? null;

  if (!profile) return null;

  return {
    ...profile,
    experiences: (profile.experiences ?? []).sort((a, b) => a.sort_order - b.sort_order),
    educations: (profile.educations ?? []).sort((a, b) => a.sort_order - b.sort_order),
    trainings: (profile.trainings ?? []).sort((a, b) => a.sort_order - b.sort_order),
    doctor_languages: (profile.doctor_languages ?? []).sort((a, b) => a.sort_order - b.sort_order),
    additional_sections: (profile.additional_sections ?? []).sort((a, b) => a.sort_order - b.sort_order)
  };
}

export async function getCurrentDoctorCvLayout(templateKey = "modern") {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("doctor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) return null;

  const { data } = await supabase
    .from("doctor_cv_layouts")
    .select("*")
    .eq("doctor_profile_id", profile.id)
    .eq("template_key", templateKey)
    .maybeSingle();

  return (data as DoctorCvLayout | null) ?? null;
}

export async function getFacilityByUserId(userId: string) {
  if (!hasSupabaseEnv()) {
    return demoFacilities.find((facility) => facility.user_id === userId) ?? null;
  }

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("facility_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return (data as FacilityProfile | null) ?? null;
}

export async function requireRole(role: UserRole) {
  const user = await getCurrentUser();
  return user?.role === role ? user : null;
}

export function calculateDoctorProfileCompletion(profile: DoctorProfile | null) {
  if (!profile) return 0;

  const checks = [
    Boolean(profile.first_name?.trim()),
    Boolean(profile.last_name?.trim()),
    Boolean(profile.headline?.trim()),
    Boolean(profile.specialty?.trim()),
    Boolean(profile.country?.trim()),
    Boolean(profile.city?.trim()),
    profile.languages.length > 0,
    Boolean(profile.bio?.trim()),
    Boolean(profile.availability?.trim()),
    Boolean(profile.desired_contract_type?.trim()),
    Boolean(profile.license_type?.trim() && profile.license_type !== "none"),
    Boolean(profile.current_position?.trim()),
    Boolean(profile.education_university?.trim()),
    Boolean(profile.education_country?.trim()),
    (profile.experiences?.length ?? 0) > 0
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}
