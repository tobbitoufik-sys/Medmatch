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
          <p className="text-sm uppercase tracking-[0.2em] text-primary">Opportunities</p>
          <h1 className="text-5xl font-semibold tracking-tight">Search healthcare roles with practical, lightweight filters.</h1>
          <p className="text-lg text-muted-foreground">
            The MVP keeps job discovery intentionally simple and fast for professional users.
          </p>
        </div>
        <div className="mt-10">
          <Filters
            fields={[
              { name: "specialty", label: "Specialty", placeholder: "Cardiology" },
              { name: "city", label: "City", placeholder: "Dubai" },
              { name: "country", label: "Country", placeholder: "United Arab Emirates" },
              { name: "contract_type", label: "Contract", placeholder: "unbefristet" }
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
                        {offer.facility?.facility_name || "Healthcare facility"} • {offer.city}, {offer.country}
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
                title="No opportunity matches these filters yet"
                description="Try broadening the specialty or location filters, or publish demo data through the Supabase seed."
              />
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
