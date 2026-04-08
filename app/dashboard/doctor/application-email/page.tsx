import { ApplicationEmailGenerator } from "@/components/doctor/application-email-generator";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function DoctorApplicationEmailPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: gmailConnection } = user
    ? await supabase
        .from("doctor_gmail_connections")
        .select("id")
        .eq("doctor_user_id", user.id)
        .maybeSingle()
    : { data: null };

  return (
    <DashboardShell
      role="doctor"
      title="Bewerbungs-E-Mail mit KI"
      description="Erstellen Sie eine kurze professionelle deutsche Bewerbungs-E-Mail aus Ihren vorhandenen Profildaten und optionalem Bewerbungskontext."
    >
      <ApplicationEmailGenerator gmailConnected={Boolean(gmailConnection)} />
    </DashboardShell>
  );
}
