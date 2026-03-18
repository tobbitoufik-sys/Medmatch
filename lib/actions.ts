"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  contactRequestSchema,
  doctorProfileSchema,
  facilityProfileSchema,
  jobOfferSchema
} from "@/lib/validations/profiles";
import { signInSchema, signUpSchema } from "@/lib/validations/auth";

type ActionState = {
  success: boolean;
  message: string;
};

const mockSuccess = (message: string): ActionState => ({ success: true, message });

function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function signInAction(_: ActionState, formData: FormData) {
  const values = signInSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!values.success) return { success: false, message: values.error.issues[0]?.message || "Invalid credentials." };
  if (!hasSupabaseEnv()) return mockSuccess("Demo mode: sign-in is ready once Supabase is connected.");

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword(values.data);
  if (error) return { success: false, message: error.message };
  redirect("/dashboard");
}

export async function signUpAction(_: ActionState, formData: FormData) {
  const values = signUpSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!values.success) return { success: false, message: values.error.issues[0]?.message || "Invalid registration details." };
  if (!hasSupabaseEnv()) return mockSuccess("Demo mode: registration flow is scaffolded and will work after Supabase setup.");

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email: values.data.email,
    password: values.data.password,
    options: {
      data: {
        full_name: values.data.fullName,
        role: values.data.role
      }
    }
  });
  if (error) return { success: false, message: error.message };

  if (data.user) {
    await supabase.from("users").insert({
      id: data.user.id,
      email: values.data.email,
      full_name: values.data.fullName,
      role: values.data.role,
      is_active: true
    });
  }

  return { success: true, message: "Account created. Check your email to confirm your registration." };
}

export async function signOutAction() {
  if (!hasSupabaseEnv()) redirect("/");
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function updateDoctorProfileAction(_: ActionState, formData: FormData) {
  const parsed = doctorProfileSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    years_experience: formData.get("years_experience"),
    is_public: formData.get("is_public") === "on"
  });
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message || "Please review your profile information." };
  if (!hasSupabaseEnv()) return mockSuccess("Demo mode: doctor profile form is ready. Connect Supabase to persist changes.");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "You need to be logged in." };

  const languages = parsed.data.languages.split(",").map((item) => item.trim()).filter(Boolean);
  const payload = { ...parsed.data, languages, user_id: user.id };

  await supabase.from("doctor_profiles").upsert(payload, { onConflict: "user_id" });
  revalidatePath("/dashboard/doctor");
  revalidatePath("/doctors");
  return { success: true, message: "Doctor profile saved successfully." };
}

export async function updateFacilityProfileAction(_: ActionState, formData: FormData) {
  const parsed = facilityProfileSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message || "Please review the facility profile." };
  if (!hasSupabaseEnv()) return mockSuccess("Demo mode: facility profile form is ready. Connect Supabase to persist changes.");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "You need to be logged in." };

  await supabase.from("facility_profiles").upsert({ ...parsed.data, user_id: user.id }, { onConflict: "user_id" });
  revalidatePath("/dashboard/facility");
  return { success: true, message: "Facility profile saved successfully." };
}

export async function createOrUpdateOfferAction(_: ActionState, formData: FormData) {
  const parsed = jobOfferSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message || "Please review the offer details." };
  if (!hasSupabaseEnv()) return mockSuccess("Demo mode: offer form is wired and ready once Supabase is connected.");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "You need to be logged in." };

  const { data: facility } = await supabase
    .from("facility_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!facility) return { success: false, message: "Please complete the facility profile first." };

  const offerId = formData.get("offer_id")?.toString();
  const payload = {
    ...parsed.data,
    facility_id: facility.id,
    published_at: parsed.data.status === "published" ? new Date().toISOString() : null
  };

  if (offerId) {
    await supabase.from("job_offers").update(payload).eq("id", offerId);
  } else {
    await supabase.from("job_offers").insert(payload);
  }

  revalidatePath("/dashboard/facility/offers");
  revalidatePath("/opportunities");
  return { success: true, message: "Offer saved successfully." };
}

export async function createContactRequestAction(_: ActionState, formData: FormData) {
  const parsed = contactRequestSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message || "Please enter a clear message." };
  if (!hasSupabaseEnv()) return mockSuccess("Demo mode: contact request flow is ready and will save after Supabase setup.");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "You need to be logged in." };

  await supabase.from("contact_requests").insert({
    sender_user_id: user.id,
    receiver_user_id: parsed.data.receiver_user_id,
    related_offer_id: parsed.data.related_offer_id || null,
    message: parsed.data.message,
    status: "new"
  });

  revalidatePath("/dashboard/doctor/contacts");
  revalidatePath("/dashboard/facility/contacts");
  return { success: true, message: "Contact request sent successfully." };
}
