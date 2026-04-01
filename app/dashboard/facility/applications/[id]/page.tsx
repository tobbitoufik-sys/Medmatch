import Link from "next/link";
import type { Route } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";

import { ContactEventsCount } from "@/components/dashboard/contact-events-count";
import { ApplicationStatusActions } from "@/components/forms/application-status-actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { markApplicationHiredAction } from "@/lib/actions";
import {
  applicationStatusBadgeClass,
  applicationStatusLabels,
  getFacilityVisibleApplicationStatus,
  type ApplicationStatus
} from "@/lib/applications";
import { getJobOfferContractTypeLabel } from "@/lib/job-offers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function formatDate(value: string | null | undefined) {
  if (!value) return null;

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

async function getApplication(
  applicationId: string,
  facilityId: string,
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
) {
  const { data } = await supabase
    .from("applications")
    .select("id, doctor_user_id, offer_id, facility_id, message, status, hired, commission_due, created_at")
    .eq("id", applicationId)
    .eq("facility_id", facilityId)
    .maybeSingle();

  return data;
}

export default async function FacilityApplicationDetailsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  noStore();
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: facility } = await supabase
    .from("facility_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!facility) notFound();

  let application = await getApplication(id, facility.id, supabase);

  if (!application) notFound();

  const initialStatus = application.status;

  if (application.status === "submitted") {
    await supabase
      .from("applications")
      .update({ status: "received" })
      .eq("id", application.id)
      .eq("facility_id", facility.id)
      .eq("status", "submitted");
  }

  application = await getApplication(id, facility.id, supabase);

  if (!application) notFound();

  const visibleStatus = getFacilityVisibleApplicationStatus(application.status as ApplicationStatus);

  const [{ data: doctor }, { data: profile }, { data: offer }, { data: conversation }] = await Promise.all([
    supabase
      .from("users")
      .select("full_name")
      .eq("id", application.doctor_user_id)
      .maybeSingle(),
    supabase
      .from("doctor_profiles")
      .select("current_position, specialty, city, country")
      .eq("user_id", application.doctor_user_id)
      .maybeSingle(),
    supabase
      .from("job_offers")
      .select("title, specialty, city, country, contract_type")
      .eq("id", application.offer_id)
      .maybeSingle(),
    supabase
      .from("application_conversations")
      .select("id")
      .eq("application_id", application.id)
      .maybeSingle()
  ]);

  return (
    <DashboardShell
      role="facility"
      title={doctor?.full_name || "Application"}
      description="Review the full details of a submitted doctor application."
    >
      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>Application details</CardTitle>
          <p className="text-sm text-muted-foreground">
            Submitted {formatDate(application.created_at) ?? "Not available"}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Application status</h2>
            <div className="flex flex-wrap items-center gap-3">
              <Badge className={applicationStatusBadgeClass[visibleStatus]}>
                {applicationStatusLabels[visibleStatus]}
              </Badge>
              <Badge className={application.hired ? "bg-green-100 text-green-800" : "bg-secondary text-secondary-foreground"}>
                {application.hired ? "Hired" : "Not hired"}
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border p-4">
              <p className="text-sm text-muted-foreground">Doctor</p>
              <p className="mt-2 font-medium">{doctor?.full_name || "Doctor"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {profile?.current_position || "Position not specified"} | {profile?.specialty || "Specialty not specified"}
              </p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="mt-2 font-medium">
                {profile?.city || "City not specified"}, {profile?.country || "Country not specified"}
              </p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-sm text-muted-foreground">Offer</p>
              <p className="mt-2 font-medium">{offer?.title || "Opportunity"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {offer?.specialty || "Specialty not specified"} | {offer?.contract_type ? getJobOfferContractTypeLabel(offer.contract_type) : "Contract not specified"}
              </p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-sm text-muted-foreground">Offer location</p>
              <p className="mt-2 font-medium">
                {offer?.city || "City not specified"}, {offer?.country || "Country not specified"}
              </p>
            </div>
            <div className="rounded-2xl border p-4 md:col-span-2">
              <p className="text-sm text-muted-foreground">Contact events</p>
              <ContactEventsCount applicationId={application.id} />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Workflow actions</h2>
            {conversation ? (
              <Button asChild variant="secondary">
                <Link href={`/dashboard/facility/applications/${application.id}/contact`}>
                  Open conversation
                </Link>
              </Button>
            ) : null}
            <ApplicationStatusActions
              applicationId={application.id}
              initialStatus={application.status as ApplicationStatus}
              detailPath={`/dashboard/facility/applications/${application.id}`}
              contactPath={`/dashboard/facility/applications/${application.id}/contact` as Route}
              contractType={offer?.contract_type}
            />
            {!application.hired ? (
              <form action={markApplicationHiredAction}>
                <input type="hidden" name="application_id" value={application.id} />
                <input type="hidden" name="detail_path" value={`/dashboard/facility/applications/${application.id}`} />
                <Button type="submit" variant="outline">Mark as hired</Button>
              </form>
            ) : null}
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Generated candidature</h2>
            <p className="whitespace-pre-wrap text-muted-foreground">{application.message}</p>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
