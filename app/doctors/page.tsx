import { getDoctorProfiles } from "@/lib/data/repository";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Filters } from "@/components/marketing/filters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/empty-state";

export default async function DoctorsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const doctors = await getDoctorProfiles({
    specialty: typeof params.specialty === "string" ? params.specialty : "",
    city: typeof params.city === "string" ? params.city : "",
    country: typeof params.country === "string" ? params.country : "",
    contract_type: typeof params.contract_type === "string" ? params.contract_type : "",
    availability: typeof params.availability === "string" ? params.availability : "",
    language: typeof params.language === "string" ? params.language : ""
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="container py-16">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm uppercase tracking-[0.2em] text-primary">Doctors</p>
          <h1 className="text-5xl font-semibold tracking-tight">Browse a curated public directory of professional doctor profiles.</h1>
          <p className="text-lg text-muted-foreground">
            Only public profiles appear here, making the listing suitable for a premium healthcare marketplace.
          </p>
        </div>
        <div className="mt-10">
          <Filters
            fields={[
              { name: "specialty", label: "Specialty", placeholder: "Radiology" },
              { name: "city", label: "City", placeholder: "Berlin" },
              { name: "country", label: "Country", placeholder: "Germany" },
              { name: "contract_type", label: "Contract", placeholder: "Locum" },
              { name: "availability", label: "Availability", placeholder: "Immediate" },
              { name: "language", label: "Language", placeholder: "English" }
            ]}
          />
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {doctors.length ? (
            doctors.map((doctor) => (
              <Card key={doctor.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle>{doctor.headline}</CardTitle>
                      <CardDescription>
                        {doctor.specialty} • {doctor.city}, {doctor.country}
                      </CardDescription>
                    </div>
                    <Badge>{doctor.availability}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{doctor.bio}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-primary/10 text-primary">{doctor.desired_contract_type}</Badge>
                    {doctor.languages.map((language) => (
                      <Badge key={language}>{language}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="lg:col-span-2">
              <EmptyState
                title="No doctor profile matches these filters"
                description="Try simplifying the search or connect Supabase and seed the platform with more demo profiles."
              />
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
