import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CoverLetterGenerator } from "@/components/doctor/cover-letter-generator";

export default async function DoctorCoverLetterPage() {
  return (
    <DashboardShell
      role="doctor"
      title="Motivationsschreiben"
      description="Erstellen Sie ein professionelles deutsches Motivationsschreiben aus Ihren vorhandenen Profildaten."
    >
      <CoverLetterGenerator />
    </DashboardShell>
  );
}
