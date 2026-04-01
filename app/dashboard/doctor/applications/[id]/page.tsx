import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  applicationStatusBadgeClass,
  applicationStatusLabels,
  type ApplicationStatus
} from "@/lib/applications";
import { getCurrentUser } from "@/lib/data/repository";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function formatDate(value: string | null | undefined) {
  if (!value) return "Nicht verfügbar";

  return new Intl.DateTimeFormat("de-DE", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function formatOfferDisplayTitle(title?: string | null, specialty?: string | null) {
  const safeTitle = title || "Bewerbung";
  return specialty ? `${safeTitle} · ${specialty}` : safeTitle;
}

function getWorkflowState(status: ApplicationStatus) {
  const sentState = status === "submitted" ? "current" : "complete";

  const reviewState =
    status === "received" || status === "in_review" || status === "contacted"
      ? "current"
      : status === "accepted" || status === "rejected"
        ? "complete"
        : "upcoming";

  const finalState =
    status === "accepted" || status === "rejected" ? "current" : "upcoming";

  return { sentState, reviewState, finalState } as const;
}

function getStepTone(
  state: "complete" | "current" | "upcoming",
  tone?: "accepted" | "rejected"
) {
  if (state === "upcoming") {
    return {
      dot: "border-border bg-background text-muted-foreground",
      line: "bg-border",
      label: "text-muted-foreground",
      caption: "text-muted-foreground"
    };
  }

  if (tone === "accepted") {
    return {
      dot: "border-green-500 bg-green-500 text-white",
      line: "bg-green-500",
      label: "text-green-700",
      caption: "text-muted-foreground"
    };
  }

  if (tone === "rejected") {
    return {
      dot: "border-red-500 bg-red-500 text-white",
      line: "bg-red-500",
      label: "text-red-700",
      caption: "text-muted-foreground"
    };
  }

  if (state === "current") {
    return {
      dot: "border-primary bg-primary text-primary-foreground",
      line: "bg-primary/30",
      label: "text-foreground",
      caption: "text-muted-foreground"
    };
  }

  return {
    dot: "border-primary/70 bg-primary/10 text-primary",
    line: "bg-primary",
    label: "text-foreground",
    caption: "text-muted-foreground"
  };
}

export default async function DoctorApplicationDetailsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser("doctor");

  if (!user) notFound();

  const supabase = await createServerSupabaseClient();
  const { data: application } = await supabase
    .from("applications")
    .select("id, offer_id, facility_id, doctor_user_id, message, status, created_at")
    .eq("id", id)
    .eq("doctor_user_id", user.id)
    .maybeSingle();

  if (!application) notFound();

  const [{ data: offer }, { data: facility }, { data: conversation }] = await Promise.all([
    supabase
      .from("job_offers")
      .select("title, city, country, specialty")
      .eq("id", application.offer_id)
      .maybeSingle(),
    supabase
      .from("facility_profiles")
      .select("facility_name")
      .eq("id", application.facility_id)
      .maybeSingle(),
    supabase
      .from("application_conversations")
      .select("id")
      .eq("application_id", application.id)
      .maybeSingle()
  ]);

  const status = application.status as ApplicationStatus;
  const workflowState = getWorkflowState(status);
  const hasConversation = Boolean(conversation);
  const title = formatOfferDisplayTitle(offer?.title, offer?.specialty);
  const facilityName = facility?.facility_name || "Einrichtung";
  const location = offer ? `${offer.city}, ${offer.country}` : "Standort nicht angegeben";

  const timelineSteps: Array<{
    key: string;
    label: string;
    caption: string;
    state: "complete" | "current" | "upcoming";
    tone?: "accepted" | "rejected";
  }> = [
    {
      key: "sent",
      label: "Bewerbung gesendet",
      caption: "Ihre Bewerbung wurde übermittelt.",
      state: workflowState.sentState
    },
    {
      key: "review",
      label: "In Prüfung",
      caption: "Die Einrichtung prüft Ihr Profil.",
      state: workflowState.reviewState
    },
    {
      key: "final",
      label:
        status === "accepted"
          ? "Angenommen"
          : status === "rejected"
            ? "Abgelehnt"
            : "Entscheidung ausstehend",
      caption:
        status === "accepted"
          ? "Sie können nun über die Unterhaltung mit der Einrichtung fortfahren."
          : status === "rejected"
            ? "Diese Bewerbung wurde von der Einrichtung abgeschlossen."
            : "Eine endgültige Entscheidung liegt noch nicht vor.",
      state: workflowState.finalState,
      tone: status === "accepted" ? "accepted" : status === "rejected" ? "rejected" : undefined
    }
  ];

  return (
    <DashboardShell
      role="doctor"
      title={title}
      description="Prüfen Sie den Status Ihrer Bewerbung und den nächsten Schritt im Ablauf."
    >
      <div className="space-y-6">
        <Button asChild size="sm" variant="outline">
          <Link href={"/dashboard/doctor/applications" as Route}>Zurück zu den Bewerbungen</Link>
        </Button>

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className={applicationStatusBadgeClass[status]}>
                {applicationStatusLabels[status]}
              </Badge>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>{facilityName}</p>
              <p>{location}</p>
              <p>Eingereicht am {formatDate(application.created_at)}</p>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status und Ablauf</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center">
              {timelineSteps.map((step, index) => {
                const tone = getStepTone(step.state, step.tone);

                return (
                  <div key={step.key} className="contents">
                    <div className="flex h-10 items-center justify-center">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold ${tone.dot}`}
                      >
                        {step.state === "complete" ? "\u2713" : index + 1}
                      </div>
                    </div>
                    {index < timelineSteps.length - 1 ? (
                      <div className="flex h-10 items-center">
                        <div className={`h-[2px] w-full rounded-full ${tone.line}`} />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-4">
              {timelineSteps.map((step) => {
                const tone = getStepTone(step.state, step.tone);

                return (
                  <div key={`${step.key}-label`} className="space-y-1 text-center">
                    <p className={`text-sm font-semibold ${tone.label}`}>{step.label}</p>
                    <p className={`text-xs ${tone.caption}`}>{step.caption}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kommunikation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Die Einrichtung muss den Kontakt zuerst eröffnen. Sie können Nachrichten erst senden, wenn die Unterhaltung gestartet wurde.
            </p>

            {hasConversation ? (
              <Button asChild>
                <Link href={`/dashboard/doctor/applications/${application.id}/contact` as Route}>
                  Unterhaltung öffnen
                </Link>
              </Button>
            ) : (
              <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                Warten auf Kontakt der Einrichtung
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bewerbungsübersicht</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border bg-secondary/20 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Fachrichtung</p>
                <p className="mt-3 font-medium">{offer?.specialty || "Nicht angegeben"}</p>
              </div>
              <div className="rounded-2xl border bg-secondary/20 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Status</p>
                <p className="mt-3 font-medium">{applicationStatusLabels[status]}</p>
              </div>
            </div>

            <div className="rounded-2xl border p-5">
              <p className="text-sm font-medium">Übermittelte Nachricht</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                {application.message || "Es wurde keine Bewerbungsnotiz übermittelt."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
