import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContactRequests, getCurrentUser, getDoctorByUserId, getJobOffers } from "@/lib/data/repository";

export default async function DoctorDashboardPage() {
  const user = await getCurrentUser("doctor");
  const profile = user ? await getDoctorByUserId(user.id) : null;
  const contacts = await getContactRequests();
  const offers = await getJobOffers();

  const myContacts = contacts.filter((item) => item.sender_user_id === user?.id);

  return (
    <DashboardShell
      role="doctor"
      title="Doctor dashboard"
      description="Manage your professional profile, explore opportunities and keep track of your outreach."
    >
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard title="Profile completion" value={`${profile?.profile_completion ?? 0}%`} hint="Complete the remaining fields to strengthen trust." />
        <StatCard title="Open opportunities" value={String(offers.length)} hint="Published opportunities visible on the platform." />
        <StatCard title="Contact requests" value={String(myContacts.length)} hint="Initial conversations you have started." />
      </div>
      <Card>
        <CardHeader><CardTitle>Profile snapshot</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>{profile ? `${profile.title} ${profile.first_name} ${profile.last_name} • ${profile.specialty}` : "No profile yet. Start by completing your professional information."}</p>
          <p>{profile?.bio || "Add a short biography, languages, availability and preferred contract type."}</p>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
