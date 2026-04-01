import Link from "next/link";
import type { Route } from "next";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  applicationStatusBadgeClass,
  applicationStatusLabels,
  getFacilityVisibleApplicationStatus,
  type ApplicationStatus
} from "@/lib/applications";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/data/repository";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export default async function FacilityApplicationsPage() {
  const user = await getCurrentUser("facility");
  const supabase = await createServerSupabaseClient();

  let applications: Array<{
    id: string;
    status: ApplicationStatus;
    created_at: string;
    doctor_name: string;
    current_position: string;
    specialty: string;
    city: string;
    country: string;
    offer_title: string;
    offer_id: string;
  }> = [];

  if (user) {
    const { data: facility } = await supabase
      .from("facility_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (facility) {
      const { data } = await supabase
        .from("applications")
        .select("id, doctor_user_id, status, created_at, offer_id")
        .eq("facility_id", facility.id)
        .order("created_at", { ascending: false });

      const baseApplications = data ?? [];

      if (baseApplications.length) {
        const doctorUserIds = [...new Set(baseApplications.map((application) => application.doctor_user_id))];
        const offerIds = [...new Set(baseApplications.map((application) => application.offer_id))];

        const [{ data: doctors }, { data: profiles }, { data: offers }] = await Promise.all([
          supabase.from("users").select("id, full_name").in("id", doctorUserIds),
          supabase
            .from("doctor_profiles")
            .select("user_id, current_position, specialty, city, country")
            .in("user_id", doctorUserIds),
          supabase.from("job_offers").select("id, title").in("id", offerIds)
        ]);

        const doctorMap = new Map((doctors ?? []).map((doctor) => [doctor.id, doctor.full_name]));
        const profileMap = new Map(
          (profiles ?? []).map((profile) => [
            profile.user_id,
            {
              current_position: profile.current_position,
              specialty: profile.specialty,
              city: profile.city,
              country: profile.country
            }
          ])
        );
        const offerMap = new Map((offers ?? []).map((offer) => [offer.id, offer.title]));

        applications = baseApplications.map((application) => {
          const profile = profileMap.get(application.doctor_user_id);
          const visibleStatus = getFacilityVisibleApplicationStatus(application.status as ApplicationStatus);

          return {
            id: application.id,
            status: visibleStatus,
            created_at: application.created_at,
            doctor_name: doctorMap.get(application.doctor_user_id) ?? "Doctor",
            current_position: profile?.current_position || "Position not specified",
            specialty: profile?.specialty || "Specialty not specified",
            city: profile?.city || "City not specified",
            country: profile?.country || "Country not specified",
            offer_title: offerMap.get(application.offer_id) ?? "Opportunity",
            offer_id: application.offer_id
          };
        });
      }
    }
  }

  return (
    <DashboardShell
      role="facility"
      title="Applications"
      description="Review submitted doctor applications linked to your published opportunities."
    >
      {applications.length ? (
        <div className="grid gap-6">
          {applications.map((application) => (
            <Link
              key={application.id}
              href={`/dashboard/facility/applications/${application.id}` as Route}
              className="block cursor-pointer transition-transform hover:-translate-y-0.5"
            >
              <Card className="transition-colors hover:bg-secondary/40">
                <CardHeader className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle>{application.doctor_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{application.current_position}</p>
                    </div>
                    <Badge className={applicationStatusBadgeClass[application.status]}>
                      {applicationStatusLabels[application.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Specialty</p>
                      <p className="mt-1 font-medium text-foreground">{application.specialty}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Location</p>
                      <p className="mt-1 font-medium text-foreground">{application.city}, {application.country}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Applied on</p>
                      <p className="mt-1 font-medium text-foreground">{formatDate(application.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Related offer</p>
                      <p className="mt-1 font-medium text-foreground">{application.offer_title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No applications yet"
          description="Doctor applications will appear here once candidates apply to your published offers."
        />
      )}
    </DashboardShell>
  );
}
