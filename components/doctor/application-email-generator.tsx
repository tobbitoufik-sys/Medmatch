"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createDoctorApplicationEmailDraftAction,
  generateDoctorApplicationEmailAction,
  type ApplicationEmailGenerationResult,
  type GmailDraftCreationResult
} from "@/lib/actions";

const actionButtonClassName =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

const primaryButtonClassName = `${actionButtonClassName} bg-primary text-primary-foreground hover:bg-primary/90`;
const outlineButtonClassName = `${actionButtonClassName} border bg-white text-foreground hover:bg-secondary`;
const gmailDraftButtonClassName = `${actionButtonClassName} border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100`;

const initialResult: ApplicationEmailGenerationResult = {
  success: false,
  message: "",
  subject: "",
  body: ""
};

type ApplicationEmailGeneratorProps = {
  gmailConnected?: boolean;
};

export function ApplicationEmailGenerator({
  gmailConnected = false
}: ApplicationEmailGeneratorProps) {
  const [isPending, startTransition] = useTransition();
  const [isDraftPending, startDraftTransition] = useTransition();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<ApplicationEmailGenerationResult>(initialResult);
  const [draftResult, setDraftResult] = useState<GmailDraftCreationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [hospitalName, setHospitalName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [salutation, setSalutation] = useState<"unknown" | "frau" | "herr">("unknown");
  const [clinicAddress, setClinicAddress] = useState("");
  const [motivationNotes, setMotivationNotes] = useState("");
  const [motivationLetter, setMotivationLetter] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  function isValidRecipientEmail(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  }

  useEffect(() => {
    const nextHospitalName = searchParams.get("hospitalName") ?? "";
    const nextRoleTitle = searchParams.get("roleTitle") ?? "";
    const nextContactPerson = searchParams.get("contactPerson") ?? "";
    const nextRecipientEmail = searchParams.get("recipientEmail") ?? "";
    const nextSalutation = searchParams.get("salutation");
    const nextClinicAddress = searchParams.get("clinicAddress") ?? "";
    const nextMotivationNotes = searchParams.get("motivationNotes") ?? "";

    setHospitalName(nextHospitalName);
    setRoleTitle(nextRoleTitle);
    setContactPerson(nextContactPerson);
    setRecipientEmail(nextRecipientEmail);
    setSalutation(
      nextSalutation === "frau" || nextSalutation === "herr"
        ? nextSalutation
        : "unknown"
    );
    setClinicAddress(nextClinicAddress);
    setMotivationNotes(nextMotivationNotes);
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedLetter = window.sessionStorage.getItem("doctorApplicationMotivationLetter") ?? "";
    setMotivationLetter(storedLetter);
  }, []);

  async function handleCopy() {
    const combined = [emailSubject.trim(), emailBody.trim()].filter(Boolean).join("\n\n");
    if (!combined) return;

    await navigator.clipboard.writeText(combined);
    setCopied(true);
  }

  function handleGenerate() {
    setCopied(false);
    setDraftResult(null);

    startTransition(async () => {
      const nextResult = await generateDoctorApplicationEmailAction({
        hospitalName,
        roleTitle,
        contactPerson,
        salutation,
        clinicAddress,
        motivationNotes
      });

      setResult(nextResult);

      if (nextResult.success) {
        setEmailSubject(nextResult.subject);
        setEmailBody(nextResult.body);
      }
    });
  }

  function handleCreateDraft() {
    if (!isValidRecipientEmail(recipientEmail)) {
      setDraftResult({
        success: false,
        message: "Bitte geben Sie eine gueltige Empfaenger-E-Mail-Adresse ein."
      });
      return;
    }

    setDraftResult(null);

    startDraftTransition(async () => {
      const nextResult = await createDoctorApplicationEmailDraftAction({
        subject: emailSubject,
        body: emailBody,
        motivationLetter,
        recipientEmail
      });

      setDraftResult(nextResult);

      if (nextResult.success && nextResult.draftUrl) {
        window.open(nextResult.draftUrl, "_blank", "noopener,noreferrer");
      }
    });
  }

  const gmailStatusMessage = draftResult
    ? draftResult.success
      ? "Gmail geoeffnet und vorbereitet."
      : "Gmail konnte derzeit nicht vorbereitet werden. Bitte versuchen Sie es erneut."
    : null;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Bewerbungs-E-Mail mit KI
            </h2>
            <p className="text-sm text-slate-600">
              Dieses Tool erstellt eine kurze professionelle deutsche Bewerbungs-E-Mail aus Ihren vorhandenen Profildaten und optionalem Bewerbungskontext.
            </p>
          </div>
          {gmailConnected ? (
            <div className="inline-flex h-11 items-center rounded-full border border-emerald-200 bg-emerald-50 px-5 text-sm font-semibold text-emerald-700">
              Mit Gmail verbunden
            </div>
          ) : (
            <Link
              href="/dashboard/doctor/gmail/connect"
              className={outlineButtonClassName}
            >
              Mit Gmail verbinden
            </Link>
          )}
        </div>
      </section>

      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email-hospital-name">Krankenhaus / Klinik</Label>
            <Input
              id="email-hospital-name"
              value={hospitalName}
              onChange={(event) => setHospitalName(event.target.value)}
              placeholder="z. B. Klinikum Musterstadt"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-role-title">Rolle / Position</Label>
            <Input
              id="email-role-title"
              value={roleTitle}
              onChange={(event) => setRoleTitle(event.target.value)}
              placeholder="z. B. Assistenzarzt Innere Medizin"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-contact-person">Ansprechpartner / Ansprechpartnerin</Label>
            <Input
              id="email-contact-person"
              value={contactPerson}
              onChange={(event) => setContactPerson(event.target.value)}
              placeholder="z. B. Dr. Anna Beispiel"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="email-recipient-email">E-Mail der Klinik / des Ansprechpartners</Label>
            <Input
              id="email-recipient-email"
              type="email"
              value={recipientEmail}
              onChange={(event) => setRecipientEmail(event.target.value)}
              placeholder="z. B. bewerbung@klinikum-musterstadt.de"
            />
            {!isValidRecipientEmail(recipientEmail) ? (
              <p className="text-sm text-red-600">
                Bitte geben Sie eine gueltige E-Mail-Adresse ein.
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-salutation">Anrede</Label>
            <select
              id="email-salutation"
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
            <Label htmlFor="email-clinic-address">Adresse / Ort der Klinik</Label>
            <Input
              id="email-clinic-address"
              value={clinicAddress}
              onChange={(event) => setClinicAddress(event.target.value)}
              placeholder="z. B. Musterstadt oder Hauptstrasse 12, 80331 Muenchen"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="email-motivation-notes">Zusaetzliche Motivation</Label>
            <Textarea
              id="email-motivation-notes"
              value={motivationNotes}
              onChange={(event) => setMotivationNotes(event.target.value)}
              placeholder="Optional: Was soll in der E-Mail besonders betont werden?"
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
            {isPending ? "E-Mail wird erstellt..." : "E-Mail generieren"}
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900">Generierte E-Mail</h3>
            <p className="text-sm text-slate-600">
              Betreff und Text koennen Sie direkt anpassen, bevor Sie die E-Mail weiterverwenden.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!emailSubject.trim() && !emailBody.trim()}
              className={outlineButtonClassName}
            >
              {copied ? "Kopiert" : "Kopieren"}
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-subject">Betreff</Label>
            <Input
              id="email-subject"
              value={emailSubject}
              onChange={(event) => setEmailSubject(event.target.value)}
              placeholder="Hier erscheint der generierte Betreff."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-body">E-Mail-Text</Label>
            <Textarea
              id="email-body"
              value={emailBody}
              onChange={(event) => setEmailBody(event.target.value)}
              placeholder="Hier erscheint der generierte E-Mail-Text."
              className="min-h-[320px]"
            />
          </div>
        </div>

        {gmailStatusMessage ? (
          <div
            className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
              draftResult?.success
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {gmailStatusMessage}
          </div>
        ) : null}
      </section>

      <section className="rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/70 p-6 shadow-sm">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
            LETZTER SCHRITT
          </p>
          <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
            Bewerbung mit Gmail senden
          </h3>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            Oeffnen Sie Ihre fertige Bewerbungs-E-Mail in Gmail. Betreff, Text, Empfaenger sowie Lebenslauf und Motivationsschreiben sind bereits vorbereitet.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCreateDraft}
            disabled={!gmailConnected || !emailSubject.trim() || !emailBody.trim() || isDraftPending}
            className={gmailDraftButtonClassName}
          >
            {isDraftPending ? "Gmail wird vorbereitet..." : "Mit Gmail oeffnen"}
          </button>
        </div>
      </section>
    </div>
  );
}
