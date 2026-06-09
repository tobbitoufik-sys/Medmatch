import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForFacilitiesPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="container py-20">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.2em] text-primary">Für Einrichtungen</p>
            <h1 className="text-5xl font-semibold tracking-tight">Gewinnen Sie Ärzte mit einer Plattform, die professionell, schnell und übersichtlich ist.</h1>
            <p className="text-lg text-muted-foreground">
              Präsentieren Sie Ihre Einrichtung, veröffentlichen Sie Stellen, durchsuchen Sie Arztprofile und behalten Sie erste Kontakte in einem klaren Workflow.
            </p>
            <Button asChild size="lg">
              <Link href="/register">Einrichtungskonto erstellen</Link>
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Was Einrichtungen mit MedMatch tun können</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>Erstellen Sie ein professionelles Einrichtungsprofil mit Typ, Standort, Website und Ansprechpartner.</p>
              <p>Veröffentlichen, aktualisieren oder pausieren Sie Stellenangebote direkt im Dashboard.</p>
              <p>Finden Sie passende Arztprofile mit praktischen Filtern und starten Sie eine direkte Ansprache.</p>
              <p>Nutzen Sie Moderation und Verifizierung, um Vertrauen und Qualität auf der Plattform zu sichern.</p>
            </CardContent>
          </Card>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
