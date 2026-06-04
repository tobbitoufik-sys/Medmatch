type ExternalOfferContactEnrichmentInput = {
  sourceUrl: string;
  hospitalName?: string | null;
  currentEmail?: string | null;
  currentAddress?: string | null;
  currentPhone?: string | null;
};

export type ExternalOfferContactEnrichmentResult = {
  contact_email: string | null;
  clinic_address: string | null;
  contact_phone: string | null;
  enriched_contact_email_source_url: string | null;
  enriched_clinic_address_source_url: string | null;
  enriched_contact_phone_source_url: string | null;
};

const KNOWN_AGGREGATOR_HOSTS = new Set(["praktischarzt.de", "www.praktischarzt.de", "stepstone.de", "www.stepstone.de"]);
const EXCLUDED_HOST_SNIPPETS = ["facebook.", "instagram.", "linkedin.", "xing.", "youtube.", "tiktok.", "google.", "maps."];
const CONTACT_PATHS = ["/kontakt", "/contact", "/impressum", "/karriere", "/jobs", "/bewerbung"];

function compact(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&Auml;/g, "Ä")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&Uuml;/g, "Ü")
    .replace(/&auml;/g, "ä")
    .replace(/&ouml;/g, "ö")
    .replace(/&uuml;/g, "ü")
    .replace(/&szlig;/g, "ß")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function stripHtml(html: string) {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function normalizeUrl(url: string, baseUrl?: string) {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return null;
  }
}

function extractCandidateLinks(html: string, sourceUrl: string) {
  const matches = [...html.matchAll(/href\s*=\s*["']([^"'#]+)["']/gi)];
  const currentHost = new URL(sourceUrl).hostname.toLowerCase();

  return unique(
    matches
      .map((match) => normalizeUrl(match[1], sourceUrl))
      .filter((value): value is string => Boolean(value))
      .filter((value) => value.startsWith("http://") || value.startsWith("https://"))
      .filter((value) => {
        const hostname = new URL(value).hostname.toLowerCase();
        if (hostname === currentHost) return !KNOWN_AGGREGATOR_HOSTS.has(hostname);
        return !EXCLUDED_HOST_SNIPPETS.some((snippet) => hostname.includes(snippet));
      })
  );
}

function scoreCandidateUrl(candidateUrl: string, hospitalName: string | null) {
  let score = 0;
  const url = new URL(candidateUrl);
  const normalized = `${url.hostname}${url.pathname}`.toLowerCase();

  if (!KNOWN_AGGREGATOR_HOSTS.has(url.hostname.toLowerCase())) {
    score += 5;
  }

  if (url.pathname === "/" || CONTACT_PATHS.some((path) => url.pathname.startsWith(path))) {
    score += 2;
  }

  if (hospitalName) {
    const tokens = hospitalName
      .toLowerCase()
      .split(/[^a-z0-9äöüß]+/i)
      .filter((token) => token.length >= 4)
      .slice(0, 4);
    score += tokens.filter((token) => normalized.includes(token)).length * 2;
  }

  return score;
}

function buildCandidatePageUrls(seedUrl: string) {
  const url = new URL(seedUrl);
  const origin = url.origin;

  return unique([
    seedUrl,
    origin,
    ...CONTACT_PATHS.map((path) => `${origin}${path}`)
  ]);
}

function extractFirstEmail(text: string) {
  const matches = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
  return compact(matches?.[0] ?? null);
}

function extractFirstPhone(text: string) {
  const matches = text.match(/(?:\+49|0)[0-9\s()\/-]{6,}/g);
  return compact(matches?.[0]?.replace(/\s+/g, " ") ?? null);
}

function extractFirstAddress(text: string) {
  const patterns = [
    /([A-ZÄÖÜ][A-Za-zÄÖÜäöüß.\- ]{2,}(?:straße|strasse|str\.|weg|platz|allee|ring|gasse|ufer|chaussee)\s+\d+[a-zA-Z]?,?\s*\d{5}\s+[A-ZÄÖÜ][A-Za-zÄÖÜäöüß.\- ]+)/i,
    /(\d{5}\s+[A-ZÄÖÜ][A-Za-zÄÖÜäöüß.\- ]+,\s*[A-ZÄÖÜ][A-Za-zÄÖÜäöüß.\- ]{2,}(?:straße|strasse|str\.|weg|platz|allee|ring|gasse|ufer|chaussee)\s+\d+[a-zA-Z]?)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return compact(match[1].replace(/\s+/g, " "));
    }
  }

  return null;
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent": "Mozilla/5.0 MedMatchBot/1.0"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Enrichment page load failed: ${response.status}`);
  }

  return {
    finalUrl: response.url,
    html: await response.text()
  };
}

export async function enrichExternalOfferContactData(
  input: ExternalOfferContactEnrichmentInput
): Promise<ExternalOfferContactEnrichmentResult> {
  const currentEmail = compact(input.currentEmail);
  const currentAddress = compact(input.currentAddress);
  const currentPhone = compact(input.currentPhone);
  const hospitalName = compact(input.hospitalName);

  let contactEmail = currentEmail;
  let clinicAddress = currentAddress;
  let contactPhone = currentPhone;
  let emailSourceUrl: string | null = null;
  let addressSourceUrl: string | null = null;
  let phoneSourceUrl: string | null = null;

  const sourcePage = await fetchHtml(input.sourceUrl);
  const candidateLinks = extractCandidateLinks(sourcePage.html, sourcePage.finalUrl)
    .sort((a, b) => scoreCandidateUrl(b, hospitalName) - scoreCandidateUrl(a, hospitalName))
    .slice(0, 3);

  const seedUrls = candidateLinks.length
    ? candidateLinks
    : [sourcePage.finalUrl].filter((value) => !KNOWN_AGGREGATOR_HOSTS.has(new URL(value).hostname.toLowerCase()));

  const candidatePages = unique(seedUrls.flatMap(buildCandidatePageUrls)).slice(0, 8);

  for (const candidatePage of candidatePages) {
    if (contactEmail && clinicAddress && contactPhone) {
      break;
    }

    try {
      const page = await fetchHtml(candidatePage);
      const text = stripHtml(page.html);

      if (!contactEmail) {
        const foundEmail = extractFirstEmail(text);
        if (foundEmail) {
          contactEmail = foundEmail;
          emailSourceUrl = page.finalUrl;
        }
      }

      if (!clinicAddress) {
        const foundAddress = extractFirstAddress(text);
        if (foundAddress) {
          clinicAddress = foundAddress;
          addressSourceUrl = page.finalUrl;
        }
      }

      if (!contactPhone) {
        const foundPhone = extractFirstPhone(text);
        if (foundPhone) {
          contactPhone = foundPhone;
          phoneSourceUrl = page.finalUrl;
        }
      }
    } catch {
      continue;
    }
  }

  return {
    contact_email: contactEmail,
    clinic_address: clinicAddress,
    contact_phone: contactPhone,
    enriched_contact_email_source_url: emailSourceUrl,
    enriched_clinic_address_source_url: addressSourceUrl,
    enriched_contact_phone_source_url: phoneSourceUrl
  };
}
