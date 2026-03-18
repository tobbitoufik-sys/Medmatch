import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JobOfferForm } from "@/components/forms/job-offer-form";
import { getCurrentUser, getFacilityByUserId, getJobOffers } from "@/lib/data/repository";

export default async function FacilityOffersPage() {
  const user = await getCurrentUser("facility");
  const profile = user ? await getFacilityByUserId(user.id) : null;
  const offers = await getJobOffers();
  const myOffers = offers.filter((offer) => offer.facility_id === profile?.id);

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
              <div key={offer.id} className="rounded-2xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{offer.title}</p>
                    <p className="text-sm text-muted-foreground">{offer.city}, {offer.country}</p>
                  </div>
                  <Badge>{offer.status}</Badge>
                </div>
              </div>
            ))}
            {!myOffers.length ? <p className="text-sm text-muted-foreground">No offers yet. Create your first role to start receiving interest.</p> : null}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
