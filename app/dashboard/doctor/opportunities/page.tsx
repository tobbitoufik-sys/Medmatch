import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getJobOffers } from "@/lib/data/repository";

export default async function DoctorOpportunitiesPage() {
  const offers = await getJobOffers();

  return (
    <DashboardShell
      role="doctor"
      title="Opportunity feed"
      description="A focused list of current opportunities relevant to professional healthcare hiring."
    >
      <div className="grid gap-6">
        {offers.map((offer) => (
          <Card key={offer.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>{offer.title}</CardTitle>
                  <CardDescription>{offer.city}, {offer.country}</CardDescription>
                </div>
                <Badge>{offer.contract_type}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>{offer.description}</p>
              <p><span className="font-semibold text-foreground">Requirements:</span> {offer.requirements}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
