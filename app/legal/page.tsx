import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function LegalPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="container max-w-4xl py-20">
        <h1 className="text-4xl font-semibold tracking-tight">Impressum</h1>
        <div className="mt-8 space-y-6 text-muted-foreground">
          <p>Diese Seite ist für die rechtlichen Anbieterangaben von MedMatch vorgesehen und sollte vor dem Produktivbetrieb mit den finalen Unternehmensdaten ergänzt werden.</p>
          <p>MedMatch ist eine professionelle Vermittlungsplattform für medizinische Karriere- und Recruiting-Prozesse. Die Plattform verarbeitet keine Patientenakten und ersetzt keine medizinische Beratung.</p>
          <p>Ergänzen Sie hier Unternehmensname, Rechtsform, Anschrift, Vertretungsberechtigte, Registerangaben und Hosting-Informationen.</p>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
