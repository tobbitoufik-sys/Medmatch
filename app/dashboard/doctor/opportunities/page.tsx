import Link from "next/link";
import type { Route } from "next";

import { EmptyState } from "@/components/dashboard/empty-state";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDoctorPublishedOffers } from "@/lib/data/doctor-opportunities";
import { getJobOfferContractTypeLabel } from "@/lib/job-offers";

export default async function DoctorOpportunitiesPage() {
  const offers = await getDoctorPublishedOffers();

  return (
    <DashboardShell
      role="doctor"
      title="Stellenangebote"
      description="Eine fokussierte Übersicht aktueller Stellenangebote im Gesundheitswesen."
    >
      <div className="grid gap-6">
        {offers.length ? (
          offers.map((offer) => (
            <Link
              key={offer.id}
              href={`/dashboard/doctor/opportunities/${offer.id}` as Route}
              className="block transition-transform hover:-translate-y-0.5"
            >
              <Card className="transition-colors hover:bg-secondary/40">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle>{offer.title}</CardTitle>
                      <CardDescription>
                        Einrichtung im Gesundheitswesen | {offer.city}, {offer.country}
                      </CardDescription>
                    </div>
                    <Badge>{getJobOfferContractTypeLabel(offer.contract_type)}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-muted-foreground">
                  <p>{offer.description}</p>
                  <p>
                    <span className="font-semibold text-foreground">Anforderungen:</span> {offer.requirements}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <EmptyState
            title="Keine veröffentlichten Stellenangebote verfügbar"
            description="Veröffentlichte Stellenangebote von Einrichtungen erscheinen hier, sobald sie online sind."
          />
        )}
      </div>
    </DashboardShell>
  );
}
