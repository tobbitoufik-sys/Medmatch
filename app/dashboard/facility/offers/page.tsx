import { FacilityOfferCard } from "@/components/dashboard/facility-offer-card";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobOfferForm } from "@/components/forms/job-offer-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { JobOffer } from "@/types";

export default async function FacilityOffersPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  let myOffers: JobOffer[] = [];

  if (user) {
    const { data: facility } = await supabase
      .from("facility_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (facility) {
      const { data } = await supabase
        .from("job_offers")
        .select("*")
        .eq("facility_id", facility.id)
        .order("created_at", { ascending: false });

      myOffers = (data as JobOffer[]) ?? [];
    }
  }

  return (
    <DashboardShell
      role="facility"
      title="Stellenangebote verwalten"
      description="Veröffentlichen und pflegen Sie offene Positionen in einem klaren Arbeitsbereich."
    >
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader><CardTitle>Neues Stellenangebot erstellen</CardTitle></CardHeader>
          <CardContent>
            <JobOfferForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Aktuelle Stellenangebote</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {myOffers.map((offer) => (
              <FacilityOfferCard key={offer.id} offer={offer} />
            ))}
            {!myOffers.length ? <p className="text-sm text-muted-foreground">Noch keine Stellenangebote vorhanden. Erstellen Sie die erste Position, um Bewerbungen zu erhalten.</p> : null}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
