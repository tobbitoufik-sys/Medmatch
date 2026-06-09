import Link from "next/link";
import { ArrowRight, Building2, Stethoscope } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="grid-background bg-hero-radial">
      <div className="container grid gap-10 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
        <div className="space-y-8">
          <Badge>Für vertrauensvolle medizinische Vermittlung</Badge>
          <div className="space-y-5">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-foreground md:text-6xl">
              MedMatch verbindet Ärztinnen und Ärzte mit passenden Kliniken, Praxen und MVZ.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Die Plattform bündelt professionelle Profile, strukturierte Stellenangebote und einen klaren Bewerbungsprozess für den deutschen Gesundheitsmarkt.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href="/register">
                Konto erstellen
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/opportunities">Stellenangebote ansehen</Link>
            </Button>
          </div>
        </div>
        <Card className="overflow-hidden border-primary/10">
          <CardContent className="space-y-6 p-8">
            <div className="flex items-center justify-between rounded-3xl bg-secondary p-5">
              <div>
                <p className="text-sm text-muted-foreground">Ärztliche Seite</p>
                <p className="text-xl font-semibold">Professionelles Profil</p>
              </div>
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Stethoscope className="h-6 w-6" />
              </div>
            </div>
            <div className="space-y-4 rounded-3xl border p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Dr. Amina Schneider</p>
                  <p className="text-sm text-muted-foreground">Kardiologie - Berlin</p>
                </div>
                <Badge>Geprüft</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Sucht eine unbefristete Position in einer modernen Klinik mit klaren Strukturen und guter Weiterbildungskultur.
              </p>
            </div>
            <div className="space-y-4 rounded-3xl border p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Medizinisches Zentrum Rhein-Main</p>
                  <p className="text-sm text-muted-foreground">MVZ - Frankfurt am Main</p>
                </div>
                <div className="rounded-2xl bg-accent/10 p-3 text-accent">
                  <Building2 className="h-6 w-6" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Sucht eine erfahrene Fachärztin für Kardiologie mit ambulanter Leitungserfahrung.
              </p>
              <Button asChild className="w-full">
                <Link href="/opportunities">Ausgewählte Stellen ansehen</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
