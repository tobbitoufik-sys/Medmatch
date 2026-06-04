import { getCurrentUser } from "@/lib/data/repository";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type DeleteResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "blocked_published" | "error" };

async function requireAdminUser() {
  const user = await getCurrentUser("admin");
  if (!user || user.role !== "admin") {
    throw new Error("Only admins can delete external-offer admin entries.");
  }
}

function logDeleteError(scope: string, error: { message?: string | null; details?: string | null; hint?: string | null; code?: string | null }) {
  if (process.env.NODE_ENV !== "production") {
    console.error(scope, {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
  }
}

export async function deleteExternalJobOfferById(id: string): Promise<DeleteResult> {
  await requireAdminUser();

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("external_job_offers").delete().eq("id", id);

  if (error) {
    logDeleteError("[admin-delete] external job offer delete failed", error);
    return { ok: false, reason: "error" };
  }

  return { ok: true };
}

export async function deleteRefinementQueueEntryById(id: string): Promise<DeleteResult> {
  await requireAdminUser();

  const supabase = await createServerSupabaseClient();
  const { data, error: loadError } = await supabase
    .from("external_offer_refinement_queue")
    .select("id, published_external_offer_id")
    .eq("id", id)
    .maybeSingle();

  if (loadError) {
    logDeleteError("[admin-delete] refinement queue load failed", loadError);
    return { ok: false, reason: "error" };
  }

  if (!data?.id) {
    return { ok: false, reason: "not_found" };
  }

  if (data.published_external_offer_id) {
    return { ok: false, reason: "blocked_published" };
  }

  const { error: deleteError } = await supabase.from("external_offer_refinement_queue").delete().eq("id", id);

  if (deleteError) {
    logDeleteError("[admin-delete] refinement queue delete failed", deleteError);
    return { ok: false, reason: "error" };
  }

  return { ok: true };
}

export async function deleteImportRunById(id: string): Promise<DeleteResult> {
  await requireAdminUser();

  const supabase = await createServerSupabaseClient();
  const { data, error: linkedError } = await supabase
    .from("external_offer_refinement_queue")
    .select("id, published_external_offer_id")
    .eq("import_run_id", id)
    .not("published_external_offer_id", "is", null)
    .limit(1);

  if (linkedError) {
    logDeleteError("[admin-delete] import run linked refinement lookup failed", linkedError);
    return { ok: false, reason: "error" };
  }

  if (data?.length) {
    return { ok: false, reason: "blocked_published" };
  }

  const { error: deleteError } = await supabase.from("external_offer_import_runs").delete().eq("id", id);

  if (deleteError) {
    logDeleteError("[admin-delete] import run delete failed", deleteError);
    return { ok: false, reason: "error" };
  }

  return { ok: true };
}
