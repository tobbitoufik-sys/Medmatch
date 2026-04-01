import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ContactRequestForm } from "@/components/forms/contact-request-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDoctorProfiles } from "@/lib/data/repository";

export default async function FacilityDoctorsPage() {
  const doctors = await getDoctorProfiles();

  return (
    <DashboardShell
      role="facility"
      title="Doctor search"
      description="Browse public doctor profiles and start a direct outreach from the platform."
    >
      <div className="grid gap-6">
        {doctors.map((doctor) => (
          <Card key={doctor.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>{doctor.headline}</CardTitle>
                <div className="flex gap-2">
                  <Badge>{doctor.specialty}</Badge>
                  <Badge className="bg-primary/10 text-primary">{doctor.desired_contract_type}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <div className="space-y-3 text-muted-foreground">
                <p>{doctor.bio}</p>
                <p><span className="font-semibold text-foreground">Availability:</span> {doctor.availability}</p>
                <p><span className="font-semibold text-foreground">Languages:</span> {doctor.languages.join(", ")}</p>
              </div>
              <div className="rounded-3xl border bg-secondary/40 p-5">
                <p className="mb-4 text-sm font-semibold text-foreground">Send a direct contact request</p>
                <ContactRequestForm receiverUserId={doctor.user_id} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
