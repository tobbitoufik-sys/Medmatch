import Link from "next/link";
import { notFound } from "next/navigation";

import { ApplyNowForm } from "@/components/forms/apply-now-form";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getJobOfferContractTypeLabel } from "@/lib/job-offers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function formatDate(value: string | null | undefined) {
  if (!value) return null;

  return new Intl.DateTimeFormat("de-DE", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export default async function DoctorOpportunityDetailsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: offer } = await supabase
    .from("job_offers")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (!offer) notFound();

  let alreadyApplied = false;
  let appliedApplicationId: string | null = null;
  let hasConversation = false;

  if (user) {
    const { data: application } = await supabase
      .from("applications")
      .select("id")
      .eq("doctor_user_id", user.id)
      .eq("offer_id", offer.id)
      .maybeSingle();

    alreadyApplied = Boolean(application);
    appliedApplicationId = application?.id ?? null;

    if (application) {
      const { data: conversation } = await supabase
        .from("application_conversations")
        .select("id")
        .eq("application_id", application.id)
        .maybeSingle();

      hasConversation = Boolean(conversation);
    }
  }

  return (
    <DashboardShell
      role="doctor"
      title={offer.title}
      description="Prüfen Sie die vollständigen Details dieses veröffentlichten Stellenangebots."
    >
      <div className="space-y-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/doctor/opportunities">Zurück zu den Stellenangeboten</Link>
        </Button>

        <Card>
          <CardHeader className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="capitalize">{offer.status}</Badge>
              <Badge className="bg-primary/10 text-primary">{getJobOfferContractTypeLabel(offer.contract_type)}</Badge>
              {offer.salary_range_optional ? <Badge className="bg-secondary text-secondary-foreground">{offer.salary_range_optional}</Badge> : null}
            </div>
            <div className="space-y-3">
              <CardTitle className="text-2xl md:text-3xl">{offer.title}</CardTitle>
              <p className="max-w-3xl text-sm text-muted-foreground">
                Ein veröffentlichtes MedMatch-Stellenangebot mit klaren Rollendetails für Ärztinnen und Ärzte.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border bg-secondary/20 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Standort</p>
                <p className="mt-3 font-medium">{offer.city}, {offer.country}</p>
              </div>
              <div className="rounded-2xl border bg-secondary/20 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Fachrichtung</p>
                <p className="mt-3 font-medium">{offer.specialty}</p>
              </div>
              <div className="rounded-2xl border bg-secondary/20 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Veröffentlicht am</p>
                <p className="mt-3 font-medium">{formatDate(offer.published_at) ?? "Nicht verfügbar"}</p>
              </div>
              <div className="rounded-2xl border bg-secondary/20 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Vertrag</p>
                <p className="mt-3 font-medium">{getJobOfferContractTypeLabel(offer.contract_type)}</p>
              </div>
            </div>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Beschreibung</h2>
              <div className="rounded-2xl border p-5">
                <p className="whitespace-pre-wrap leading-7 text-muted-foreground">{offer.description}</p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Anforderungen</h2>
              <div className="rounded-2xl border p-5">
                <p className="whitespace-pre-wrap leading-7 text-muted-foreground">{offer.requirements}</p>
              </div>
            </section>

            <section className="space-y-4 border-t pt-8">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Bewerbung</h2>
                <p className="text-sm text-muted-foreground">
                  Bewerben Sie sich in einem Schritt. MedMatch erstellt aus Ihrem vorhandenen Profil automatisch eine professionelle Bewerbung.
                </p>
              </div>
              {appliedApplicationId && hasConversation ? (
                <Button asChild variant="secondary">
                  <Link href={`/dashboard/doctor/applications/${appliedApplicationId}/contact`}>
                    Unterhaltung öffnen
                  </Link>
                </Button>
              ) : null}
              <ApplyNowForm offerId={offer.id} alreadyApplied={alreadyApplied} />
            </section>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
