import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const steps = [
  ["1. Registrieren", "Wählen Sie Ihre Rolle als Arzt oder Einrichtung und erstellen Sie Ihr Konto."],
  ["2. Profil vervollständigen", "Ergänzen Sie Fachrichtungen, Standort, Erfahrung, Einrichtungsdaten und Recruiting-Bedarf."],
  ["3. Suchen und Kontakt aufnehmen", "Durchsuchen Sie Stellenangebote oder Arztprofile und senden Sie eine professionelle Anfrage."],
  ["4. Qualität sichern", "Die Administration hilft, Profile, Angebote und die Plattformqualität zu prüfen."]
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="container py-20">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm uppercase tracking-[0.2em] text-primary">So funktioniert es</p>
          <h1 className="text-5xl font-semibold tracking-tight">Ein praktischer Workflow für medizinische Vermittlung.</h1>
          <p className="text-lg text-muted-foreground">
            MedMatch reduziert Komplexität und konzentriert sich auf klare Profile, klare Stellenangebote und einen sauberen Kontaktprozess.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {steps.map(([title, description]) => (
            <Card key={title}>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Jeder Schritt ist bewusst schlank gehalten, damit professionelle Vermittlung schnell und nachvollziehbar funktioniert.
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
