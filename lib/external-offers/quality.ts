export type ExternalOfferQualityInput = {
  title?: string | null;
  hospital_name?: string | null;
  location?: string | null;
  specialty?: string | null;
  contract_type?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  clinic_address?: string | null;
  source_url?: string | null;
  summary?: string | null;
};

export type ExternalOfferQualityClassification =
  | "Bereit zur Veröffentlichung"
  | "Review erforderlich"
  | "Unvollständig";

type ScorePart = {
  label: string;
  points: number;
  met: boolean;
};

export type ExternalOfferQualityResult = {
  score: number;
  classification: ExternalOfferQualityClassification;
  strengths: string[];
  missing: string[];
  breakdown: Array<{ label: string; points: number; met: boolean }>;
};

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function isValidUrl(value: string | null | undefined) {
  if (!value?.trim()) return false;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function getSummaryPoints(summary: string | null | undefined) {
  const length = summary?.trim().length ?? 0;
  if (length >= 120) return 15;
  if (length >= 60) return 8;
  return 0;
}

function getScoreParts(input: ExternalOfferQualityInput): ScorePart[] {
  const summaryPoints = getSummaryPoints(input.summary);

  return [
    { label: "Titel vorhanden", points: 15, met: hasText(input.title) },
    { label: "Krankenhaus vorhanden", points: 15, met: hasText(input.hospital_name) },
    { label: "Source URL vorhanden", points: 10, met: isValidUrl(input.source_url) },
    { label: "Zusammenfassung ausreichend", points: summaryPoints, met: summaryPoints > 0 },
    { label: "Standort vorhanden", points: 8, met: hasText(input.location) },
    { label: "Fachrichtung vorhanden", points: 8, met: hasText(input.specialty) },
    { label: "Vertragsart vorhanden", points: 8, met: hasText(input.contract_type) },
    { label: "Klinikadresse vorhanden", points: 10, met: hasText(input.clinic_address) },
    { label: "Kontakt-E-Mail vorhanden", points: 8, met: hasText(input.contact_email) },
    { label: "Kontakt-Telefon vorhanden", points: 3, met: hasText(input.contact_phone) }
  ];
}

export function getExternalOfferQuality(
  input: ExternalOfferQualityInput
): ExternalOfferQualityResult {
  const scoreParts = getScoreParts(input);
  const score = scoreParts.reduce((total, part) => total + (part.met ? part.points : 0), 0);
  const hasCoreData =
    hasText(input.title) &&
    hasText(input.hospital_name) &&
    isValidUrl(input.source_url) &&
    getSummaryPoints(input.summary) > 0;
  const hasContactChannel = hasText(input.contact_email) || hasText(input.contact_phone);

  let classification: ExternalOfferQualityClassification = "Unvollständig";
  if (score >= 80 && hasCoreData && hasContactChannel) {
    classification = "Bereit zur Veröffentlichung";
  } else if (score >= 50) {
    classification = "Review erforderlich";
  }

  const strengths = scoreParts.filter((part) => part.met).map((part) => part.label);
  const missing = scoreParts.filter((part) => !part.met).map((part) => part.label);

  return {
    score,
    classification,
    strengths,
    missing,
    breakdown: scoreParts
  };
}
