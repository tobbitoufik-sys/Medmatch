import { GoogleGenAI } from "@google/genai";
import type {
  DoctorEducation,
  DoctorExperience,
  DoctorLanguage,
  DoctorProfile,
  DoctorTraining
} from "@/types";

export type DoctorApplicationEmailManualContext = {
  hospitalName?: string;
  roleTitle?: string;
  clinicAddress?: string;
  contactPerson?: string;
  salutation?: "unknown" | "frau" | "herr";
  motivationNotes?: string;
};

type DoctorApplicationEmailResult = {
  subject: string;
  body: string;
};

const GEMINI_MODEL_ORDER = ["gemini-2.5-flash", "gemini-2.5-flash-lite"] as const;
const GEMINI_RETRY_DELAYS_MS = [500, 1200] as const;
const GEMINI_OVERLOAD_MESSAGE =
  "Der KI-Dienst ist aktuell ausgelastet. Bitte versuchen Sie es in wenigen Augenblicken erneut.";

function compact(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function toTitleCaseSegment(value: string) {
  if (!value) return value;
  if (/^[A-ZÄÖÜ]/.test(value) && /[a-zäöüß]/.test(value)) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function normalizeContactPerson(value: string | undefined) {
  const normalized = compact(value);
  if (!normalized) return undefined;

  return normalized
    .split(/\s+/)
    .map((part) => {
      if (/^(dr|prof)\.?$/i.test(part)) {
        return `${part.replace(/\./g, "").charAt(0).toUpperCase()}${part
          .replace(/\./g, "")
          .slice(1)
          .toLowerCase()}.`;
      }

      if (/^(von|van|de|der|den|zu)$/i.test(part)) {
        return part.toLowerCase();
      }

      if (part.includes("-")) {
        return part
          .split("-")
          .map((segment) => toTitleCaseSegment(segment))
          .join("-");
      }

      return toTitleCaseSegment(part);
    })
    .join(" ");
}

function formatDateRange(fromDate?: string | null, toDate?: string | null) {
  const from = compact(fromDate);
  const to = compact(toDate);

  if (!from && !to) return undefined;
  if (from && to) return `${from} bis ${to}`;
  if (from) return `seit ${from}`;
  return `bis ${to}`;
}

function shorten(value: string | null | undefined, maxLength = 180) {
  const normalized = compact(value)?.replace(/\s+/g, " ");
  if (!normalized) return undefined;
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function buildEmailSubject(manualContext: DoctorApplicationEmailManualContext) {
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
  salutation: DoctorApplicationEmailManualContext["salutation"] = "unknown"
) {
  const normalized = normalizeContactPerson(contactPerson);
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

function mapExperiences(experiences: DoctorExperience[] | undefined) {
  return (experiences ?? [])
    .filter((item) => compact(item.title))
    .slice(0, 4)
    .map((item) => ({
      title: item.title.trim(),
      institution: compact(item.institution),
      dateRange: formatDateRange(item.from_date, item.to_date),
      description: shorten(item.description, 120)
    }));
}

function mapEducations(educations: DoctorEducation[] | undefined) {
  return (educations ?? [])
    .filter((item) => compact(item.degree_name) || compact(item.education_university))
    .slice(0, 3)
    .map((item) => ({
      degree: compact(item.degree_name),
      university: compact(item.education_university),
      dateRange: formatDateRange(item.from_date, item.to_date)
    }));
}

function mapTrainings(trainings: DoctorTraining[] | undefined) {
  return (trainings ?? [])
    .filter((item) => compact(item.training_name))
    .slice(0, 4)
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

function buildPromptFacts(profile: DoctorProfile, manualContext: DoctorApplicationEmailManualContext) {
  const normalizedContactPerson = normalizeContactPerson(manualContext.contactPerson);

  return JSON.stringify(
    {
      profile: {
        fullName: [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim(),
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
      },
      applicationContext: {
        hospitalName: compact(manualContext.hospitalName),
        roleTitle: compact(manualContext.roleTitle),
        clinicAddress: compact(manualContext.clinicAddress),
        contactPerson: normalizedContactPerson,
        salutation: manualContext.salutation ?? "unknown",
        motivationNotes: compact(manualContext.motivationNotes),
        subjectLine: buildEmailSubject(manualContext),
        suggestedSalutation: buildSuggestedSalutation(
          normalizedContactPerson,
          manualContext.salutation ?? "unknown"
        )
      }
    },
    null,
    2
  );
}

function buildApplicationEmailPrompt(promptFacts: string) {
  const systemPrompt = [
    "Du schreibst eine kurze professionelle deutsche Bewerbungs-E-Mail fuer einen Arzt oder eine Aerztin.",
    "Nutze ausschliesslich die bereitgestellten Fakten aus dem Profil und dem optionalen Bewerbungskontext.",
    "Erfinde niemals Berufsjahre, Institutionen, Abschluesse, Sprachlevel, Titel, Lizenzen, Verfahren oder Daten.",
    "Wenn Informationen fehlen, lasse sie weg oder formuliere vorsichtig und allgemein.",
    "Der Ton muss formell, glaubwuerdig, medizinisch-professionell und deutlich kuerzer als ein Motivationsschreiben sein.",
    "Schreibe eine echte kurze Bewerbungs-E-Mail, keine Mini-Version eines Motivationsschreibens.",
    "Der E-Mail-Text soll aus einer formellen Anrede, hoechstens zwei kurzen Abschnitten mit wenigen Saetzen und einer knappen Schlussformel bestehen.",
    "Halte den Text kompakt, direkt und alltagstauglich fuer eine deutsche Bewerbungs-E-Mail.",
    "Gib ausschliesslich JSON mit den Schluesseln subject und body zurueck."
  ].join(" ");

  const userPrompt = [
    "Erstelle eine kurze deutsche Bewerbungs-E-Mail.",
    "subject: eine knappe professionelle Betreffzeile.",
    "body: ein kurzer formeller E-Mail-Text mit Anrede, ein bis zwei sehr kurzen Abschnitten und Schlussformel.",
    "Schreibe keine ausfuehrliche Selbstdarstellung und keine langen Motivationspassagen.",
    "Wenn Sprachen oder andere Fakten nicht sicher relevant oder nicht vollstaendig belegt sind, lasse sie lieber weg statt sie zu verkuerzen oder umzudeuten.",
    "Verwende bei unbekannter Anrede die sichere formale Standardanrede.",
    "Kein Markdown, keine Erklaerungen, kein Codeblock.",
    "",
    promptFacts
  ].join("\n");

  return { systemPrompt, userPrompt };
}

function stripCodeFences(value: string) {
  return value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function renderPlainEmailResult(
  rawText: string,
  manualContext: DoctorApplicationEmailManualContext
): DoctorApplicationEmailResult {
  const fallbackSubject = buildEmailSubject(manualContext);
  const normalizedContactPerson = normalizeContactPerson(manualContext.contactPerson);
  const suggestedSalutation = buildSuggestedSalutation(
    normalizedContactPerson,
    manualContext.salutation ?? "unknown"
  );

  const normalizeBody = (value: string) =>
    value
      .replace(/\r\n/g, "\n")
      .replace(/\*\*/g, "")
      .replace(
        /^((Sehr geehrte Frau|Sehr geehrter Herr)\s+)(.+?)(,?)$/im,
        (_match, prefix: string, _kind: string, name: string, comma: string) =>
          `${prefix}${normalizeContactPerson(name) ?? name}${comma || ","}`
      )
      .replace(/^Sehr geehrte Damen und Herren,$/m, suggestedSalutation)
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  try {
    const parsed = JSON.parse(stripCodeFences(rawText)) as {
      subject?: unknown;
      body?: unknown;
    };

    const subject =
      typeof parsed.subject === "string" && parsed.subject.trim()
        ? parsed.subject.trim()
        : fallbackSubject;
    const body =
      typeof parsed.body === "string" && parsed.body.trim()
        ? parsed.body.trim()
        : "";

    if (!body) {
      throw new Error("Generated email body is empty.");
    }

    return {
      subject,
      body: normalizeBody(body)
    };
  } catch {
    const cleaned = stripCodeFences(rawText).replace(/\r\n/g, "\n").trim();
    return {
      subject: fallbackSubject,
      body: normalizeBody(cleaned)
    };
  }
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

  return new Error("Die Bewerbungs-E-Mail konnte derzeit nicht erstellt werden. Bitte versuchen Sie es erneut.");
}

function safeSerialize(value: unknown) {
  if (value == null) return null;
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function logGeminiApplicationEmailError(error: unknown) {
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

    console.error("[application-email][gemini] generation failed");
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

  console.error("[application-email][gemini] generation failed");
  console.error("message:", safeSerialize(error));
}

export async function generateDoctorApplicationEmail(args: {
  profile: DoctorProfile;
  manualContext: DoctorApplicationEmailManualContext;
}) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const { systemPrompt, userPrompt } = buildApplicationEmailPrompt(
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
          throw new Error("The Gemini response did not contain any email text.");
        }

        return renderPlainEmailResult(text, args.manualContext);
      } catch (error) {
        lastError = error;
        logGeminiApplicationEmailError(error);

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
