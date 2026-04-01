import { demoOffers } from "@/lib/data/demo-data";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { JobOffer } from "@/types";

function getDemoPublishedOffers() {
  return demoOffers.filter((offer) => offer.status === "published");
}

export async function getDoctorPublishedOffers() {
  if (!hasSupabaseEnv()) {
    return getDemoPublishedOffers();
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("job_offers")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[doctor-opportunities] failed to load published offers", error);
    return [];
  }

  return (data as JobOffer[]) ?? [];
}

export async function getDoctorPublishedOfferById(id: string) {
  if (!hasSupabaseEnv()) {
    return getDemoPublishedOffers().find((offer) => offer.id === id) ?? null;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("job_offers")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("[doctor-opportunities] failed to load published offer", { id, error });
    return null;
  }

  return (data as JobOffer | null) ?? null;
}
