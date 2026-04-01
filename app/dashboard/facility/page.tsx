import type { Route } from "next";
import Link from "next/link";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUnreadConversationCount } from "@/lib/application-conversations";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser, getFacilityByUserId } from "@/lib/data/repository";

export default async function FacilityDashboardPage() {
  const user = await getCurrentUser("facility");
  const profile = user ? await getFacilityByUserId(user.id) : null;
  let activeOffers = 0;
  let inboundApplications = 0;
  let unreadConversations = 0;

  if (user) {
    const supabase = await createServerSupabaseClient();
    const { data: facility } = await supabase
      .from("facility_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (facility) {
      const { count } = await supabase
        .from("job_offers")
        .select("id", { count: "exact", head: true })
        .eq("facility_id", facility.id)
        .eq("status", "published");

      activeOffers = count ?? 0;

      const { count: applicationCount } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("facility_id", facility.id);

      inboundApplications = applicationCount ?? 0;
    }

    unreadConversations = await getUnreadConversationCount("facility", user.id);
  }

  return (
    <DashboardShell
      role="facility"
      title="Facility dashboard"
      description="Manage your organisation profile, keep opportunities current and review incoming doctor interest."
    >
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="Active offers"
          value={String(activeOffers)}
          hint="Published opportunities linked to your facility."
          href="/dashboard/facility/offers"
        />
        <StatCard
          title="Inbound contacts"
          value={String(inboundApplications)}
          hint="Doctors who have contacted your team."
          href={"/dashboard/facility/applications" as Route}
        />
        <StatCard title="Verification" value={profile?.verified ? "Verified" : "Pending"} hint="Admin can mark the facility as verified." />
      </div>
      <Card>
        <CardHeader><CardTitle>Facility snapshot</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>{profile ? `${profile.facility_name} • ${profile.city}, ${profile.country}` : "No facility profile yet. Start by completing your organisation information."}</p>
          <p>{profile?.description || "Add a clear description to reassure doctors and improve conversion."}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Inbox</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            {unreadConversations > 0
              ? `You have ${unreadConversations} unread conversations`
              : "View your conversations"}
          </p>
          <Button asChild variant="secondary">
            <Link href={"/dashboard/facility/contacts" as Route}>Open inbox</Link>
          </Button>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
