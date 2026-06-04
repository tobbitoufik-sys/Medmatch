import { GoogleGenAI } from "@google/genai";

type RawExternalOfferInput = {
  sourceUrl: string;
  sourceName?: string | null;
  rawText: string;
};

export type ExternalOfferRefinementDraft = {
  title: string | null;
  hospital_name: string | null;
  location: string | null;
  clinic_address: string | null;
  contact_person: string | null;
  salutation: "herr" | "frau" | "unbekannt";
  contact_email: string | null;
  contact_phone: string | null;
  specialty: string | null;
  contract_type: "honorar" | "befristet" | "unbefristet" | null;
  summary: string | null;
  source_name: string | null;
  source_url: string;
  external_offer_id: string | null;
};

const GEMINI_MODEL_ORDER = ["gemini-2.5-flash", "gemini-2.5-flash-lite"] as const;
const GEMINI_RETRY_DELAYS_MS = [500, 1200] as const;
const TEMPORARY_UNAVAILABLE_ERROR_CODE = "TEMPORARY_UNAVAILABLE";
const GEMINI_OVERLOAD_MESSAGE =
  "Die KI-Aufbereitung ist voruebergehend nicht verfuegbar. Bitte spaeter erneut versuchen.";

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

export function isTemporaryExternalOfferRefinementError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: string; cause?: { code?: string } };
  return (
    candidate.code === TEMPORARY_UNAVAILABLE_ERROR_CODE ||
    candidate.cause?.code === TEMPORARY_UNAVAILABLE_ERROR_CODE
  );
}

function toSafeRefinementError(error: unknown) {
  if (isGeminiUnavailableError(error)) {
    const temporaryError = new Error(GEMINI_OVERLOAD_MESSAGE) as Error & { code?: string };
    temporaryError.code = TEMPORARY_UNAVAILABLE_ERROR_CODE;
    return temporaryError;
  }

  return new Error("Die KI-Aufbereitung konnte derzeit nicht abgeschlossen werden.");
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

function logExternalOfferRefinementError(error: unknown) {
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

    console.error("[external-offer-refinement][gemini] failed");
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

  console.error("[external-offer-refinement][gemini] failed");
  console.error("message:", safeSerialize(error));
}

function stripCodeFences(value: string) {
  return value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function compact(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeEmailCandidate(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  const cleaned = trimmed.replace(/[)>.,;:]+$/g, "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned) ? cleaned : null;
}

function extractExplicitSourceEmail(rawText: string) {
  const matches = rawText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  for (const match of matches) {
    const email = normalizeEmailCandidate(match);
    if (email) {
      return email;
    }
  }

  return null;
}

function normalizeSalutation(value: string | null | undefined) {
  const normalized = compact(value)?.toLowerCase();
  return normalized === "herr" || normalized === "frau" ? normalized : "unbekannt";
}

function normalizeContractType(value: string | null | undefined) {
  const normalized = compact(value)?.toLowerCase();
  return normalized === "honorar" || normalized === "befristet" || normalized === "unbefristet"
    ? normalized
    : null;
}

function truncateSummary(value: string | null) {
  if (!value) return null;
  if (value.length <= 800) return value;
  return `${value.slice(0, 797).trimEnd()}...`;
}

function buildPrompt(input: RawExternalOfferInput) {
  const systemPrompt = [
    "Du extrahierst strukturierte Fakten aus einem importierten deutschsprachigen oder internationalen Stellenangebot fuer MedMatch.",
    "Ziel ist ein reviewbarer Zwischenstand fuer externe Stellenangebote, nicht die finale Veroeffentlichung.",
    "Nutze ausschliesslich Informationen, die explizit im Rohtext vorhanden sind.",
    "Erfinde niemals fehlende Werte.",
    "Wenn ein Feld nicht klar im Rohtext vorkommt, gib null zurueck.",
    "Erfinde keine Ansprechpartner, keine Adressen, keine E-Mails, keine Telefonnummern, keine Fachrichtungen, keine Vertragsarten und keine IDs.",
    "Leite salutation nur dann ab, wenn im Rohtext fuer den Ansprechpartner explizit Frau oder Herr erkennbar ist.",
    "contract_type darf nur honorrar, befristet oder unbefristet sein, wenn das klar im Text steht; sonst null.",
    "summary darf eine kurze, neutrale Zusammenfassung auf Basis des Rohtexts sein, ohne neue Fakten hinzuzufuegen.",
    "Gib ausschliesslich JSON mit genau diesen Schluesseln zurueck:",
    "title, hospital_name, location, clinic_address, contact_person, salutation, contact_email, contact_phone, specialty, contract_type, summary, source_name, source_url, external_offer_id"
  ].join(" ");

  const userPrompt = [
    "Extrahiere die folgenden Felder aus dem importierten Rohtext.",
    "Fehlende Werte muessen null bleiben.",
    "source_url muss aus der Eingabe uebernommen werden.",
    "source_name darf aus der Eingabe uebernommen werden, wenn vorhanden, sonst null.",
    "",
    JSON.stringify(
      {
        source_url: input.sourceUrl,
        source_name: input.sourceName ?? null,
        raw_text: input.rawText
      },
      null,
      2
    )
  ].join("\n");

  return { systemPrompt, userPrompt };
}

function parseRefinementDraft(rawText: string, sourceUrl: string, sourceName?: string | null) {
  const parsed = JSON.parse(stripCodeFences(rawText)) as Record<string, unknown>;
  const explicitSourceEmail = extractExplicitSourceEmail(rawText);

  return {
    title: compact(typeof parsed.title === "string" ? parsed.title : null),
    hospital_name: compact(typeof parsed.hospital_name === "string" ? parsed.hospital_name : null),
    location: compact(typeof parsed.location === "string" ? parsed.location : null),
    clinic_address: compact(typeof parsed.clinic_address === "string" ? parsed.clinic_address : null),
    contact_person: compact(typeof parsed.contact_person === "string" ? parsed.contact_person : null),
    salutation: normalizeSalutation(typeof parsed.salutation === "string" ? parsed.salutation : null),
    contact_email:
      compact(typeof parsed.contact_email === "string" ? parsed.contact_email : null) ??
      explicitSourceEmail,
    contact_phone: compact(typeof parsed.contact_phone === "string" ? parsed.contact_phone : null),
    specialty: compact(typeof parsed.specialty === "string" ? parsed.specialty : null),
    contract_type: normalizeContractType(
      typeof parsed.contract_type === "string" ? parsed.contract_type : null
    ),
    summary: truncateSummary(compact(typeof parsed.summary === "string" ? parsed.summary : null)),
    source_name: compact(typeof parsed.source_name === "string" ? parsed.source_name : sourceName),
    source_url: sourceUrl,
    external_offer_id: compact(
      typeof parsed.external_offer_id === "string" ? parsed.external_offer_id : null
    )
  } satisfies ExternalOfferRefinementDraft;
}

export async function refineExternalOfferRawItem(input: RawExternalOfferInput) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const { systemPrompt, userPrompt } = buildPrompt(input);
  let lastError: unknown = null;

  for (const model of GEMINI_MODEL_ORDER) {
    for (let attempt = 0; attempt <= GEMINI_RETRY_DELAYS_MS.length; attempt += 1) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.1
          }
        });

        const text = response.text?.trim() ?? "";
        if (!text) {
          throw new Error("The Gemini response did not contain any refinement JSON.");
        }

        return parseRefinementDraft(text, input.sourceUrl, input.sourceName);
      } catch (error) {
        lastError = error;
        logExternalOfferRefinementError(error);

        if (!isGeminiUnavailableError(error)) {
          throw toSafeRefinementError(error);
        }

        if (attempt < GEMINI_RETRY_DELAYS_MS.length) {
          await sleep(GEMINI_RETRY_DELAYS_MS[attempt]);
          continue;
        }
      }
    }
  }

  logExternalOfferRefinementError(lastError);
  throw toSafeRefinementError(lastError);
}
