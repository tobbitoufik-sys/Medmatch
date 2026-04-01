import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DoctorProfileForm } from "@/components/forms/doctor-profile-form";
import { getCurrentDoctorProfile, getCurrentUser } from "@/lib/data/repository";

export default async function DoctorProfilePage() {
  const user = await getCurrentUser("doctor");
  const profile = user ? await getCurrentDoctorProfile() : null;

  return (
    <DashboardShell
      role="doctor"
      title="Profil"
      description="Pflegen Sie Ihr Profil wie einen strukturierten Lebenslauf und halten Sie alle beruflichen Angaben aktuell."
    >
      <Card>
        <CardHeader><CardTitle>Profil bearbeiten</CardTitle></CardHeader>
        <CardContent>
          <DoctorProfileForm profile={profile} email={user?.email ?? ""} />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
