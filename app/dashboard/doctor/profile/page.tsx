import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DoctorProfileForm } from "@/components/forms/doctor-profile-form";
import { getCurrentUser, getDoctorByUserId } from "@/lib/data/repository";

export default async function DoctorProfilePage() {
  const user = await getCurrentUser("doctor");
  const profile = user ? await getDoctorByUserId(user.id) : null;

  return (
    <DashboardShell
      role="doctor"
      title="Doctor profile"
      description="Keep your professional profile accurate and easy to review by recruiters."
    >
      <Card>
        <CardHeader><CardTitle>Edit profile</CardTitle></CardHeader>
        <CardContent>
          <DoctorProfileForm profile={profile} />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
