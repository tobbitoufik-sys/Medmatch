import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FacilityProfileForm } from "@/components/forms/facility-profile-form";
import { getCurrentUser, getFacilityByUserId } from "@/lib/data/repository";

export default async function FacilityProfilePage() {
  const user = await getCurrentUser("facility");
  const profile = user ? await getFacilityByUserId(user.id) : null;

  return (
    <DashboardShell
      role="facility"
      title="Facility profile"
      description="Present your organisation in a polished and credible way."
    >
      <Card>
        <CardHeader><CardTitle>Edit facility profile</CardTitle></CardHeader>
        <CardContent>
          <FacilityProfileForm profile={profile} />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
