"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  generateDoctorCoverLetterAction,
  type CoverLetterGenerationResult
} from "@/lib/actions";

const actionButtonClassName =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

const primaryButtonClassName = `${actionButtonClassName} bg-primary text-primary-foreground hover:bg-primary/90`;
const outlineButtonClassName = `${actionButtonClassName} border bg-white text-foreground hover:bg-secondary`;

const initialResult: CoverLetterGenerationResult = {
  success: false,
  message: "",
  generatedLetter: ""
};

export function CoverLetterGenerator() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<CoverLetterGenerationResult>(initialResult);
  const [copied, setCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [hospitalName, setHospitalName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [salutation, setSalutation] = useState<"unknown" | "frau" | "herr">("unknown");
  const [motivationNotes, setMotivationNotes] = useState("");
  const [generatedLetter, setGeneratedLetter] = useState("");

  const applicationEmailHref = useMemo(() => {
    const query: Record<string, string> = {};

    if (hospitalName.trim()) query.hospitalName = hospitalName.trim();
    if (roleTitle.trim()) query.roleTitle = roleTitle.trim();
    if (contactPerson.trim()) query.contactPerson = contactPerson.trim();
    if (recipientEmail.trim()) query.recipientEmail = recipientEmail.trim();
    if (salutation !== "unknown") query.salutation = salutation;
    if (clinicAddress.trim()) query.clinicAddress = clinicAddress.trim();
    if (motivationNotes.trim()) query.motivationNotes = motivationNotes.trim();

    return {
      pathname: "/dashboard/doctor/application-email",
      query
    };
  }, [
    hospitalName,
    roleTitle,
    contactPerson,
    recipientEmail,
    salutation,
    clinicAddress,
    motivationNotes
  ]);

  function handleApplicationEmailClick() {
    if (typeof window === "undefined") {
      return;
    }

    if (!generatedLetter.trim()) {
      window.sessionStorage.removeItem("doctorApplicationMotivationLetter");
      return;
    }

    window.sessionStorage.setItem(
      "doctorApplicationMotivationLetter",
      generatedLetter
    );
  }

  function handleGenerate() {
    setCopied(false);

    startTransition(async () => {
      const nextResult = await generateDoctorCoverLetterAction({
        hospitalName,
        roleTitle,
        clinicAddress,
        contactPerson,
        salutation,
        motivationNotes
      });

      setResult(nextResult);

      if (nextResult.success) {
        setGeneratedLetter(nextResult.generatedLetter);
      }
    });
  }

  async function handleCopy() {
    if (!generatedLetter.trim()) return;

    await navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
  }

  async function handleExportPdf() {
    if (!generatedLetter.trim()) return;

    try {
      setIsExportingPdf(true);
      const [{ pdf }, { CoverLetterPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/doctor/cover-letter-pdf-document")
      ]);
      const blob = await pdf(
        <CoverLetterPdfDocument letter={generatedLetter} />
      ).toBlob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "motivationsschreiben.pdf";
      link.click();
      URL.revokeObjectURL(blobUrl);
    } finally {
      setIsExportingPdf(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Motivationsschreiben mit KI erstellen
          </h2>
          <p className="text-sm text-slate-600">
            Das Schreiben wird aus Ihren vorhandenen Profildaten plus optionalem Bewerbungskontext erstellt.
          </p>
          <p className="text-sm text-slate-500">
            Die KI darf keine Stationen, Abschluesse, Titel, Sprachlevel, Lizenzen oder Daten erfinden. Fehlende Angaben werden weggelassen oder vorsichtig formuliert.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="hospital-name">Krankenhaus / Klinik</Label>
            <Input
              id="hospital-name"
              value={hospitalName}
              onChange={(event) => setHospitalName(event.target.value)}
              placeholder="z. B. Klinikum Musterstadt"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role-title">Rolle / Position</Label>
            <Input
              id="role-title"
              value={roleTitle}
              onChange={(event) => setRoleTitle(event.target.value)}
              placeholder="z. B. Assistenzarzt Innere Medizin"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clinic-address">Adresse / Ort der Klinik</Label>
            <Input
              id="clinic-address"
              value={clinicAddress}
              onChange={(event) => setClinicAddress(event.target.value)}
              placeholder="z. B. Musterstadt oder Hauptstrasse 12, 80331 Muenchen"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-person">Ansprechpartner / Ansprechpartnerin</Label>
            <Input
              id="contact-person"
              value={contactPerson}
              onChange={(event) => setContactPerson(event.target.value)}
              placeholder="z. B. Dr. Anna Beispiel"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="recipient-email">E-Mail der Klinik / des Ansprechpartners</Label>
            <Input
              id="recipient-email"
              type="email"
              value={recipientEmail}
              onChange={(event) => setRecipientEmail(event.target.value)}
              placeholder="z. B. bewerbung@klinikum-musterstadt.de"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salutation">Anrede</Label>
            <select
              id="salutation"
              value={salutation}
              onChange={(event) =>
                setSalutation(event.target.value as "unknown" | "frau" | "herr")
              }
              className="flex h-11 w-full rounded-2xl border bg-white px-4 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="unknown">Unbekannt</option>
              <option value="frau">Frau</option>
              <option value="herr">Herr</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="motivation-notes">Zusaetzliche Motivation</Label>
            <Textarea
              id="motivation-notes"
              value={motivationNotes}
              onChange={(event) => setMotivationNotes(event.target.value)}
              placeholder="Optional: Warum passt die Position zu Ihnen oder was ist Ihnen bei der Stelle wichtig?"
              className="min-h-[140px]"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isPending}
            className={primaryButtonClassName}
          >
            {isPending
              ? "Motivationsschreiben wird erstellt..."
              : generatedLetter
                ? "Neu generieren"
                : "Motivationsschreiben generieren"}
          </button>
        </div>

        {result.message ? (
          <div
            className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
              result.success
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {result.message}
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900">Generiertes Schreiben</h3>
            <p className="text-sm text-slate-600">
              Sie koennen den Text direkt anpassen, bevor Sie ihn kopieren und weiterverwenden.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!generatedLetter.trim()}
              className={outlineButtonClassName}
            >
              {copied ? "Kopiert" : "Kopieren"}
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={!generatedLetter.trim() || isExportingPdf}
              className={outlineButtonClassName}
            >
              {isExportingPdf ? "PDF wird erstellt..." : "Als PDF exportieren"}
            </button>
          </div>
        </div>

        <Textarea
          value={generatedLetter}
          onChange={(event) => setGeneratedLetter(event.target.value)}
          placeholder="Hier erscheint Ihr Motivationsschreiben."
          className="mt-4 min-h-[420px]"
        />
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(135deg,#f8fbfd_0%,#eef5f8_100%)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              NAECHSTER SCHRITT
            </p>
            <h3 className="text-lg font-semibold text-slate-900">
              Bewerbungs-E-Mail aus Ihrem Motivationsschreiben erstellen
            </h3>
            <p className="text-sm text-slate-600">
              Nutzen Sie Ihr fertiges Motivationsschreiben als Grundlage fuer eine professionelle deutsche Bewerbungs-E-Mail.
            </p>
          </div>
          <Link
            href={applicationEmailHref}
            onClick={handleApplicationEmailClick}
            className={`${primaryButtonClassName} sm:shrink-0`}
          >
            Bewerbungs-E-Mail mit KI erstellen
          </Link>
        </div>
      </section>

    </div>
  );
}
