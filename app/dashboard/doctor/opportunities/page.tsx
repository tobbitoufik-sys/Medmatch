import Link from "next/link";
import type { Route } from "next";
import { BriefcaseBusiness, ChevronRight, MapPin, Search, Sparkles } from "lucide-react";

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
      <div className="space-y-4 md:hidden">
        <div className="flex min-h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-slate-400 shadow-sm">
          <Search className="h-5 w-5 shrink-0" />
          <span className="text-base">Stellen suchen</span>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
          <div className="flex min-w-max gap-2 pb-1">
            {["Ort", "Fachrichtung", "Vollzeit", "Neu"].map((label) => (
              <span
                key={label}
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm"
              >
                {label === "Ort" ? <MapPin className="h-4 w-4 text-primary" /> : null}
                {label === "Fachrichtung" ? <Sparkles className="h-4 w-4 text-primary" /> : null}
                {label === "Vollzeit" ? <BriefcaseBusiness className="h-4 w-4 text-primary" /> : null}
                {label}
              </span>
            ))}
          </div>
        </div>

        <Link
          href="/dashboard/doctor/external-offers"
          className="flex items-center gap-4 rounded-3xl border border-primary/20 bg-[linear-gradient(135deg,#f8fbff_0%,#edf6ff_100%)] p-4 shadow-sm"
        >
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm">
            <BriefcaseBusiness className="h-7 w-7" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-slate-950">Externe Stellen entdecken</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Finden Sie passende Stellenangebote von Kliniken, Praxen und MVZ.
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-900" />
        </Link>

        {offers.length ? (
          <section className="space-y-4">
            {offers.map((offer) => (
              <Link
                key={offer.id}
                href={`/dashboard/doctor/opportunities/${offer.id}` as Route}
                className="block rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex gap-4">
                  <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border bg-primary/10 text-primary">
                    <BriefcaseBusiness className="h-8 w-8" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="line-clamp-2 text-lg font-semibold leading-tight text-slate-950">{offer.title}</h2>
                        <p className="mt-1 text-sm font-medium text-slate-700">Einrichtung im Gesundheitswesen</p>
                      </div>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        MedMatch
                      </span>
                    </div>
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">{offer.city}, {offer.country}</span>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-600">
                      <span>{getJobOfferContractTypeLabel(offer.contract_type)}</span>
                      <span>veröffentlicht</span>
                    </div>
                  </div>
                </div>
                <span className="mt-4 flex min-h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-white">
                  Details ansehen
                  <ChevronRight className="ml-2 h-4 w-4" />
                </span>
              </Link>
            ))}
          </section>
        ) : (
          <EmptyState
            title="Keine veröffentlichten Stellenangebote verfügbar"
            description="Veröffentlichte Stellenangebote von Einrichtungen erscheinen hier, sobald sie online sind."
          />
        )}
      </div>

      <div className="hidden gap-6 md:grid">
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
