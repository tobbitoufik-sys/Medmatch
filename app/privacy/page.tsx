import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="container max-w-4xl py-20">
        <h1 className="text-4xl font-semibold tracking-tight">Datenschutz</h1>
        <div className="mt-8 space-y-6 text-muted-foreground">
          <p>MedMatch verarbeitet berufliche Konto-, Profil-, Bewerbungs- und Recruiting-Daten. Die Plattform ist nicht für Patientendaten vorgesehen.</p>
          <p>Ergänzen Sie vor dem Produktivbetrieb die finalen Angaben zu Speicherfristen, Rechtsgrundlagen, Auskunftsrechten und Löschprozessen.</p>
          <p>Prüfen Sie die für Ihre Jurisdiktion geltenden Anforderungen und ersetzen Sie diesen Hinweis durch die finale Datenschutzerklärung.</p>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
