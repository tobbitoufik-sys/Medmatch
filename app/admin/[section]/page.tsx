import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const adminSections = {
  statistics: {
    title: "Statistics",
    description: "Zukünftige Plattformmetriken, Generierungszahlen und Admin-Auswertungen."
  },
  "external-offers": {
    title: "External offers",
    description: "Getrennter Admin-Bereich für importierte Stellenangebote außerhalb des nativen job_offers-Flows."
  },
  "import-runs": {
    title: "Import runs",
    description: "Platzhalter für spätere Importläufe, Quellenstatus und Fehlersichten."
  },
  "ai-queue": {
    title: "AI refinement queue",
    description: "Platzhalter für spätere AI-Aufbereitung, Review und Freigaben."
  }
} as const;

type AdminSectionKey = keyof typeof adminSections;

export default async function AdminSectionPlaceholderPage({
  params
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;

  if (!(section in adminSections)) {
    notFound();
  }

  const config = adminSections[section as AdminSectionKey];

  return (
    <DashboardShell
      role="admin"
      title={config.title}
      description={config.description}
    >
      <Card>
        <CardHeader>
          <CardTitle>{config.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Dieser Admin-Bereich ist als Grundlage angelegt und bereit für den nächsten Ausbauschritt.</p>
          <p>Noch keine Import-, AI- oder Publishing-Logik in diesem Schritt.</p>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
