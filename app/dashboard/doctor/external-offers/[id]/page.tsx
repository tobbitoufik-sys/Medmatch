import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ExternalJobOffer } from "@/types";

function formatContractType(contractType: ExternalJobOffer["contract_type"]) {
  if (contractType === "honorar") return "Honorar";
  if (contractType === "befristet") return "Befristet";
  if (contractType === "unbefristet") return "Unbefristet";
  return null;
}

function buildApplicationRoleTitle(title: string) {
  return title
    .replace(/\(\s*[mwdiv\/\-\s]+\s*\)/gi, " ")
    .replace(/\(\s*fach-\s*\)\s*arzt\/(?:ärztin|aerztin|Ärztin|AErztin)/gi, "Facharzt")
    .replace(/\bfach-\s*arzt\/(?:ärztin|aerztin|Ärztin|AErztin)\b/gi, "Facharzt")
    .replace(/\bfacharzt\/(?:fachärztin|fachaerztin|Fachärztin|FachAErztin|ärztin|aerztin|Ärztin|AErztin)\b/gi, "Facharzt")
    .replace(/\boberarzt\/(?:oberärztin|oberaerztin|Oberärztin|OberAErztin|ärztin|aerztin|Ärztin|AErztin)\b/gi, "Oberarzt")
    .replace(/\bassistenzarzt\/(?:assistenzärztin|assistenzaerztin|Assistenzärztin|AssistenzAErztin|ärztin|aerztin|Ärztin|AErztin)\b/gi, "Assistenzarzt")
    .replace(/\bchefarzt\/(?:chefärztin|chefaerztin|Chefärztin|ChefAErztin|ärztin|aerztin|Ärztin|AErztin)\b/gi, "Chefarzt")
    .replace(/\s*\/\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

type DoctorExternalOfferDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DoctorExternalOfferDetailPage({
  params
}: DoctorExternalOfferDetailPageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("external_job_offers")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  const offer = data as ExternalJobOffer | null;

  if (!offer) {
    notFound();
  }

  const contractTypeLabel = formatContractType(offer.contract_type);
  const applicationRoleTitle = buildApplicationRoleTitle(offer.title);
  const cvHref = {
    pathname: "/dashboard/doctor/cv",
    query: {
      hospitalName: offer.hospital_name,
      roleTitle: applicationRoleTitle,
      clinicAddress: offer.clinic_address ?? "",
      contactPerson: offer.contact_person ?? "",
      recipientEmail: offer.contact_email ?? "",
      salutation: offer.salutation
    }
  };

  return (
    <DashboardShell
      role="doctor"
      title="Externes Stellenangebot"
      description="Pruefen Sie importierte Stellendetails und starten Sie daraus den begleiteten Bewerbungsablauf."
    >
      <div className="space-y-6">
        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Externes Stellenangebot
            </p>
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{offer.title}</h2>
              <p className="text-base font-medium text-slate-700">{offer.hospital_name}</p>
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
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
          <article className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="space-y-5">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-900">Beschreibung</h3>
                <p className="text-sm leading-6 text-slate-600">
                  {offer.summary || "Zu diesem externen Stellenangebot wurde noch keine zusaetzliche Beschreibung hinterlegt."}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {offer.clinic_address ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Klinikadresse</p>
                    <p className="text-sm text-slate-700">{offer.clinic_address}</p>
                  </div>
                ) : null}
                {offer.contact_person ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Ansprechpartner</p>
                    <p className="text-sm text-slate-700">{offer.contact_person}</p>
                  </div>
                ) : null}
                {offer.contact_email ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Kontakt-E-Mail</p>
                    <p className="text-sm text-slate-700">{offer.contact_email}</p>
                  </div>
                ) : null}
                {offer.contact_phone ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Kontakt-Telefon</p>
                    <p className="text-sm text-slate-700">{offer.contact_phone}</p>
                  </div>
                ) : null}
                {offer.source_name ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Quelle</p>
                    <p className="text-sm text-slate-700">{offer.source_name}</p>
                  </div>
                ) : null}
              </div>

              {offer.source_url ? (
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Quelllink</p>
                  <a
                    href={offer.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Originales Stellenangebot ansehen
                  </a>
                </div>
              ) : null}
            </div>
          </article>

          <aside className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(135deg,#f8fbfd_0%,#eef5f8_100%)] p-6 shadow-sm">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                NAECHSTER SCHRITT
              </p>
              <h3 className="text-lg font-semibold text-slate-900">Bewerbung vorbereiten</h3>
              <p className="text-sm leading-6 text-slate-600">
                Uebernehmen Sie Klinik-, Kontakt- und Bewerbungsdaten direkt in den begleiteten Ablauf aus Motivationsschreiben und Bewerbungs-E-Mail.
              </p>
              {!offer.contact_email ? (
                <p className="text-sm leading-6 text-amber-700">
                  Fuer diese externe Stelle wurde keine Kontakt-E-Mail gefunden. CV und Motivationsschreiben bleiben verfuegbar; die Empfaenger-E-Mail muss im E-Mail-Schritt manuell ergaenzt werden.
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={cvHref}
                className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Bewerbung vorbereiten
              </Link>
              <Link
                href="/dashboard/doctor/external-offers"
                className="inline-flex h-11 items-center justify-center rounded-full border bg-white px-5 text-sm font-semibold text-foreground transition hover:bg-secondary"
              >
                Zurueck zur Uebersicht
              </Link>
            </div>
          </aside>
        </section>
      </div>
    </DashboardShell>
  );
}
