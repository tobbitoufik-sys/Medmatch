import { GoogleGenAI } from "@google/genai";
import { buildCoverLetterPrompt } from "@/lib/ai/cover-letter-prompt";
import type {
  DoctorEducation,
  DoctorExperience,
  DoctorLanguage,
  DoctorProfile,
  DoctorTraining
} from "@/types";

export type DoctorCoverLetterManualContext = {
  hospitalName?: string;
  roleTitle?: string;
  clinicAddress?: string;
  contactPerson?: string;
  salutation?: "unknown" | "frau" | "herr";
  motivationNotes?: string;
};

const GEMINI_MODEL_ORDER = ["gemini-2.5-flash", "gemini-2.5-flash-lite"] as const;
const GEMINI_RETRY_DELAYS_MS = [500, 1200] as const;
const GEMINI_OVERLOAD_MESSAGE =
  "Der KI-Dienst ist aktuell ausgelastet. Bitte versuchen Sie es in wenigen Augenblicken erneut.";

type DoctorCoverLetterFacts = {
  fullName: string;
  senderAddressLine?: string;
  senderLocationLine?: string;
  specialty?: string;
  currentPosition?: string;
  headline?: string;
  city?: string;
  country?: string;
  professionalSummary?: string;
  bio?: string;
  license?: {
    type: string;
    since?: string;
    issuer?: string;
  };
  experiences: Array<{
    title: string;
    institution?: string;
    dateRange?: string;
    description?: string;
  }>;
  educations: Array<{
    degree?: string;
    university?: string;
    dateRange?: string;
  }>;
  trainings: Array<{
    name: string;
    institution?: string;
    certificate?: string;
    dateRange?: string;
  }>;
  languages: Array<{
    name: string;
    level?: string;
  }>;
};

function compact(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function formatDateRange(fromDate?: string | null, toDate?: string | null) {
  const from = compact(fromDate);
  const to = compact(toDate);

  if (!from && !to) return undefined;
  if (from && to) return `${from} bis ${to}`;
  if (from) return `seit ${from}`;
  return `bis ${to}`;
}

function shorten(value: string | null | undefined, maxLength = 220) {
  const normalized = compact(value)?.replace(/\s+/g, " ");
  if (!normalized) return undefined;
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function buildSubjectLine(manualContext: DoctorCoverLetterManualContext) {
  const roleTitle = compact(manualContext.roleTitle);
  const hospitalName = compact(manualContext.hospitalName);

  if (roleTitle && hospitalName) {
    return `Bewerbung als ${roleTitle} im ${hospitalName}`;
  }

  if (roleTitle) {
    return `Bewerbung als ${roleTitle}`;
  }

  if (hospitalName) {
    return `Bewerbung im ${hospitalName}`;
  }

  return "Bewerbung";
}

function buildSuggestedSalutation(
  contactPerson: string | undefined,
  salutation: DoctorCoverLetterManualContext["salutation"] = "unknown"
) {
  const normalized = compact(contactPerson);
  if (!normalized) {
    return "Sehr geehrte Damen und Herren,";
  }

  if (salutation === "frau") {
    const name = normalized.replace(/^frau\s+/i, "").trim();
    return `Sehr geehrte Frau ${name},`;
  }

  if (salutation === "herr") {
    const name = normalized.replace(/^herr\s+/i, "").trim();
    return `Sehr geehrter Herr ${name},`;
  }

  return "Sehr geehrte Damen und Herren,";
}

function buildGermanDateString() {
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date());
}

function buildPlaceDateHint(profile: DoctorProfile, manualContext: DoctorCoverLetterManualContext) {
  const profileCity = compact(profile.city);
  if (profileCity) {
    return profileCity;
  }

  const clinicAddress = compact(manualContext.clinicAddress);
  if (!clinicAddress) {
    return undefined;
  }

  const clinicParts = clinicAddress
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const postalCityPart = clinicParts.find((part) => /\b\d{5}\b/.test(part) && /[A-Za-zÄÖÜäöüß]/.test(part));
  if (postalCityPart) {
    return postalCityPart.replace(/\b\d{5}\b/g, "").replace(/\s+/g, " ").trim() || undefined;
  }

  return clinicParts.at(-1);
}

function buildPlaceDateLine(profile: DoctorProfile, manualContext: DoctorCoverLetterManualContext) {
  const place = buildPlaceDateHint(profile, manualContext);
  const date = buildGermanDateString();

  return place ? `${place}, den ${date}` : `den ${date}`;
}

function renderPlainLetterText(
  text: string,
  profile: DoctorProfile,
  manualContext: DoctorCoverLetterManualContext
) {
  const date = buildGermanDateString();
  const placeDateLine = buildPlaceDateLine(profile, manualContext);
  const salutation = buildSuggestedSalutation(
    manualContext.contactPerson,
    manualContext.salutation ?? "unknown"
  );
  const recipientLines = [
    compact(manualContext.hospitalName),
    compact(manualContext.contactPerson),
    compact(manualContext.clinicAddress)
  ].filter(Boolean);
  const recipientBlock = recipientLines.join("\n");
  const subjectLine = `Betreff: ${buildSubjectLine(manualContext)}`;

  return text
    .replace(/\[Datum\]/g, date)
    .replace(/^\[[^\]\n]+\]\s*$/gm, "")
    .replace(/\s*\[[^\]\n]*(falls bekannt|sonst weglassen|optional)[^\]\n]*\]\s*/gim, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^Betreff\s*\*\*\s*/gim, "Betreff: ")
    .replace(/^Betreff\s*:\s*(.*)$/gim, (_match, captured) =>
      captured?.trim() ? `Betreff: ${captured.trim()}` : subjectLine
    )
    .replace(/^\[Ort.*?\]$/gim, placeDateLine)
    .replace(/^Sehr geehrte Damen und Herren,\s*$/m, salutation)
    .replace(/^\[Empfaenger\]$/gim, recipientBlock)
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .replace(/^Betreff\s*(?!:)/gim, "Betreff: ");
}

function mapExperiences(experiences: DoctorExperience[] | undefined) {
  return (experiences ?? [])
    .filter((item) => compact(item.title))
    .slice(0, 6)
    .map((item) => ({
      title: item.title.trim(),
      institution: compact(item.institution),
      dateRange: formatDateRange(item.from_date, item.to_date),
      description: shorten(item.description, 180)
    }));
}

function mapEducations(educations: DoctorEducation[] | undefined) {
  return (educations ?? [])
    .filter((item) => compact(item.degree_name) || compact(item.education_university))
    .slice(0, 4)
    .map((item) => ({
      degree: compact(item.degree_name),
      university: compact(item.education_university),
      dateRange: formatDateRange(item.from_date, item.to_date)
    }));
}

function mapTrainings(trainings: DoctorTraining[] | undefined) {
  return (trainings ?? [])
    .filter((item) => compact(item.training_name))
    .slice(0, 6)
    .map((item) => ({
      name: item.training_name.trim(),
      institution: compact(item.institution),
      certificate: compact(item.certificate_name),
      dateRange: formatDateRange(item.from_date, item.to_date)
    }));
}

function mapLanguages(languages: DoctorLanguage[] | undefined) {
  return (languages ?? [])
    .filter((item) => compact(item.language_name))
    .slice(0, 6)
    .map((item) => ({
      name: item.language_name.trim(),
      level: compact(item.level_label) ?? compact(item.level_cefr)
    }));
}

function buildProfileFacts(profile: DoctorProfile): DoctorCoverLetterFacts {
  return {
    fullName: [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim(),
    senderAddressLine: compact(profile.street),
    senderLocationLine: [compact(profile.postal_code), compact(profile.city)]
      .filter(Boolean)
      .join(" ")
      .trim() || undefined,
    specialty: compact(profile.specialty),
    currentPosition: compact(profile.current_position),
    headline: compact(profile.headline),
    city: compact(profile.city),
    country: compact(profile.country),
    professionalSummary: compact(profile.professional_summary),
    bio: compact(profile.bio),
    license:
      compact(profile.license_type) && profile.license_type !== "none"
        ? {
            type: profile.license_type,
            since: compact(profile.license_since),
            issuer: compact(profile.license_issuer)
          }
        : undefined,
    experiences: mapExperiences(profile.experiences),
    educations: mapEducations(profile.educations),
    trainings: mapTrainings(profile.trainings),
    languages: mapLanguages(profile.doctor_languages)
  };
}

function buildPromptFacts(profile: DoctorProfile, manualContext: DoctorCoverLetterManualContext) {
  return JSON.stringify(
    {
      profile: buildProfileFacts(profile),
      applicationContext: {
        hospitalName: compact(manualContext.hospitalName),
        roleTitle: compact(manualContext.roleTitle),
        clinicAddress: compact(manualContext.clinicAddress),
        contactPerson: compact(manualContext.contactPerson),
        salutation: manualContext.salutation ?? "unknown",
        motivationNotes: compact(manualContext.motivationNotes),
        subjectLine: buildSubjectLine(manualContext),
        suggestedSalutation: buildSuggestedSalutation(
          manualContext.contactPerson,
          manualContext.salutation ?? "unknown"
        ),
        placeDateHint: buildPlaceDateHint(profile, manualContext),
        placeDateLine: buildPlaceDateLine(profile, manualContext),
        date: buildGermanDateString()
      }
    },
    null,
    2
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isGeminiUnavailableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    status?: number;
    message?: string;
    cause?: { status?: number; message?: string };
  };

  const status = candidate.status ?? candidate.cause?.status;
  if (status === 503) {
    return true;
  }

  const message = `${candidate.message ?? ""} ${candidate.cause?.message ?? ""}`.toLowerCase();
  return (
    message.includes("503") ||
    message.includes("unavailable") ||
    message.includes("overloaded") ||
    message.includes("high demand")
  );
}

function toSafeGeminiError(error: unknown) {
  if (isGeminiUnavailableError(error)) {
    return new Error(GEMINI_OVERLOAD_MESSAGE);
  }

  return new Error("Das Motivationsschreiben konnte derzeit nicht erstellt werden. Bitte versuchen Sie es erneut.");
}

function safeSerialize(value: unknown) {
  if (value == null) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function logGeminiCoverLetterError(error: unknown) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  if (error instanceof Error) {
    const candidate = error as Error & {
      status?: number;
      code?: string | number;
      details?: unknown;
      response?: unknown;
      body?: unknown;
      errors?: unknown;
      cause?: {
        status?: number;
        code?: string | number;
        message?: string;
        details?: unknown;
        response?: unknown;
        body?: unknown;
        errors?: unknown;
      };
    };

    console.error("[cover-letter][gemini] generation failed");
    console.error("message:", candidate.message);
    console.error("status:", candidate.status ?? candidate.cause?.status ?? null);
    console.error("code:", candidate.code ?? candidate.cause?.code ?? null);
    console.error("details:", safeSerialize(candidate.details ?? candidate.cause?.details));
    console.error("response:", safeSerialize(candidate.response ?? candidate.cause?.response));
    console.error("body:", safeSerialize(candidate.body ?? candidate.cause?.body));
    console.error("errors:", safeSerialize(candidate.errors ?? candidate.cause?.errors));
    console.error("causeMessage:", candidate.cause?.message ?? null);
    console.error("stack:", candidate.stack ?? null);
    return;
  }

  console.error("[cover-letter][gemini] generation failed");
  console.error("message:", safeSerialize(error));
}

export async function generateDoctorCoverLetter(args: {
  profile: DoctorProfile;
  manualContext: DoctorCoverLetterManualContext;
}) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const { systemPrompt, userPrompt } = buildCoverLetterPrompt(
    buildPromptFacts(args.profile, args.manualContext)
  );

  let lastError: unknown = null;

  for (const model of GEMINI_MODEL_ORDER) {
    for (let attempt = 0; attempt <= GEMINI_RETRY_DELAYS_MS.length; attempt += 1) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.3
          }
        });

        const text = response.text?.trim() ?? "";

        if (!text) {
          throw new Error("The Gemini response did not contain any letter text.");
        }

        return renderPlainLetterText(text, args.profile, args.manualContext);
      } catch (error) {
        lastError = error;
        logGeminiCoverLetterError(error);

        if (!isGeminiUnavailableError(error)) {
          throw toSafeGeminiError(error);
        }

        if (attempt < GEMINI_RETRY_DELAYS_MS.length) {
          await sleep(GEMINI_RETRY_DELAYS_MS[attempt]);
          continue;
        }
      }
    }
  }

  throw toSafeGeminiError(lastError);
}
