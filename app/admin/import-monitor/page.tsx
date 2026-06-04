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

type MonitorRow = {
  id: string;
  title: string | null;
  hospital_name: string | null;
  location: string | null;
  specialty: string | null;
  contract_type: "honorar" | "befristet" | "unbefristet" | null;
  clinic_address: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  source_url: string;
  summary: string | null;
  source_name: string | null;
  refinement_status: "pending" | "succeeded" | "failed";
  published_external_offer_id: string | null;
  updated_at: string;
};

type MonitorStatusFilter = "all" | "imported-refined" | "failed" | "published" | "not-published";
type MonitorQualityFilter = "all" | "80-100" | "50-79" | "0-49";

function startOfBerlinDayIso() {
  const now = new Date();
  const berlinDate = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);

  return `${berlinDate}T00:00:00+02:00`;
}

function statusLabel(status: MonitorRow["refinement_status"]) {
  if (status === "succeeded") return "Refined";
  if (status === "failed") return "Failed";
  return "Pending";
}

function resolveMonitorStatusFilter(value: string | undefined): MonitorStatusFilter {
  if (
    value === "imported-refined" ||
    value === "failed" ||
    value === "published" ||
    value === "not-published"
  ) {
    return value;
  }

  return "all";
}

function resolveMonitorQualityFilter(value: string | undefined): MonitorQualityFilter {
  if (value === "80-100" || value === "50-79" || value === "0-49") {
    return value;
  }

  return "all";
}

function buildMonitorFilterHref(status: MonitorStatusFilter, quality: MonitorQualityFilter): Route {
  const params = new URLSearchParams();
  if (status !== "all") {
    params.set("status", status);
  }
  if (quality !== "all") {
    params.set("quality", quality);
  }

  const query = params.toString();
  return (query ? `/admin/import-monitor?${query}` : "/admin/import-monitor") as Route;
}

async function deleteRefinementFromMonitorAction(formData: FormData): Promise<void> {
  "use server";

  const refinementId = String(formData.get("refinement_id") ?? "").trim();
  if (!refinementId) {
    redirect("/admin/import-monitor?deleteStatus=error");
  }

  const result = await deleteRefinementQueueEntryById(refinementId);

  if (!result.ok) {
    const status = result.reason === "blocked_published" ? "blockedPublished" : "error";
    redirect(`/admin/import-monitor?deleteStatus=${status}`);
  }

  revalidatePath("/admin/import-monitor");
  revalidatePath("/admin/ai-queue");
  redirect("/admin/import-monitor?deleteStatus=success");
}

export default async function AdminImportMonitorPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const deleteStatusValue = resolvedSearchParams?.deleteStatus;
  const deleteStatus = Array.isArray(deleteStatusValue) ? deleteStatusValue[0] : deleteStatusValue;
  const statusValue = resolvedSearchParams?.status;
  const selectedStatus = resolveMonitorStatusFilter(Array.isArray(statusValue) ? statusValue[0] : statusValue);
  const qualityValue = resolvedSearchParams?.quality;
  const selectedQuality = resolveMonitorQualityFilter(Array.isArray(qualityValue) ? qualityValue[0] : qualityValue);
  const supabase = await createServerSupabaseClient();
  const startOfToday = startOfBerlinDayIso();

  const [
    totalImportedResult,
    importedTodayResult,
    refinementSucceededResult,
    refinementFailedResult,
    publishedResult,
    failedImportsResult,
    monitorRowsResult
  ] = await Promise.all([
    supabase.from("external_offer_import_items").select("*", { count: "exact", head: true }),
    supabase
      .from("external_offer_import_items")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfToday),
    supabase
      .from("external_offer_refinement_queue")
      .select("*", { count: "exact", head: true })
      .eq("refinement_status", "succeeded"),
    supabase
      .from("external_offer_refinement_queue")
      .select("*", { count: "exact", head: true })
      .eq("refinement_status", "failed"),
    supabase.from("external_job_offers").select("*", { count: "exact", head: true }),
    supabase
      .from("external_offer_import_runs")
      .select("*", { count: "exact", head: true })
      .eq("import_status", "failed"),
    supabase
      .from("external_offer_refinement_queue")
      .select("id, title, hospital_name, location, specialty, contract_type, clinic_address, contact_email, contact_phone, source_url, summary, source_name, refinement_status, published_external_offer_id, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100)
  ]);

  const rows = ((monitorRowsResult.data as MonitorRow[] | null) ?? []).filter((row) => {
    const quality = getExternalOfferQuality(row);
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "imported-refined" && row.refinement_status === "succeeded") ||
      (selectedStatus === "failed" && row.refinement_status === "failed") ||
      (selectedStatus === "published" && Boolean(row.published_external_offer_id)) ||
      (selectedStatus === "not-published" && !row.published_external_offer_id);
    const matchesQuality =
      selectedQuality === "all" ||
      (selectedQuality === "80-100" && quality.score >= 80) ||
      (selectedQuality === "50-79" && quality.score >= 50 && quality.score < 80) ||
      (selectedQuality === "0-49" && quality.score < 50);

    return matchesStatus && matchesQuality;
  });
  const counters = [
    { label: "Total imported offers", value: totalImportedResult.count ?? 0 },
    { label: "Imported today", value: importedTodayResult.count ?? 0 },
    { label: "Refinement succeeded", value: refinementSucceededResult.count ?? 0 },
    { label: "Refinement failed", value: refinementFailedResult.count ?? 0 },
    { label: "Published", value: publishedResult.count ?? 0 },
    { label: "Failed imports", value: failedImportsResult.count ?? 0 }
  ];

  return (
    <DashboardShell
      role="admin"
      title="Import monitor"
      description="Kompakter Betriebsmonitor fuer importierte externe Stellen, Refinement-Status und Veroeffentlichungsstand."
    >
      <div className="space-y-6">
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

        <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {counters.map((counter) => (
            <Card key={counter.label}>
              <CardContent className="space-y-1 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {counter.label}
                </p>
                <p className="text-2xl font-semibold tracking-tight text-slate-900">{counter.value}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Importierte und verfeinerte Angebote</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-3 rounded-2xl border bg-slate-50 p-4">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {(["all", "imported-refined", "failed", "published", "not-published"] as const).map((status) => {
                    const active = selectedStatus === status;
                    const label =
                      status === "all"
                        ? "Alle"
                        : status === "imported-refined"
                          ? "Imported / refined"
                          : status === "failed"
                            ? "Failed"
                            : status === "published"
                              ? "Published"
                              : "Not published";

                    return (
                      <Link
                        key={status}
                        href={buildMonitorFilterHref(status, selectedQuality)}
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

              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Qualitaet
                </p>
                <div className="flex flex-wrap gap-2">
                  {(["all", "80-100", "50-79", "0-49"] as const).map((qualityFilter) => {
                    const active = selectedQuality === qualityFilter;

                    return (
                      <Link
                        key={qualityFilter}
                        href={buildMonitorFilterHref(selectedStatus, qualityFilter)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                          active
                            ? "bg-slate-900 text-white"
                            : "bg-white text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {qualityFilter === "all" ? "Alle" : qualityFilter}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {rows.length ? (
              <div className="overflow-hidden rounded-2xl border">
                <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_130px_120px_80px_110px_170px_90px] gap-3 border-b bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <span>Titel</span>
                  <span>Krankenhaus</span>
                  <span>Quelle</span>
                  <span>Status</span>
                  <span>Qual.</span>
                  <span>Published</span>
                  <span>Zeit</span>
                  <span>Aktion</span>
                </div>

                {rows.map((row) => {
                  const quality = getExternalOfferQuality(row);

                  return (
                  <div
                    key={row.id}
                    className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_130px_120px_80px_110px_170px_90px] gap-3 border-b px-4 py-3 text-sm text-slate-700"
                  >
                    <Link href={`/admin/ai-queue/${row.id}`} className="truncate font-medium text-slate-900 transition hover:text-slate-700">
                      {row.title || "Ohne Titel"}
                    </Link>
                    <Link href={`/admin/ai-queue/${row.id}`} className="truncate transition hover:text-slate-900">
                      {row.hospital_name || "Nicht erkannt"}
                    </Link>
                    <Link href={`/admin/ai-queue/${row.id}`} className="truncate transition hover:text-slate-900">
                      {row.source_name || "Unbekannt"}
                    </Link>
                    <Link href={`/admin/ai-queue/${row.id}`} className="transition hover:text-slate-900">
                      {statusLabel(row.refinement_status)}
                    </Link>
                    <Link href={`/admin/ai-queue/${row.id}`} className="transition hover:text-slate-900">
                      {quality.score}
                    </Link>
                    <Link href={`/admin/ai-queue/${row.id}`} className="transition hover:text-slate-900">
                      {row.published_external_offer_id ? "Ja" : "Nein"}
                    </Link>
                    <Link href={`/admin/ai-queue/${row.id}`} className="text-xs text-slate-500 transition hover:text-slate-700">
                      {new Date(row.updated_at).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}
                    </Link>
                    <form action={deleteRefinementFromMonitorAction}>
                      <input type="hidden" name="refinement_id" value={row.id} />
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
                )})}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Noch keine importierten oder verfeinerten Angebote verfuegbar.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
