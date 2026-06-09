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
          <p className="text-sm uppercase tracking-[0.2em] text-primary">Arztprofile</p>
          <h1 className="text-5xl font-semibold tracking-tight">Durchsuchen Sie öffentliche Profile qualifizierter Ärzte.</h1>
          <p className="text-lg text-muted-foreground">
            Hier erscheinen nur freigegebene Profile, damit Einrichtungen schnell relevante Kandidaten finden.
          </p>
        </div>
        <div className="mt-10">
          <Filters
            fields={[
              { name: "specialty", label: "Fachrichtung", placeholder: "Radiologie" },
              { name: "city", label: "Stadt", placeholder: "Berlin" },
              { name: "country", label: "Land", placeholder: "Deutschland" },
              { name: "contract_type", label: "Vertrag", placeholder: "Honorar" },
              { name: "availability", label: "Verfügbarkeit", placeholder: "Sofort" },
              { name: "language", label: "Sprache", placeholder: "Deutsch" }
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
                title="Kein Arztprofil passt zu diesen Filtern"
                description="Vereinfachen Sie die Suche oder erweitern Sie die Filter, um mehr Profile zu sehen."
              />
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
