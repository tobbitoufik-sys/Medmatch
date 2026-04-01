import Link from "next/link";
import type { Route } from "next";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  applicationStatusBadgeClass,
  applicationStatusLabels,
  type ApplicationStatus
} from "@/lib/applications";
import { getUnreadConversationCount } from "@/lib/application-conversations";
import { getDoctorPublishedOffers } from "@/lib/data/doctor-opportunities";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DoctorProfile } from "@/types";
import { calculateDoctorProfileCompletion, getCurrentUser } from "@/lib/data/repository";

function formatDate(value: string | null | undefined) {
  if (!value) return "Nicht verfügbar";

  return new Intl.DateTimeFormat("de-DE", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function toTitleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getGreetingName(options: {
  profileFirstName?: string | null;
  profileLastName?: string | null;
  userFullName?: string | null;
  userEmail?: string | null;
}) {
  const firstName = options.profileFirstName?.trim();
  if (firstName) return toTitleCase(firstName);

  const fullName = [options.profileFirstName?.trim(), options.profileLastName?.trim()]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (fullName) return toTitleCase(fullName);

  const fallbackFullName = options.userFullName?.trim();
  if (fallbackFullName) return toTitleCase(fallbackFullName);

  const emailLocalPart = options.userEmail?.split("@")[0]?.trim();
  if (!emailLocalPart) return null;

  const cleanedFallback = emailLocalPart
    .split(/[._]+/)
    .filter(Boolean)
    .join(" ");

  return cleanedFallback ? toTitleCase(cleanedFallback) : null;
}

type DoctorApplicationRow = {
  id: string;
  offer_id: string;
  facility_id: string;
  status: ApplicationStatus;
  created_at: string;
};

export default async function DoctorDashboardPage() {
  const user = await getCurrentUser("doctor");
  let profile: DoctorProfile | null = null;
  let unreadConversations = 0;
  let recentApplications: DoctorApplicationRow[] = [];
  let applicationsCount = 0;
  let activeApplicationsCount = 0;
  let conversationApplicationIds = new Set<string>();
  let offerTitleMap = new Map<string, string>();
  let facilityNameMap = new Map<string, string>();

  if (user) {
    const supabase = await createServerSupabaseClient();
    const [
      { data: profileData },
      unreadCount,
      { data: applicationRows, count: totalApplications },
      { data: conversationRows }
    ] = await Promise.all([
      supabase.from("doctor_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      getUnreadConversationCount("doctor", user.id),
      supabase
        .from("applications")
        .select("id, offer_id, facility_id, status, created_at", { count: "exact" })
        .eq("doctor_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("application_conversations")
        .select("application_id")
        .eq("doctor_user_id", user.id)
    ]);

    profile = (profileData as DoctorProfile | null) ?? null;
    unreadConversations = unreadCount;
    recentApplications = (applicationRows as DoctorApplicationRow[] | null) ?? [];
    applicationsCount = totalApplications ?? recentApplications.length;
    activeApplicationsCount = recentApplications.filter(
      (application) => application.status !== "accepted" && application.status !== "rejected"
    ).length;
    conversationApplicationIds = new Set(
      ((conversationRows as { application_id: string }[] | null) ?? []).map(
        (conversation) => conversation.application_id
      )
    );

    const offerIds = [...new Set(recentApplications.map((application) => application.offer_id))];
    const facilityIds = [...new Set(recentApplications.map((application) => application.facility_id))];

    const [{ data: offersData }, { data: facilitiesData }] = await Promise.all([
      offerIds.length
        ? supabase.from("job_offers").select("id, title").in("id", offerIds)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      facilityIds.length
        ? supabase
            .from("facility_profiles")
            .select("id, facility_name")
            .in("id", facilityIds)
        : Promise.resolve({ data: [] as { id: string; facility_name: string }[] })
    ]);

    offerTitleMap = new Map(
      (((offersData as { id: string; title: string }[] | null) ?? []).map((offer) => [
        offer.id,
        offer.title
      ]))
    );
    facilityNameMap = new Map(
      (((facilitiesData as { id: string; facility_name: string }[] | null) ?? []).map(
        (facility) => [facility.id, facility.facility_name]
      ))
    );
  }

  const offers = await getDoctorPublishedOffers();
  const profileCompletion = calculateDoctorProfileCompletion(profile);
  const greetingName = getGreetingName({
    profileFirstName: profile?.first_name,
    profileLastName: profile?.last_name,
    userFullName: user?.full_name,
    userEmail: user?.email
  });

  return (
    <DashboardShell
      role="doctor"
      title={greetingName ? `Hallo, ${greetingName}` : "Hallo"}
      description="Verwalten Sie Ihre Bewerbungen, Nachrichten und neue Möglichkeiten."
    >
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="Bewerbungen"
          value={String(applicationsCount)}
          hint={`${activeApplicationsCount} aktive Bewerbungen`}
          href={"/dashboard/doctor/applications" as Route}
        />
        <StatCard
          title="Postfach"
          value={String(unreadConversations)}
          hint={unreadConversations > 0 ? "Ungelesene Unterhaltungen warten auf Sie." : "Postfach öffnen"}
          href={"/dashboard/doctor/contacts" as Route}
        />
        <StatCard
          title="Offene Stellen"
          value={String(offers.length)}
          hint="Aktuelle veröffentlichte Stellen ansehen."
          href="/dashboard/doctor/opportunities"
        />
      </div>

      <Link
        href="/dashboard/doctor/cv"
        className="group block rounded-3xl border border-blue-100 bg-gradient-to-r from-sky-50 to-blue-100/80 p-6 transition-all hover:-translate-y-0.5 hover:from-sky-100 hover:to-blue-100 hover:shadow-sm"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              CV-Builder
            </div>
            <div className="space-y-1">
              <p className="text-xl font-semibold tracking-tight text-slate-900">Lebenslauf erstellen</p>
              <p className="text-sm text-slate-600">
                Erstellen Sie Ihren medizinischen Lebenslauf aus Ihren Profildaten.
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-slate-800">
              Profil vervollständigen
              <span className="ml-2 transition-transform group-hover:translate-x-0.5">→</span>
            </div>
          </div>
        </div>
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>Letzte Bewerbungen</CardTitle>
            <p className="text-sm text-muted-foreground">
              Verfolgen Sie Ihre neuesten Bewerbungen und springen Sie direkt zum nächsten Schritt.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/doctor/opportunities">Stellenangebote ansehen</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentApplications.length ? (
            recentApplications.map((application) => {
              const hasConversation = conversationApplicationIds.has(application.id);
              const offerTitle =
                offerTitleMap.get(application.offer_id) || "Stellenangebot";
              const facilityName =
                facilityNameMap.get(application.facility_id) || "Einrichtung";

              return (
                <div
                  key={application.id}
                  className="relative flex flex-col gap-4 rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm lg:flex-row lg:items-center lg:justify-between"
                >
                  <Link
                    aria-label={`Open application details for ${offerTitle}`}
                    className="absolute inset-0 z-10 cursor-pointer rounded-2xl"
                    href={`/dashboard/doctor/applications/${application.id}` as Route}
                  />
                  <div className="pointer-events-none space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-semibold">{offerTitle}</p>
                      <Badge className={applicationStatusBadgeClass[application.status]}>
                        {applicationStatusLabels[application.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{facilityName}</p>
                    <p className="text-sm text-muted-foreground">
                      Eingereicht am {formatDate(application.created_at)}
                    </p>
                  </div>
                  <div className="relative z-20">
                    <Button asChild variant={hasConversation ? "secondary" : "outline"}>
                      <Link
                        href={
                          hasConversation
                            ? (`/dashboard/doctor/applications/${application.id}/contact` as Route)
                            : (`/dashboard/doctor/opportunities/${application.offer_id}` as Route)
                        }
                      >
                        {hasConversation ? "Unterhaltung öffnen" : "Bewerbung öffnen"}
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
              Noch keine Bewerbungen. Sehen Sie sich Stellenangebote an und bewerben Sie sich auf passende Positionen.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profilübersicht</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Aktuelle Position</p>
              <p className="mt-3 font-medium text-foreground">
                {profile?.current_position || profile?.headline || "Nicht angegeben"}
              </p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Fachrichtung</p>
              <p className="mt-3 font-medium text-foreground">{profile?.specialty || "Nicht angegeben"}</p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Standort</p>
              <p className="mt-3 font-medium text-foreground">
                {profile ? `${profile.city}, ${profile.country}` : "Nicht angegeben"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4">
            <p className="text-sm">
              Profilvollständigkeit: <span className="font-semibold text-foreground">{profileCompletion}%</span>
            </p>
            <Button asChild>
              <Link href="/dashboard/doctor/profile">{profile ? "Profil bearbeiten" : "Profil erstellen"}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
