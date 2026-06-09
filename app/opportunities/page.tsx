import { getJobOffers } from "@/lib/data/repository";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Filters } from "@/components/marketing/filters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { getJobOfferContractTypeLabel } from "@/lib/job-offers";

export default async function OpportunitiesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const offers = await getJobOffers({
    specialty: typeof params.specialty === "string" ? params.specialty : "",
    city: typeof params.city === "string" ? params.city : "",
    country: typeof params.country === "string" ? params.country : "",
    contract_type: typeof params.contract_type === "string" ? params.contract_type : ""
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="container py-16">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm uppercase tracking-[0.2em] text-primary">Stellenangebote</p>
          <h1 className="text-5xl font-semibold tracking-tight">Finden Sie medizinische Stellen mit klaren Filtern.</h1>
          <p className="text-lg text-muted-foreground">
            MedMatch macht die Suche nach passenden Angeboten schnell, übersichtlich und professionell.
          </p>
        </div>
        <div className="mt-10">
          <Filters
            fields={[
              { name: "specialty", label: "Fachrichtung", placeholder: "Kardiologie" },
              { name: "city", label: "Stadt", placeholder: "Berlin" },
              { name: "country", label: "Land", placeholder: "Deutschland" },
              { name: "contract_type", label: "Vertrag", placeholder: "unbefristet" }
            ]}
          />
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {offers.length ? (
            offers.map((offer) => (
              <Card key={offer.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle>{offer.title}</CardTitle>
                      <CardDescription>
                        {offer.facility?.facility_name || "Medizinische Einrichtung"} - {offer.city}, {offer.country}
                      </CardDescription>
                    </div>
                    <Badge>{getJobOfferContractTypeLabel(offer.contract_type)}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{offer.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-primary/10 text-primary">{offer.specialty}</Badge>
                    {offer.salary_range_optional ? <Badge>{offer.salary_range_optional}</Badge> : null}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="lg:col-span-2">
              <EmptyState
                title="Noch kein Stellenangebot passt zu diesen Filtern"
                description="Erweitern Sie die Fachrichtung oder den Standort, um mehr passende Angebote zu sehen."
              />
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
