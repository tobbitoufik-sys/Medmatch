import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
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

export default async function FacilityOfferDetailsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
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

  const { data: offer } = await supabase
    .from("job_offers")
    .select("*")
    .eq("id", id)
    .eq("facility_id", facility.id)
    .maybeSingle();

  if (!offer) notFound();

  return (
    <DashboardShell
      role="facility"
      title={offer.title}
      description="Prüfen Sie die vollständigen Details dieses Stellenangebots in Ihrem Einrichtungsbereich."
    >
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>{offer.status === "published" ? "Veröffentlicht" : offer.status === "draft" ? "Entwurf" : offer.status === "paused" ? "Pausiert" : offer.status}</Badge>
            <Badge className="bg-primary/10 text-primary">{getJobOfferContractTypeLabel(offer.contract_type)}</Badge>
            {offer.salary_range_optional ? <Badge>{offer.salary_range_optional}</Badge> : null}
          </div>
          <CardTitle>{offer.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {offer.specialty} | {offer.city}, {offer.country}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border p-4">
              <p className="text-sm text-muted-foreground">Erstellt</p>
              <p className="mt-2 font-medium">{formatDate(offer.created_at) ?? "Nicht verfügbar"}</p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-sm text-muted-foreground">Veröffentlicht</p>
              <p className="mt-2 font-medium">{formatDate(offer.published_at) ?? "Nicht veröffentlicht"}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Beschreibung</h2>
            <p className="whitespace-pre-wrap text-muted-foreground">{offer.description}</p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Anforderungen</h2>
            <p className="whitespace-pre-wrap text-muted-foreground">{offer.requirements}</p>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
