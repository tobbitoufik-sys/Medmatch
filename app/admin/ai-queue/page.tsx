import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { deleteRefinementQueueEntryById } from "@/lib/external-offers/admin-delete";
import { getExternalOfferQuality } from "@/lib/external-offers/quality";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type RefinementEntry = {
  id: string;
  source_url: string;
  source_name: string | null;
  refinement_status: "pending" | "succeeded" | "failed";
  error_message: string | null;
  title: string | null;
  hospital_name: string | null;
  location: string | null;
  specialty: string | null;
  contract_type: "honorar" | "befristet" | "unbefristet" | null;
  clinic_address: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  summary: string | null;
  published_external_offer_id: string | null;
  updated_at: string;
};

type QueueClassificationFilter = "all" | ReturnType<typeof getExternalOfferQuality>["classification"];
type QueueStatusFilter = "all" | RefinementEntry["refinement_status"];

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

function resolveQueueClassificationFilter(value: string | undefined): QueueClassificationFilter {
  if (
    value === "Bereit zur Veroeffentlichung" ||
    value === "Review erforderlich" ||
    value === "Unvollstaendig"
  ) {
    return value;
  }

  return "all";
}

function resolveQueueStatusFilter(value: string | undefined): QueueStatusFilter {
  if (value === "pending" || value === "succeeded" || value === "failed") {
    return value;
  }

  return "all";
}

function buildQueueFilterHref(
  classification: QueueClassificationFilter,
  status: QueueStatusFilter
): Route {
  const params = new URLSearchParams();
  if (classification !== "all") {
    params.set("classification", classification);
  }
  if (status !== "all") {
    params.set("status", status);
  }

  const query = params.toString();
  return (query ? `/admin/ai-queue?${query}` : "/admin/ai-queue") as Route;
}

async function deleteRefinementQueueAction(formData: FormData): Promise<void> {
  "use server";

  const refinementId = String(formData.get("refinement_id") ?? "").trim();
  if (!refinementId) {
    redirect("/admin/ai-queue?deleteStatus=error");
  }

  const result = await deleteRefinementQueueEntryById(refinementId);

  if (!result.ok) {
    const status = result.reason === "blocked_published" ? "blockedPublished" : "error";
    redirect(`/admin/ai-queue?deleteStatus=${status}`);
  }

  revalidatePath("/admin/ai-queue");
  revalidatePath("/admin/import-monitor");
  redirect("/admin/ai-queue?deleteStatus=success");
}

export default async function AdminAiQueuePage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const deleteStatusValue = resolvedSearchParams?.deleteStatus;
  const deleteStatus = Array.isArray(deleteStatusValue) ? deleteStatusValue[0] : deleteStatusValue;
  const classificationValue = resolvedSearchParams?.classification;
  const selectedClassification = resolveQueueClassificationFilter(
    Array.isArray(classificationValue) ? classificationValue[0] : classificationValue
  );
  const statusValue = resolvedSearchParams?.status;
  const selectedStatus = resolveQueueStatusFilter(Array.isArray(statusValue) ? statusValue[0] : statusValue);
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("external_offer_refinement_queue")
    .select("*")
    .order("updated_at", { ascending: false });

  const entries = ((data as RefinementEntry[] | null) ?? []).filter((entry) => {
    const quality = getExternalOfferQuality(entry);
    const matchesClassification =
      selectedClassification === "all" || quality.classification === selectedClassification;
    const matchesStatus = selectedStatus === "all" || entry.refinement_status === selectedStatus;

    return matchesClassification && matchesStatus;
  });

  return (
    <DashboardShell
      role="admin"
      title="AI refinement queue"
      description="Waehlen Sie einen reviewbaren Entwurf aus der Liste aus und oeffnen Sie ihn zur Bearbeitung auf einer eigenen Detailseite."
    >
      <Card>
        <CardHeader>
          <CardTitle>Reviewbare KI-Aufbereitung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 rounded-2xl border bg-slate-50 p-4">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Klassifikation
              </p>
              <div className="flex flex-wrap gap-2">
                {(["all", "Bereit zur Veroeffentlichung", "Review erforderlich", "Unvollstaendig"] as const).map(
                  (classification) => {
                    const active = selectedClassification === classification;
                    const label = classification === "all" ? "Alle" : classification;

                    return (
                      <Link
                        key={classification}
                        href={buildQueueFilterHref(classification, selectedStatus)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                          active
                            ? "bg-slate-900 text-white"
                            : "bg-white text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {label}
                      </Link>
                    );
                  }
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Status
              </p>
              <div className="flex flex-wrap gap-2">
                {(["all", "pending", "succeeded", "failed"] as const).map((status) => {
                  const active = selectedStatus === status;
                  const label =
                    status === "all"
                      ? "Alle"
                      : status === "pending"
                        ? "Pending"
                        : status === "succeeded"
                          ? "Succeeded"
                          : "Failed";

                  return (
                    <Link
                      key={status}
                      href={buildQueueFilterHref(selectedClassification, status)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        active
                          ? "bg-slate-900 text-white"
                          : "bg-white text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {deleteStatus === "success" ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Queue-Eintrag geloescht.
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

          {entries.length ? (
            <section className="grid gap-4">
              {entries.map((entry) => {
                const quality = getExternalOfferQuality(entry);

                return (
                <div key={entry.id} className="rounded-3xl border bg-white p-5 shadow-sm">
                  <Link
                    href={`/admin/ai-queue/${entry.id}`}
                    className="block transition hover:border-slate-300 hover:opacity-90"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                          {entry.refinement_status}
                        </span>
                        {entry.source_name ? (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                            {entry.source_name}
                          </span>
                        ) : null}
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
                        {entry.published_external_offer_id ? (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                            Veroeffentlicht
                          </span>
                        ) : null}
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                          {entry.title || "Ohne extrahierten Titel"}
                        </h3>
                        <p className="text-sm font-medium text-slate-700">
                          {entry.hospital_name || "Krankenhaus noch nicht erkannt"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                        {entry.location ? <span className="rounded-full bg-slate-100 px-3 py-1">{entry.location}</span> : null}
                        {entry.specialty ? <span className="rounded-full bg-slate-100 px-3 py-1">{entry.specialty}</span> : null}
                        {formatContractType(entry.contract_type) ? (
                          <span className="rounded-full bg-slate-100 px-3 py-1">
                            {formatContractType(entry.contract_type)}
                          </span>
                        ) : null}
                      </div>

                      <p className="line-clamp-2 text-sm text-slate-600">
                        {entry.summary || entry.error_message || "Noch keine Zusammenfassung verfuegbar."}
                      </p>

                      <p className="text-xs text-slate-500">
                        {quality.missing.length
                          ? `Fehlt noch: ${quality.missing.slice(0, 3).join(", ")}`
                          : "Alle Kernfelder fuer die Review-Bewertung sind vorhanden."}
                      </p>

                      <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                        <p className="break-all">{entry.source_url}</p>
                        <p>
                          {new Date(entry.updated_at).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <div className="mt-3 flex justify-end">
                    <form action={deleteRefinementQueueAction}>
                      <input type="hidden" name="refinement_id" value={entry.id} />
                      <ConfirmSubmitButton
                        type="submit"
                        variant="ghost"
                        size="sm"
                        confirmMessage="Diesen Queue-Eintrag wirklich loeschen?"
                        className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                      >
                        Loeschen
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>
              )})}
            </section>
          ) : (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Noch keine KI-Aufbereitungen vorhanden. Starten Sie einen Rohimport unter Import runs und loesen Sie die Aufbereitung dort aus.
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
