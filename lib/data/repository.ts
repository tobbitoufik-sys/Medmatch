import { cache } from "react";

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
  DoctorProfile,
  FacilityProfile,
  JobOffer,
  UserRecord,
  UserRole
} from "@/types";

function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

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
      .single();

    return (data as UserRecord | null) ?? null;
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
      match(doctor.contract_type, filters?.contract_type) &&
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
    query = query.ilike("contract_type", `%${filters.contract_type}%`);
  if (filters?.availability)
    query = query.ilike("availability", `%${filters.availability}%`);
  const { data } = await query.order("verified", { ascending: false });

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
  const doctors = await getDoctorProfiles();
  return doctors.find((doctor) => doctor.user_id === userId) ?? null;
}

export async function getFacilityByUserId(userId: string) {
  const facilities = await getFacilityProfiles();
  return facilities.find((facility) => facility.user_id === userId) ?? null;
}

export async function requireRole(role: UserRole) {
  const user = await getCurrentUser();
  return user?.role === role ? user : null;
}
