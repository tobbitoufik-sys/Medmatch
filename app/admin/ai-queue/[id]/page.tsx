import type { Route } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentUser } from "@/lib/data/repository";
import { deleteRefinementQueueEntryById } from "@/lib/external-offers/admin-delete";
import { getExternalOfferQuality } from "@/lib/external-offers/quality";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  isTemporaryExternalOfferRefinementError,
  refineExternalOfferRawItem
} from "@/lib/ai/external-offer-refinement";
import { enrichExternalOfferContactData } from "@/lib/external-offers/enrich-contact";

type RefinementEntry = {
  id: string;
  source_url: string;
  source_name: string | null;
  refinement_status: "pending" | "succeeded" | "failed";
  error_message: string | null;
  raw_text_snapshot: string | null;
  title: string | null;
  hospital_name: string | null;
  location: string | null;
  clinic_address: string | null;
  contact_person: string | null;
  salutation: "herr" | "frau" | "unbekannt";
  contact_email: string | null;
  contact_phone: string | null;
  enriched_contact_email_source_url: string | null;
  enriched_clinic_address_source_url: string | null;
  enriched_contact_phone_source_url: string | null;
  specialty: string | null;
  contract_type: "honorar" | "befristet" | "unbefristet" | null;
  summary: string | null;
  external_offer_id: string | null;
  published_external_offer_id: string | null;
  updated_at: string;
};

async function requireAdminUser() {
  "use server";

  const user = await getCurrentUser("admin");
  if (!user || user.role !== "admin") {
    throw new Error("Only admins can manage external offer review entries.");
  }

  return user;
}

function normalizeOptional(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized.length ? normalized : null;
}

function normalizeRequired(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function normalizeSalutation(value: FormDataEntryValue | null): RefinementEntry["salutation"] {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "herr" || normalized === "frau" ? normalized : "unbekannt";
}

function normalizeContractType(value: FormDataEntryValue | null): RefinementEntry["contract_type"] {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "honorar" || normalized === "befristet" || normalized === "unbefristet"
    ? normalized
    : null;
}

function isValidOptionalEmail(value: string | null) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildDetailRedirectUrl(
  refinementId: string,
  statusKey?: "saveStatus" | "publishStatus" | "retryStatus" | "deleteStatus" | "enrichmentStatus",
  statusValue?: string
): Route {
  const base = `/admin/ai-queue/${encodeURIComponent(refinementId)}`;
  if (!statusKey || !statusValue) {
    return base as Route;
  }

  const params = new URLSearchParams({
    [statusKey]: statusValue
  });

  return `${base}?${params.toString()}` as Route;
}

async function enrichRefinementContactDataAction(formData: FormData): Promise<void> {
  "use server";

  await requireAdminUser();

  const refinementId = normalizeRequired(formData.get("refinement_id"));
  if (!refinementId) {
    redirect("/admin/ai-queue");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("external_offer_refinement_queue")
    .select("*")
    .eq("id", refinementId)
    .maybeSingle();

  const entry = data as RefinementEntry | null;

  if (error || !entry) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[admin-ai-queue-detail] load refinement for enrichment failed", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
    }

    redirect(buildDetailRedirectUrl(refinementId, "enrichmentStatus", "error"));
  }

  if (entry.contact_email && entry.clinic_address && entry.contact_phone) {
    redirect(buildDetailRedirectUrl(refinementId, "enrichmentStatus", "success"));
  }

  try {
    const enriched = await enrichExternalOfferContactData({
      sourceUrl: entry.source_url,
      hospitalName: entry.hospital_name,
      currentEmail: entry.contact_email,
      currentAddress: entry.clinic_address,
      currentPhone: entry.contact_phone
    });

    const nextValues = {
      contact_email: entry.contact_email ?? enriched.contact_email,
      clinic_address: entry.clinic_address ?? enriched.clinic_address,
      contact_phone: entry.contact_phone ?? enriched.contact_phone,
      enriched_contact_email_source_url:
        entry.enriched_contact_email_source_url ?? (entry.contact_email ? null : enriched.enriched_contact_email_source_url),
      enriched_clinic_address_source_url:
        entry.enriched_clinic_address_source_url ?? (entry.clinic_address ? null : enriched.enriched_clinic_address_source_url),
      enriched_contact_phone_source_url:
        entry.enriched_contact_phone_source_url ?? (entry.contact_phone ? null : enriched.enriched_contact_phone_source_url)
    };

    const changed =
      nextValues.contact_email !== entry.contact_email ||
      nextValues.clinic_address !== entry.clinic_address ||
      nextValues.contact_phone !== entry.contact_phone;

    if (!changed) {
      redirect(buildDetailRedirectUrl(refinementId, "enrichmentStatus", "notFound"));
    }

    const { error: updateError } = await supabase
      .from("external_offer_refinement_queue")
      .update(nextValues)
      .eq("id", refinementId);

    if (updateError) {
      throw updateError;
    }
  } catch (enrichmentError) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[admin-ai-queue-detail] enrichment failed", {
        message: enrichmentError instanceof Error ? enrichmentError.message : String(enrichmentError),
        stack: enrichmentError instanceof Error ? enrichmentError.stack : undefined
      });
    }

    redirect(buildDetailRedirectUrl(refinementId, "enrichmentStatus", "error"));
  }

  revalidatePath("/admin/ai-queue");
  revalidatePath(buildDetailRedirectUrl(refinementId));
  redirect(buildDetailRedirectUrl(refinementId, "enrichmentStatus", "success"));
}

async function saveRefinementEntryAction(formData: FormData): Promise<void> {
  "use server";

  await requireAdminUser();

  const refinementId = normalizeRequired(formData.get("refinement_id"));
  const title = normalizeRequired(formData.get("title"));
  const hospitalName = normalizeRequired(formData.get("hospital_name"));
  const sourceUrl = normalizeRequired(formData.get("source_url"));
  const contactEmail = normalizeOptional(formData.get("contact_email"));

  if (!refinementId || !title || !hospitalName || !sourceUrl) {
    redirect(buildDetailRedirectUrl(refinementId, "saveStatus", "validation"));
  }

  if (!isValidOptionalEmail(contactEmail)) {
    redirect(buildDetailRedirectUrl(refinementId, "saveStatus", "invalidEmail"));
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("external_offer_refinement_queue")
    .update({
      title,
      hospital_name: hospitalName,
      location: normalizeOptional(formData.get("location")),
      clinic_address: normalizeOptional(formData.get("clinic_address")),
      contact_person: normalizeOptional(formData.get("contact_person")),
      salutation: normalizeSalutation(formData.get("salutation")),
      contact_email: contactEmail,
      contact_phone: normalizeOptional(formData.get("contact_phone")),
      specialty: normalizeOptional(formData.get("specialty")),
      contract_type: normalizeContractType(formData.get("contract_type")),
      summary: normalizeOptional(formData.get("summary")),
      source_name: normalizeOptional(formData.get("source_name")),
      source_url: sourceUrl,
      external_offer_id: normalizeOptional(formData.get("external_offer_id"))
    })
    .eq("id", refinementId);

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[admin-ai-queue-detail] save refinement failed", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    }

    redirect(buildDetailRedirectUrl(refinementId, "saveStatus", "error"));
  }

  revalidatePath("/admin/ai-queue");
  revalidatePath(buildDetailRedirectUrl(refinementId));
  redirect(buildDetailRedirectUrl(refinementId, "saveStatus", "success"));
}

async function publishRefinementEntryAction(formData: FormData): Promise<void> {
  "use server";

  await requireAdminUser();

  const refinementId = String(formData.get("refinement_id") ?? "").trim();
  if (!refinementId) {
    redirect("/admin/ai-queue");
  }

  const supabase = await createServerSupabaseClient();
  const { data: refinementData, error: refinementError } = await supabase
    .from("external_offer_refinement_queue")
    .select("*")
    .eq("id", refinementId)
    .maybeSingle();

  const refinement = refinementData as RefinementEntry | null;

  if (refinementError || !refinement) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[admin-ai-queue-detail] load refinement failed", {
        message: refinementError?.message,
        details: refinementError?.details,
        hint: refinementError?.hint,
        code: refinementError?.code
      });
    }

    redirect(buildDetailRedirectUrl(refinementId, "publishStatus", "error"));
  }

  if (refinement.refinement_status !== "succeeded" || !refinement.title || !refinement.hospital_name) {
    redirect(buildDetailRedirectUrl(refinementId, "publishStatus", "validation"));
  }

  const payload = {
    title: refinement.title,
    hospital_name: refinement.hospital_name,
    location: refinement.location,
    clinic_address: refinement.clinic_address,
    contact_person: refinement.contact_person,
    salutation: refinement.salutation,
    contact_email: refinement.contact_email,
    contact_phone: refinement.contact_phone,
    specialty: refinement.specialty,
    contract_type: refinement.contract_type,
    summary: refinement.summary,
    source_name: refinement.source_name,
    source_url: refinement.source_url,
    external_offer_id: refinement.external_offer_id,
    is_active: true
  };

  let publishedExternalOfferId = refinement.published_external_offer_id;

  if (publishedExternalOfferId) {
    const { error: updatePublishedError } = await supabase
      .from("external_job_offers")
      .update(payload)
      .eq("id", publishedExternalOfferId);

    if (updatePublishedError) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[admin-ai-queue-detail] update published external offer failed", {
          message: updatePublishedError.message,
          details: updatePublishedError.details,
          hint: updatePublishedError.hint,
          code: updatePublishedError.code
        });
      }

      redirect(buildDetailRedirectUrl(refinementId, "publishStatus", "error"));
    }
  } else {
    if (refinement.source_name && refinement.external_offer_id) {
      const { data: existingOffer } = await supabase
        .from("external_job_offers")
        .select("id")
        .eq("source_name", refinement.source_name)
        .eq("external_offer_id", refinement.external_offer_id)
        .maybeSingle();

      publishedExternalOfferId = existingOffer?.id ?? null;
    }

    if (publishedExternalOfferId) {
      const { error: updateExistingError } = await supabase
        .from("external_job_offers")
        .update(payload)
        .eq("id", publishedExternalOfferId);

      if (updateExistingError) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[admin-ai-queue-detail] update existing external offer failed", {
            message: updateExistingError.message,
            details: updateExistingError.details,
            hint: updateExistingError.hint,
            code: updateExistingError.code
          });
        }

        redirect(buildDetailRedirectUrl(refinementId, "publishStatus", "error"));
      }
    } else {
      const { data: createdOffer, error: createPublishedError } = await supabase
        .from("external_job_offers")
        .insert(payload)
        .select("id")
        .single();

      if (createPublishedError || !createdOffer?.id) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[admin-ai-queue-detail] create published external offer failed", {
            message: createPublishedError?.message,
            details: createPublishedError?.details,
            hint: createPublishedError?.hint,
            code: createPublishedError?.code
          });
        }

        redirect(buildDetailRedirectUrl(refinementId, "publishStatus", "error"));
      }

      publishedExternalOfferId = createdOffer.id;
    }
  }

  const { error: updateQueueError } = await supabase
    .from("external_offer_refinement_queue")
    .update({ published_external_offer_id: publishedExternalOfferId })
    .eq("id", refinement.id);

  if (updateQueueError) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[admin-ai-queue-detail] update queue publish reference failed", {
        message: updateQueueError.message,
        details: updateQueueError.details,
        hint: updateQueueError.hint,
        code: updateQueueError.code
      });
    }

    redirect(buildDetailRedirectUrl(refinementId, "publishStatus", "error"));
  }

  revalidatePath("/admin/ai-queue");
  revalidatePath("/admin/external-offers");
  revalidatePath("/dashboard/doctor/external-offers");
  revalidatePath(buildDetailRedirectUrl(refinementId));
  redirect(buildDetailRedirectUrl(refinementId, "publishStatus", "success"));
}

async function retryRefinementEntryAction(formData: FormData): Promise<void> {
  "use server";

  await requireAdminUser();

  const refinementId = String(formData.get("refinement_id") ?? "").trim();
  if (!refinementId) {
    redirect("/admin/ai-queue");
  }

  const supabase = await createServerSupabaseClient();
  const { data: refinementData, error: refinementError } = await supabase
    .from("external_offer_refinement_queue")
    .select("*")
    .eq("id", refinementId)
    .maybeSingle();

  const refinement = refinementData as RefinementEntry | null;

  if (refinementError || !refinement) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[admin-ai-queue-detail] load refinement for retry failed", {
        message: refinementError?.message,
        details: refinementError?.details,
        hint: refinementError?.hint,
        code: refinementError?.code
      });
    }

    redirect(buildDetailRedirectUrl(refinementId, "retryStatus", "error"));
  }

  const rawText = refinement.raw_text_snapshot?.trim() ?? "";
  if (!rawText) {
    redirect(buildDetailRedirectUrl(refinementId, "retryStatus", "noRawText"));
  }

  const { error: markPendingError } = await supabase
    .from("external_offer_refinement_queue")
    .update({
      refinement_status: "pending",
      error_message: null
    })
    .eq("id", refinement.id);

  if (markPendingError) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[admin-ai-queue-detail] mark refinement pending for retry failed", {
        message: markPendingError.message,
        details: markPendingError.details,
        hint: markPendingError.hint,
        code: markPendingError.code
      });
    }

    redirect(buildDetailRedirectUrl(refinementId, "retryStatus", "error"));
  }

  try {
    const draft = await refineExternalOfferRawItem({
      sourceUrl: refinement.source_url,
      sourceName: refinement.source_name,
      rawText
    });

    const { error: updateQueueError } = await supabase
      .from("external_offer_refinement_queue")
      .update({
        source_name: draft.source_name,
        refinement_status: "succeeded",
        error_message: null,
        title: draft.title,
        hospital_name: draft.hospital_name,
        location: draft.location,
        clinic_address: draft.clinic_address,
        contact_person: draft.contact_person,
        salutation: draft.salutation,
        contact_email: draft.contact_email,
        contact_phone: draft.contact_phone,
        specialty: draft.specialty,
        contract_type: draft.contract_type,
        summary: draft.summary,
        external_offer_id: draft.external_offer_id
      })
      .eq("id", refinement.id);

    if (updateQueueError) {
      throw updateQueueError;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Die KI-Aufbereitung konnte nicht abgeschlossen werden.";
    const retryable = isTemporaryExternalOfferRefinementError(error);

    if (process.env.NODE_ENV !== "production") {
      console.error("[admin-ai-queue-detail] retry refinement failed", {
        message,
        retryable,
        stack: error instanceof Error ? error.stack : undefined
      });
    }

    await supabase
      .from("external_offer_refinement_queue")
      .update({
        refinement_status: "failed",
        error_message: message
      })
      .eq("id", refinement.id);

    revalidatePath("/admin/ai-queue");
    revalidatePath(buildDetailRedirectUrl(refinementId));
    redirect(
      buildDetailRedirectUrl(
        refinementId,
        "retryStatus",
        retryable ? "temporaryUnavailable" : "error"
      )
    );
  }

  revalidatePath("/admin/ai-queue");
  revalidatePath(buildDetailRedirectUrl(refinementId));
  redirect(buildDetailRedirectUrl(refinementId, "retryStatus", "success"));
}

async function deleteRefinementEntryAction(formData: FormData): Promise<void> {
  "use server";

  await requireAdminUser();

  const refinementId = String(formData.get("refinement_id") ?? "").trim();
  if (!refinementId) {
    redirect("/admin/ai-queue?deleteStatus=error");
  }

  const result = await deleteRefinementQueueEntryById(refinementId);

  if (!result.ok) {
    const status = result.reason === "blocked_published" ? "blockedPublished" : "error";
    redirect(buildDetailRedirectUrl(refinementId, "deleteStatus", status));
  }

  revalidatePath("/admin/ai-queue");
  revalidatePath("/admin/import-monitor");
  redirect("/admin/ai-queue?deleteStatus=success");
}

function formatContractType(value: RefinementEntry["contract_type"]) {
  if (value === "honorar") return "Honorar";
  if (value === "befristet") return "Befristet";
  if (value === "unbefristet") return "Unbefristet";
  return null;
}

function getQualityBadgeClass(classification: ReturnType<typeof getExternalOfferQuality>["classification"]) {
  if (classification === "Bereit zur Veroeffentlichung") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (classification === "Review erforderlich") {
    return "bg-amber-50 text-amber-800";
  }

  return "bg-rose-50 text-rose-700";
}

export default async function AdminAiQueueDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("external_offer_refinement_queue")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const entry = (data as RefinementEntry | null) ?? null;

  if (!entry) {
    notFound();
  }

  const quality = getExternalOfferQuality(entry);

  const saveStatusValue = resolvedSearchParams?.saveStatus;
  const saveStatus = Array.isArray(saveStatusValue) ? saveStatusValue[0] : saveStatusValue;
  const publishStatusValue = resolvedSearchParams?.publishStatus;
  const publishStatus = Array.isArray(publishStatusValue) ? publishStatusValue[0] : publishStatusValue;
  const retryStatusValue = resolvedSearchParams?.retryStatus;
  const retryStatus = Array.isArray(retryStatusValue) ? retryStatusValue[0] : retryStatusValue;
  const deleteStatusValue = resolvedSearchParams?.deleteStatus;
  const deleteStatus = Array.isArray(deleteStatusValue) ? deleteStatusValue[0] : deleteStatusValue;
  const enrichmentStatusValue = resolvedSearchParams?.enrichmentStatus;
  const enrichmentStatus = Array.isArray(enrichmentStatusValue) ? enrichmentStatusValue[0] : enrichmentStatusValue;

  return (
    <DashboardShell
      role="admin"
      title="AI refinement queue"
      description="Bearbeiten Sie einen reviewbaren Entwurf im Detail, bevor er separat in den veroeffentlichten externen Angebotskatalog uebernommen wird."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/ai-queue"
            className="inline-flex h-11 items-center justify-center rounded-full border bg-white px-5 text-sm font-semibold text-foreground transition hover:bg-secondary"
          >
            Zurueck zur Queue
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reviewbare KI-Aufbereitung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {saveStatus === "success" ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Review-Eintrag gespeichert.
              </div>
            ) : null}
            {saveStatus === "validation" ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Bitte fuellen Sie mindestens Titel, Krankenhaus und Source URL aus.
              </div>
            ) : null}
            {saveStatus === "invalidEmail" ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Bitte geben Sie eine gueltige Kontakt-E-Mail-Adresse ein.
              </div>
            ) : null}
            {saveStatus === "error" ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Der Review-Eintrag konnte nicht gespeichert werden.
              </div>
            ) : null}
            {publishStatus === "success" ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Externes Stellenangebot veroeffentlicht.
              </div>
            ) : null}
            {publishStatus === "validation" ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Fuer die Veroeffentlichung werden mindestens Titel und Krankenhaus aus der Review-Queue benoetigt.
              </div>
            ) : null}
            {publishStatus === "error" ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Das externe Stellenangebot konnte nicht veroeffentlicht werden.
              </div>
            ) : null}
            {retryStatus === "success" ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Die KI-Aufbereitung oder Kontakt-Anreicherung wurde erfolgreich aktualisiert.
              </div>
            ) : null}
            {retryStatus === "noRawText" ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Es konnten keine zusaetzlichen expliziten Kontaktdaten gefunden werden.
              </div>
            ) : null}
            {retryStatus === "temporaryUnavailable" ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Gemini ist voruebergehend nicht verfuegbar. Der Queue-Eintrag bleibt erhalten und kann erneut versucht werden.
              </div>
            ) : null}
            {retryStatus === "error" ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Die KI-Aufbereitung konnte nicht erneut gestartet werden.
              </div>
            ) : null}
            {enrichmentStatus === "success" ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Die Kontakt-Anreicherung wurde aktualisiert.
              </div>
            ) : null}
            {enrichmentStatus === "notFound" ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Auf den geprueften Klinikseiten wurden keine zusaetzlichen expliziten Kontaktdaten gefunden.
              </div>
            ) : null}
            {enrichmentStatus === "error" ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Die Kontakt-Anreicherung konnte nicht abgeschlossen werden.
              </div>
            ) : null}
            {deleteStatus === "blockedPublished" ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Veroeffentlichte Queue-Eintraege koennen hier nicht geloescht werden. Loeschen Sie zuerst das veroeffentlichte externe Angebot.
              </div>
            ) : null}
            {deleteStatus === "error" ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Der Queue-Eintrag konnte nicht geloescht werden.
              </div>
            ) : null}

            <article className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                      {entry.refinement_status}
                    </span>
                    {entry.source_name ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                        {entry.source_name}
                      </span>
                    ) : null}
                    {entry.published_external_offer_id ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                        Veroeffentlicht
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm font-medium break-all text-slate-900">{entry.source_url}</p>
                  {entry.error_message ? (
                    <p className="text-sm text-rose-700">{entry.error_message}</p>
                  ) : null}
                </div>
                <p className="text-xs text-slate-500">
                  {new Date(entry.updated_at).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}
                </p>
              </div>

              <div className="mt-5 space-y-6">
                <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getQualityBadgeClass(quality.classification)}`}
                    >
                      Qualitaet {quality.score}/100
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${getQualityBadgeClass(quality.classification)}`}
                    >
                      {quality.classification}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    Basis: Titel, Krankenhaus, Source URL, Zusammenfassung, Standort, Fachrichtung, Vertragsart sowie Kontakt- und Adressfelder.
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Staerken
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {quality.strengths.length ? quality.strengths.join(", ") : "Noch keine positiven Felder erkannt."}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Fehlt noch
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {quality.missing.length ? quality.missing.join(", ") : "Keine offensichtlichen Luecken in der Score-Logik."}
                      </p>
                    </div>
                  </div>
                </div>

                {!entry.contact_email || !entry.clinic_address || entry.contact_phone ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <p className="font-medium">Kontaktlage pruefen</p>
                    <ul className="mt-2 space-y-1 text-amber-800">
                      {!entry.contact_email ? <li>Kontakt-E-Mail fehlt.</li> : null}
                      {!entry.clinic_address ? <li>Klinikadresse fehlt.</li> : null}
                      {entry.contact_phone ? <li>Telefon gefunden: {entry.contact_phone}</li> : null}
                    </ul>
                  </div>
                ) : null}

                <form action={saveRefinementEntryAction} className="space-y-4">
                  <input type="hidden" name="refinement_id" value={entry.id} />
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Editierbare Review-Felder
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`title-${entry.id}`}>Titel</Label>
                      <Input id={`title-${entry.id}`} name="title" defaultValue={entry.title ?? ""} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`hospital-${entry.id}`}>Krankenhaus</Label>
                      <Input
                        id={`hospital-${entry.id}`}
                        name="hospital_name"
                        defaultValue={entry.hospital_name ?? ""}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`location-${entry.id}`}>Standort</Label>
                      <Input id={`location-${entry.id}`} name="location" defaultValue={entry.location ?? ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`clinic-address-${entry.id}`}>Klinikadresse</Label>
                      <Input
                        id={`clinic-address-${entry.id}`}
                        name="clinic_address"
                        defaultValue={entry.clinic_address ?? ""}
                      />
                      {entry.enriched_clinic_address_source_url ? (
                        <p className="text-xs text-slate-500">
                          Quelle Anreicherung: {entry.enriched_clinic_address_source_url}
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`contact-person-${entry.id}`}>Ansprechpartner</Label>
                      <Input
                        id={`contact-person-${entry.id}`}
                        name="contact_person"
                        defaultValue={entry.contact_person ?? ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`salutation-${entry.id}`}>Anrede</Label>
                      <select
                        id={`salutation-${entry.id}`}
                        name="salutation"
                        defaultValue={entry.salutation}
                        className="flex h-11 w-full rounded-2xl border bg-white px-4 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="unbekannt">Unbekannt</option>
                        <option value="frau">Frau</option>
                        <option value="herr">Herr</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`contact-email-${entry.id}`}>Kontakt-E-Mail</Label>
                      <Input
                        id={`contact-email-${entry.id}`}
                        name="contact_email"
                        type="email"
                        defaultValue={entry.contact_email ?? ""}
                      />
                      {entry.enriched_contact_email_source_url ? (
                        <p className="text-xs text-slate-500">
                          Quelle Anreicherung: {entry.enriched_contact_email_source_url}
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`contact-phone-${entry.id}`}>Kontakt-Telefon</Label>
                      <Input
                        id={`contact-phone-${entry.id}`}
                        name="contact_phone"
                        defaultValue={entry.contact_phone ?? ""}
                      />
                      {entry.enriched_contact_phone_source_url ? (
                        <p className="text-xs text-slate-500">
                          Quelle Anreicherung: {entry.enriched_contact_phone_source_url}
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`specialty-${entry.id}`}>Fachrichtung</Label>
                      <Input id={`specialty-${entry.id}`} name="specialty" defaultValue={entry.specialty ?? ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`contract-type-${entry.id}`}>Vertrag</Label>
                      <select
                        id={`contract-type-${entry.id}`}
                        name="contract_type"
                        defaultValue={entry.contract_type ?? ""}
                        className="flex h-11 w-full rounded-2xl border bg-white px-4 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Nicht angegeben</option>
                        <option value="honorar">Honorar</option>
                        <option value="befristet">Befristet</option>
                        <option value="unbefristet">Unbefristet</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`source-name-${entry.id}`}>Quelle</Label>
                      <Input id={`source-name-${entry.id}`} name="source_name" defaultValue={entry.source_name ?? ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`source-url-${entry.id}`}>Source URL</Label>
                      <Input
                        id={`source-url-${entry.id}`}
                        name="source_url"
                        type="url"
                        defaultValue={entry.source_url}
                        required
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor={`external-offer-id-${entry.id}`}>Externe ID</Label>
                      <Input
                        id={`external-offer-id-${entry.id}`}
                        name="external_offer_id"
                        defaultValue={entry.external_offer_id ?? ""}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor={`summary-${entry.id}`}>Zusammenfassung</Label>
                      <Textarea
                        id={`summary-${entry.id}`}
                        name="summary"
                        defaultValue={entry.summary ?? ""}
                        className="min-h-[140px]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" variant="outline">
                      Review speichern
                    </Button>
                  </div>
                </form>

                <div className="space-y-3 border-t pt-6">
                  <div className="flex flex-wrap gap-3">
                    <form action={enrichRefinementContactDataAction}>
                      <input type="hidden" name="refinement_id" value={entry.id} />
                      <Button
                        type="submit"
                        variant="outline"
                        disabled={Boolean(entry.contact_email && entry.clinic_address && entry.contact_phone)}
                      >
                        Kontaktdaten anreichern
                      </Button>
                    </form>
                    <form action={retryRefinementEntryAction}>
                      <input type="hidden" name="refinement_id" value={entry.id} />
                      <Button
                        type="submit"
                        variant="outline"
                        disabled={!entry.raw_text_snapshot?.trim()}
                      >
                        KI-Aufbereitung erneut versuchen
                      </Button>
                    </form>
                    <form action={publishRefinementEntryAction}>
                      <input type="hidden" name="refinement_id" value={entry.id} />
                      <Button type="submit" disabled={entry.refinement_status !== "succeeded"}>
                        {entry.published_external_offer_id ? "Aktualisiert veroeffentlichen" : "Veroeffentlichen"}
                      </Button>
                    </form>
                    <form action={deleteRefinementEntryAction}>
                      <input type="hidden" name="refinement_id" value={entry.id} />
                      <ConfirmSubmitButton
                        type="submit"
                        variant="ghost"
                        confirmMessage="Diesen Queue-Eintrag wirklich loeschen?"
                        className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                      >
                        Loeschen
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Rohtext-Vorschau
                  </p>
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                    {(entry.raw_text_snapshot ?? "Kein Rohtext gespeichert.").slice(0, 2200)}
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                    <p className="font-semibold text-slate-700">Kontakt-Provenienz</p>
                    <div className="mt-2 space-y-1 text-slate-600">
                      <p>
                        E-Mail: {entry.enriched_contact_email_source_url ? `Anreicherung (${entry.enriched_contact_email_source_url})` : entry.contact_email ? "Originalangebot" : "Leer"}
                      </p>
                      <p>
                        Adresse: {entry.enriched_clinic_address_source_url ? `Anreicherung (${entry.enriched_clinic_address_source_url})` : entry.clinic_address ? "Originalangebot" : "Leer"}
                      </p>
                      <p>
                        Telefon: {entry.enriched_contact_phone_source_url ? `Anreicherung (${entry.enriched_contact_phone_source_url})` : entry.contact_phone ? "Originalangebot" : "Leer"}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                    <p className="font-semibold text-slate-700">Aktueller Vertragswert</p>
                    <p className="mt-1 text-slate-600">{formatContractType(entry.contract_type) ?? "Leer"}</p>
                  </div>
                </div>
              </div>
            </article>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
