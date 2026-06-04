import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ExternalJobOffer } from "@/types";
import Link from "next/link";

function formatContractType(contractType: ExternalJobOffer["contract_type"]) {
  if (contractType === "honorar") return "Honorar";
  if (contractType === "befristet") return "Befristet";
  if (contractType === "unbefristet") return "Unbefristet";
  return null;
}

export default async function DoctorExternalOffersPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("external_job_offers")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false });

  const offers = (data as ExternalJobOffer[] | null) ?? [];

  return (
    <DashboardShell
      role="doctor"
      title="Externe Stellen"
      description="Hier finden Sie importierte Stellenangebote, die Sie mit dem unterstuetzten Ablauf aus CV, Motivationsschreiben und E-Mail vorbereiten koennen."
    >
      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Externe Angebote</p>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Importierte Stellen fuer den begleiteten Bewerbungsablauf
          </h2>
          <p className="max-w-3xl text-sm text-slate-600">
            Diese Angebote bleiben getrennt vom nativen MedMatch-Stellenworkflow und fuehren Sie durch den unterstuetzten Ablauf: CV, Motivationsschreiben und Bewerbungs-E-Mail.
          </p>
        </div>
      </section>

      {offers.length ? (
        <section className="grid gap-4">
          {offers.map((offer) => {
            const contractTypeLabel = formatContractType(offer.contract_type);

            return (
              <Link
                key={offer.id}
                href={`/dashboard/doctor/external-offers/${offer.id}`}
                className="block rounded-3xl border bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Externes Stellenangebot
                    </p>
                    <h3 className="text-xl font-semibold tracking-tight text-slate-900">{offer.title}</h3>
                    <p className="text-sm font-medium text-slate-700">{offer.hospital_name}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                    {offer.location ? <span className="rounded-full bg-slate-100 px-3 py-1">{offer.location}</span> : null}
                    {offer.specialty ? <span className="rounded-full bg-slate-100 px-3 py-1">{offer.specialty}</span> : null}
                    {contractTypeLabel ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1">{contractTypeLabel}</span>
                    ) : null}
                    {offer.source_name ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1">{offer.source_name}</span>
                    ) : null}
                  </div>

                  {offer.summary ? <p className="max-w-3xl text-sm text-slate-600">{offer.summary}</p> : null}
                </div>
              </Link>
            );
          })}
        </section>
      ) : (
        <EmptyState
          title="Noch keine externen Stellen verfuegbar."
          description="Sobald externe Stellenangebote importiert werden, erscheinen sie hier in einer separaten Uebersicht."
        />
      )}
    </DashboardShell>
  );
}
