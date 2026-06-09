import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardList, ShieldCheck, Sparkles } from "lucide-react";

import { getJobOffers } from "@/lib/data/repository";
import { Hero } from "@/components/marketing/hero";
import { SectionHeading } from "@/components/marketing/section-heading";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getJobOfferContractTypeLabel } from "@/lib/job-offers";
import { formatDate } from "@/lib/utils";

export default async function HomePage() {
  const offers = await getJobOffers();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Hero />

      <section className="container py-20">
        <SectionHeading
          eyebrow="So funktioniert es"
          title="Ein klarer Workflow für medizinische Vermittlung"
          description="MedMatch konzentriert sich auf das Wesentliche: starke Profile, klare Stellenangebote und professionelle Kontakte."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Professionell auftreten",
              text: "Ärzte und Einrichtungen erstellen strukturierte Profile mit Fachrichtung, Standort, Verfügbarkeit und relevantem Kontext.",
              icon: ClipboardList
            },
            {
              title: "Gezielt suchen",
              text: "Filtern Sie Arztprofile oder Stellenangebote nach Fachrichtung, Standort, Vertragsart, Verfügbarkeit und Sprache.",
              icon: Sparkles
            },
            {
              title: "Sicher Kontakt aufnehmen",
              text: "Starten Sie Bewerbungs- und Recruiting-Gespräche professionell, nachvollziehbar und ohne unnötige Komplexität.",
              icon: ShieldCheck
            }
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <item.icon className="h-6 w-6" />
                </div>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.text}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Badge>Für Ärzte</Badge>
              <CardTitle className="text-3xl">Berufserfahrung überzeugend darstellen</CardTitle>
              <CardDescription>
                Erstellen Sie ein Profil, das Fachrichtung, Sprachen, Verfügbarkeit und berufliche Ziele klar sichtbar macht.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                "Strukturiertes Arztprofil mit klaren beruflichen Angaben",
                "Zugang zu passenden Stellenangeboten von Kliniken, Praxen und MVZ",
                "Einfache Bewerbungen und Kontaktanfragen",
                "Sichtbarkeitseinstellungen und vorbereitete Profilprüfung"
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                  <p className="text-muted-foreground">{item}</p>
                </div>
              ))}
              <Button asChild className="mt-4">
                <Link href="/for-doctors">Bereich für Ärzte ansehen</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Badge>Für Einrichtungen</Badge>
              <CardTitle className="text-3xl">Stellenangebote veröffentlichen und passende Talente finden</CardTitle>
              <CardDescription>
                Kliniken, Praxen und Recruiter präsentieren ihre Einrichtung, veröffentlichen Rollen und starten schnell qualifizierte Gespräche.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                "Professionelles Einrichtungsprofil mit Verifizierungsmöglichkeit",
                "Einfacher Workflow für dringende und dauerhafte Stellen",
                "Durchsuchbares Arztverzeichnis mit praktischen Filtern",
                "Moderation durch Admins für eine vertrauenswürdige Plattform"
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                  <p className="text-muted-foreground">{item}</p>
                </div>
              ))}
              <Button asChild className="mt-4">
                <Link href="/for-facilities">Bereich für Einrichtungen ansehen</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container py-20">
        <SectionHeading
          eyebrow="Ausgewählte Stellenangebote"
          title="Stellen, die sofort nachvollziehbar sind"
          description="Klare, strukturierte Angebote helfen Ärzten, Rolle, Standort und erwartetes Profil schnell einzuschätzen."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {offers.slice(0, 4).map((offer) => (
            <Card key={offer.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>{offer.title}</CardTitle>
                    <CardDescription>
                      {offer.facility?.facility_name || "Medizinische Einrichtung"} - {offer.city}, {offer.country}
                    </CardDescription>
                  </div>
                  <Badge>{getJobOfferContractTypeLabel(offer.contract_type)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{offer.description}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge className="bg-primary/10 text-primary">{offer.specialty}</Badge>
                  <Badge className="bg-secondary text-secondary-foreground">
                    Veröffentlicht am {formatDate(offer.published_at)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button asChild size="lg">
            <Link href="/opportunities">
              Alle Stellenangebote ansehen
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="bg-primary py-20 text-primary-foreground">
        <div className="container flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm uppercase tracking-[0.2em] text-primary-foreground/80">Bereit für den Einsatz</p>
            <h2 className="text-4xl font-semibold tracking-tight">
              Starten Sie mit einer fokussierten Plattform, die vom ersten Tag an vertrauenswürdig wirkt.
            </h2>
            <p className="text-lg text-primary-foreground/80">
              MedMatch verbindet schlanke Prozesse mit Raum für Verifizierung, Dokumentenworkflows und spätere Erweiterungen.
            </p>
          </div>
          <Button asChild variant="secondary" size="lg">
            <Link href="/register">Konto erstellen</Link>
          </Button>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
