import Link from "next/link";
import type { Route } from "next";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  applicationStatusBadgeClass,
  applicationStatusLabels,
  type ApplicationStatus
} from "@/lib/applications";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/data/repository";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

type DoctorApplicationListItem = {
  id: string;
  offer_id: string;
  facility_id: string;
  status: ApplicationStatus;
  created_at: string;
};

type ApplicationCardItem = {
  id: string;
  offer_id: string;
  status: ApplicationStatus;
  created_at: string;
  offer_title: string;
  facility_name: string;
  location: string;
  has_conversation: boolean;
};

function formatOfferDisplayTitle(title?: string | null, specialty?: string | null) {
  const safeTitle = title || "Stellenangebot";
  return specialty ? `${safeTitle} · ${specialty}` : safeTitle;
}

type FilterKey = "all" | "applied" | "in_review" | "accepted" | "rejected";

const filterDefinitions: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Alle" },
  { key: "applied", label: "Eingereicht" },
  { key: "in_review", label: "In Prüfung" },
  { key: "accepted", label: "Angenommen" },
  { key: "rejected", label: "Abgelehnt" }
];

function matchesFilter(application: ApplicationCardItem, filter: FilterKey) {
  switch (filter) {
    case "all":
      return true;
    case "applied":
      return ["submitted", "received", "contacted"].includes(application.status);
    case "in_review":
      return application.status === "in_review";
    case "accepted":
      return application.status === "accepted";
    case "rejected":
      return application.status === "rejected";
  }
}

export default async function DoctorApplicationsPage({
  searchParams
}: {
  searchParams?: Promise<{ filter?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const requestedFilter = resolvedSearchParams?.filter;
  const activeFilter: FilterKey = filterDefinitions.some((item) => item.key === requestedFilter)
    ? (requestedFilter as FilterKey)
    : "all";

  const user = await getCurrentUser("doctor");
  const supabase = await createServerSupabaseClient();

  let applications: ApplicationCardItem[] = [];

  if (user) {
    const { data } = await supabase
      .from("applications")
      .select("id, offer_id, facility_id, status, created_at")
      .eq("doctor_user_id", user.id)
      .order("created_at", { ascending: false });

    const baseApplications = (data as DoctorApplicationListItem[] | null) ?? [];

    if (baseApplications.length) {
      const offerIds = [...new Set(baseApplications.map((application) => application.offer_id))];
      const facilityIds = [...new Set(baseApplications.map((application) => application.facility_id))];
      const applicationIds = baseApplications.map((application) => application.id);

      const [{ data: offers }, { data: facilities }, { data: conversations }] = await Promise.all([
        supabase
          .from("job_offers")
          .select("id, title, specialty, city, country")
          .in("id", offerIds),
        supabase
          .from("facility_profiles")
          .select("id, facility_name")
          .in("id", facilityIds),
        supabase
          .from("application_conversations")
          .select("application_id")
          .in("application_id", applicationIds)
      ]);

      const offerMap = new Map(
        ((offers ?? []) as Array<{ id: string; title: string; specialty: string; city: string; country: string }>).map((offer) => [
          offer.id,
          offer
        ])
      );
      const facilityMap = new Map(
        ((facilities ?? []) as Array<{ id: string; facility_name: string }>).map((facility) => [
          facility.id,
          facility.facility_name
        ])
      );
      const conversationApplicationIds = new Set(
        ((conversations ?? []) as Array<{ application_id: string }>).map(
          (conversation) => conversation.application_id
        )
      );

      applications = baseApplications.map((application) => {
        const offer = offerMap.get(application.offer_id);

        return {
          id: application.id,
          offer_id: application.offer_id,
          status: application.status,
          created_at: application.created_at,
          offer_title: formatOfferDisplayTitle(offer?.title, offer?.specialty),
          facility_name: facilityMap.get(application.facility_id) || "Einrichtung",
          location: offer ? `${offer.city}, ${offer.country}` : "Standort nicht angegeben",
          has_conversation: conversationApplicationIds.has(application.id)
        };
      });
    }
  }

  const counts: Record<FilterKey, number> = {
    all: applications.length,
    applied: applications.filter((application) => matchesFilter(application, "applied")).length,
    in_review: applications.filter((application) => matchesFilter(application, "in_review")).length,
    accepted: applications.filter((application) => matchesFilter(application, "accepted")).length,
    rejected: applications.filter((application) => matchesFilter(application, "rejected")).length
  };

  const filteredApplications = applications.filter((application) =>
    matchesFilter(application, activeFilter)
  );

  return (
    <DashboardShell
      role="doctor"
      title="Bewerbungen"
      description="Verfolgen Sie alle eingereichten Bewerbungen"
    >
      {applications.length ? (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            {filterDefinitions.map((filter) => {
              const isActive = filter.key === activeFilter;
              const href =
                filter.key === "all"
                  ? ("/dashboard/doctor/applications" as Route)
                  : (`/dashboard/doctor/applications?filter=${filter.key}` as Route);

              return (
                <Link key={filter.key} href={href}>
                  <div
                    className={`rounded-2xl border px-4 py-3 text-sm transition-colors ${
                      isActive
                        ? "border-primary bg-primary/10 text-foreground"
                        : "bg-background text-muted-foreground hover:border-primary/30 hover:bg-secondary/30 hover:text-foreground"
                    }`}
                  >
                    <span className="font-medium">
                      {filter.label} ({counts[filter.key]})
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="space-y-4">
            {filteredApplications.length ? (
              filteredApplications.map((application) => {
                const applicationHref =
                  `/dashboard/doctor/opportunities/${application.offer_id}` as Route;
                const conversationHref =
                  `/dashboard/doctor/applications/${application.id}/contact` as Route;
                const detailsHref =
                  `/dashboard/doctor/applications/${application.id}` as Route;
                const isAccepted = application.status === "accepted";
                const isRejected = application.status === "rejected";
                const isInReview = application.status === "in_review";
                const isApplied = !isAccepted && !isRejected && !isInReview;

                return (
                  <Card
                    key={application.id}
                    className="relative transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"
                  >
                    <Link
                      aria-label={`Open application details for ${application.offer_title}`}
                      className="absolute inset-0 z-10 cursor-pointer rounded-xl"
                      href={detailsHref}
                    />
                    <CardContent className="flex flex-col gap-5 p-5 lg:grid lg:grid-cols-[minmax(0,1.6fr)_auto_auto] lg:items-center">
                      <div className="pointer-events-none space-y-2">
                        <p className="text-lg font-semibold">{application.offer_title}</p>
                        <p className="text-sm text-muted-foreground">{application.facility_name}</p>
                        <p className="text-sm text-muted-foreground">{application.location}</p>
                      </div>

                      <div className="pointer-events-none space-y-3">
                        <Badge className={applicationStatusBadgeClass[application.status]}>
                          {applicationStatusLabels[application.status]}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          Eingereicht am {formatDate(application.created_at)}
                        </p>
                      </div>

                      <div className="relative z-20 flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
                        {isAccepted ? (
                          application.has_conversation ? (
                            <Button asChild>
                              <Link href={conversationHref}>Unterhaltung öffnen</Link>
                            </Button>
                          ) : (
                            <div className="rounded-lg border border-dashed px-4 py-2 text-sm text-muted-foreground">
                              Warten auf Kontakt der Einrichtung
                            </div>
                          )
                        ) : null}

                        {isInReview ? (
                          <Button asChild variant="outline">
                            <Link href={applicationHref}>Bewerbung ansehen</Link>
                          </Button>
                        ) : null}

                        {isApplied ? (
                          <Button asChild variant="outline">
                            <Link href={applicationHref}>Bewerbung ansehen</Link>
                          </Button>
                        ) : null}

                        {isRejected ? (
                          <Button asChild variant="outline">
                            <Link href={applicationHref}>Details ansehen</Link>
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                Noch keine Bewerbungen in diesem Status.
              </div>
            )}
          </div>
        </div>
      ) : (
        <EmptyState
          title="Noch keine Bewerbungen"
          description="Ihre eingereichten Bewerbungen erscheinen hier, sobald Sie sich auf Stellenangebote bewerben."
          cta="Stellenangebote ansehen"
          href={"/dashboard/doctor/opportunities" as Route}
        />
      )}
    </DashboardShell>
  );
}
