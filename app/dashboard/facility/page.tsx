import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContactRequests, getCurrentUser, getFacilityByUserId, getJobOffers } from "@/lib/data/repository";

export default async function FacilityDashboardPage() {
  const user = await getCurrentUser("facility");
  const profile = user ? await getFacilityByUserId(user.id) : null;
  const offers = await getJobOffers();
  const contacts = await getContactRequests();

  const myOffers = offers.filter((offer) => offer.facility_id === profile?.id);
  const inbound = contacts.filter((item) => item.receiver_user_id === user?.id);

  return (
    <DashboardShell
      role="facility"
      title="Facility dashboard"
      description="Manage your organisation profile, keep opportunities current and review incoming doctor interest."
    >
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard title="Active offers" value={String(myOffers.length)} hint="Published opportunities linked to your facility." />
        <StatCard title="Inbound contacts" value={String(inbound.length)} hint="Doctors who have contacted your team." />
        <StatCard title="Verification" value={profile?.verified ? "Verified" : "Pending"} hint="Admin can mark the facility as verified." />
      </div>
      <Card>
        <CardHeader><CardTitle>Facility snapshot</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>{profile ? `${profile.facility_name} • ${profile.city}, ${profile.country}` : "No facility profile yet. Start by completing your organisation information."}</p>
          <p>{profile?.description || "Add a clear description to reassure doctors and improve conversion."}</p>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
