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
      title="Offers management"
      description="Publish and maintain your open roles from one clean workspace."
    >
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader><CardTitle>Create a new offer</CardTitle></CardHeader>
          <CardContent>
            <JobOfferForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Your current offers</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {myOffers.map((offer) => (
              <FacilityOfferCard key={offer.id} offer={offer} />
            ))}
            {!myOffers.length ? <p className="text-sm text-muted-foreground">No offers yet. Create your first role to start receiving interest.</p> : null}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
