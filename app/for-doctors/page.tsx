import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForDoctorsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="container py-20">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.2em] text-primary">Für Ärzte</p>
            <h1 className="text-5xl font-semibold tracking-tight">Präsentieren Sie Ihre Erfahrung klar und finden Sie schneller passende Stellen.</h1>
            <p className="text-lg text-muted-foreground">
              Erstellen Sie ein strukturiertes Profil, definieren Sie Verfügbarkeit und Vertragswünsche und starten Sie Gespräche mit passenden medizinischen Arbeitgebern.
            </p>
            <Button asChild size="lg">
              <Link href="/register">Arztkonto erstellen</Link>
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Was Ärzte mit MedMatch tun können</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>Erstellen Sie ein professionelles medizinisches Profil mit Fachrichtung, Standort, Sprachen und Kurzprofil.</p>
              <p>Entdecken Sie Stellenangebote nach Fachrichtung, Land, Stadt und Vertragsart.</p>
              <p>Senden Sie direkte Kontaktanfragen oder Bewerbungen ohne komplizierten Recruiting-Prozess.</p>
              <p>Steuern Sie Ihre Profilsichtbarkeit und bereiten Sie Unterlagen für den weiteren Bewerbungsprozess vor.</p>
            </CardContent>
          </Card>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
