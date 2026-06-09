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
      title="Einrichtungsdashboard"
      description="Verwalten Sie Ihr Einrichtungsprofil, halten Sie Stellenangebote aktuell und prüfen Sie eingehende Bewerbungen."
    >
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="Aktive Stellen"
          value={String(activeOffers)}
          hint="Veröffentlichte Stellenangebote Ihrer Einrichtung."
          href="/dashboard/facility/offers"
        />
        <StatCard
          title="Eingegangene Kontakte"
          value={String(inboundApplications)}
          hint="Ärzte, die Ihr Team kontaktiert haben."
          href={"/dashboard/facility/applications" as Route}
        />
        <StatCard title="Verifizierung" value={profile?.verified ? "Geprüft" : "Ausstehend"} hint="Admins können die Einrichtung als geprüft markieren." />
      </div>
      <Card>
        <CardHeader><CardTitle>Einrichtungsüberblick</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>{profile ? `${profile.facility_name} - ${profile.city}, ${profile.country}` : "Noch kein Einrichtungsprofil vorhanden. Ergänzen Sie zuerst Ihre Organisationsdaten."}</p>
          <p>{profile?.description || "Fügen Sie eine klare Beschreibung hinzu, um Vertrauen bei Ärzten aufzubauen."}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Postfach</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            {unreadConversations > 0
              ? `${unreadConversations} ungelesene Konversationen`
              : "Konversationen ansehen"}
          </p>
          <Button asChild variant="secondary">
            <Link href={"/dashboard/facility/contacts" as Route}>Postfach öffnen</Link>
          </Button>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
