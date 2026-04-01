import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { getContactRequests, getDoctorProfiles, getFacilityProfiles, getJobOffers, getUsers } from "@/lib/data/repository";

export default async function AdminDashboardPage() {
  const [users, doctors, facilities, offers, contacts] = await Promise.all([
    getUsers(),
    getDoctorProfiles(),
    getFacilityProfiles(),
    getJobOffers(),
    getContactRequests()
  ]);

  const publicDoctorProfiles = doctors.filter((doctor) => doctor.is_public).length;

  return (
    <DashboardShell
      role="admin"
      title="Admin dashboard"
      description="A simple but credible moderation layer for launch: users, profiles, offers and contact requests."
    >
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Users" value={String(users.length)} hint="All registered accounts." />
        <StatCard title="Doctors" value={String(doctors.length)} hint="Doctor profiles on the platform." />
        <StatCard title="Facilities" value={String(facilities.length)} hint="Facility profiles on the platform." />
        <StatCard title="Offers" value={String(offers.length)} hint="Published opportunities." />
        <StatCard title="Contacts" value={String(contacts.length)} hint="Contact requests recorded." />
      </div>
      <StatCard title="Public doctor profiles" value={String(publicDoctorProfiles)} hint="Profiles visible in the public doctor directory." />
    </DashboardShell>
  );
}
