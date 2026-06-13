import Link from "next/link";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  getContactRequests,
  getDoctorProfiles,
  getFacilityProfiles,
  getJobOffers,
  getUsers
} from "@/lib/data/repository";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type SourceScanRecord = {
  listing_url: string;
  created_at: string;
  new_offers: Array<{ url: string; title: string | null }> | null;
};

type SourceMemoryRecord = {
  offer_url: string;
  pipeline_imported_at: string | null;
};

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient();

  const [users, doctors, facilities, offers, contacts, externalOffersCountResult, latestSourceScanResult] =
    await Promise.all([
      getUsers(),
      getDoctorProfiles(),
      getFacilityProfiles(),
      getJobOffers(),
      getContactRequests(),
      supabase.from("external_job_offers").select("*", { count: "exact", head: true }),
      supabase
        .from("external_source_scan_runs")
        .select("listing_url, created_at, new_offers")
        .eq("source_name", "praktischarzt.de")
        .eq("run_status", "succeeded")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

  const publicDoctorProfiles = doctors.filter((doctor) => doctor.is_public).length;
  const externalOffersCount = externalOffersCountResult.count ?? 0;
  const latestSourceScan = (latestSourceScanResult.data as SourceScanRecord | null) ?? null;
  const latestNewOfferUrls = (latestSourceScan?.new_offers ?? []).map((offer) => offer.url).filter(Boolean);
  const waitingSourceMemoryResult = latestNewOfferUrls.length
    ? await supabase
        .from("external_source_offer_memory")
        .select("offer_url, pipeline_imported_at")
        .eq("source_name", "praktischarzt.de")
        .in("offer_url", latestNewOfferUrls)
    : { data: [] };
  const waitingSourceMemoryRows =
    ((waitingSourceMemoryResult.data as SourceMemoryRecord[] | null) ?? []);
  const waitingImportCount = waitingSourceMemoryRows.filter((row) => !row.pipeline_imported_at).length;

  return (
    <DashboardShell
      role="admin"
      title="Admin Dashboard"
      description="Zentrale MedMatch-Übersicht für Plattformstatistiken, externe Stellen und die nächsten Import- und AI-Workflows."
    >
      {latestSourceScan ? (
        <Card
          className={
            waitingImportCount > 0
              ? "border-sky-200 bg-sky-50/70"
              : "border-slate-200 bg-slate-50/60"
          }
        >
          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Praktischarzt Watcher
              </p>
              <p className="text-base font-semibold text-slate-900">
                {waitingImportCount > 0
                  ? `${waitingImportCount} neue Praktischarzt-Angebote warten auf manuellen Import.`
                  : "Aktuell warten keine neuen Praktischarzt-Angebote auf manuellen Import."}
              </p>
              <p className="text-sm text-slate-600">
                Letzter erfolgreicher Scan:{" "}
                {new Date(latestSourceScan.created_at).toLocaleString("de-DE", {
                  timeZone: "Europe/Berlin"
                })}
              </p>
            </div>
            <Button asChild variant={waitingImportCount > 0 ? "default" : "outline"}>
              <Link href="/admin/import-runs">Zu den Import runs</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Users" value={String(users.length)} hint="Registrierte Accounts auf MedMatch." />
        <StatCard title="Generated CVs" value="-" hint="Für das Tracking vorbereitet." />
        <StatCard
          title="Generated motivation letters"
          value="-"
          hint="Für das Tracking vorbereitet."
        />
        <StatCard title="Generated emails" value="-" hint="Für das Tracking vorbereitet." />
        <StatCard
          title="External offers"
          value={String(externalOffersCount)}
          hint="Importierte externe Stellenangebote."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Aktueller Plattformstatus</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <StatCard
              title="Doctors"
              value={String(doctors.length)}
              hint="Arztprofile auf der Plattform."
              href="/admin/users"
            />
            <StatCard
              title="Facilities"
              value={String(facilities.length)}
              hint="Einrichtungsprofile auf der Plattform."
            />
            <StatCard title="Offers" value={String(offers.length)} hint="Native veröffentlichte Stellen." />
            <StatCard title="Contacts" value={String(contacts.length)} hint="Erfasste Kontaktanfragen." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin-Bereiche in Vorbereitung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-2xl border p-4">
              <p className="font-medium text-foreground">Statistics</p>
              <p>Zentrale Plattformmetriken und Generierungszahlen.</p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="font-medium text-foreground">External offers</p>
              <p>Verwaltung importierter Stellenangebote getrennt vom nativen Offer-Flow.</p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="font-medium text-foreground">Import runs</p>
              <p>Kontrolle zukuenftiger Importlaeufe und Quellensynchronisationen.</p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="font-medium text-foreground">AI refinement queue</p>
              <p>Überblick über spätere AI-Aufbereitung und Review-Schritte.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <StatCard
        title="Public doctor profiles"
        value={String(publicDoctorProfiles)}
        hint="Profile im öffentlichen Ärzteverzeichnis."
      />
    </DashboardShell>
  );
}
