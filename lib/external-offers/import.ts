const IMPORT_USER_AGENT =
  "Mozilla/5.0 (compatible; MedMatchExternalOfferImporter/1.0; +https://medmatch.local)";
const BROWSER_LIKE_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

type ExternalOfferImportResult = {
  sourceUrl: string;
  sourceName: string | null;
  rawHtml: string;
  rawText: string;
};

export type DiscoveredExternalOffer = {
  url: string;
  title: string | null;
  hospitalName: string | null;
  externalOfferId: string | null;
};

type PraktischarztDiscoveryResult = {
  sourceName: string;
  listingUrl: string;
  urls: string[];
  offers: DiscoveredExternalOffer[];
  nextPageUrl: string | null;
};

type SourceAdapterContext = {
  sourceUrl: string;
  hostname: string | null;
};

type SourceAdapter = {
  id: string;
  matches: (context: SourceAdapterContext) => boolean;
  extract: (rawHtml: string, context: SourceAdapterContext) => ExternalOfferImportResult;
};

type JobPostingRecord = {
  title?: string;
  description?: string;
  hiringOrganization?: string;
  jobLocation?: string;
  employmentType?: string | string[];
  identifier?: string;
};

function decodeHtmlEntities(value: string) {
  const namedEntities: Record<string, string> = {
    nbsp: " ",
    amp: "&",
    quot: '"',
    apos: "'",
    lt: "<",
    gt: ">",
    auml: "ä",
    ouml: "ö",
    uuml: "ü",
    Auml: "Ä",
    Ouml: "Ö",
    Uuml: "Ü",
    szlig: "ß",
    eacute: "é",
    egrave: "è",
    ecirc: "ê",
    agrave: "à",
    aacute: "á",
    oacute: "ó",
    rsquo: "'",
    lsquo: "'",
    ldquo: '"',
    rdquo: '"',
    ndash: "-",
    mdash: "-",
    hellip: "...",
    copy: "©",
    reg: "®",
    trade: "™"
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z][a-z0-9]+);/gi, (match, entity) => {
    if (!entity) {
      return match;
    }

    if (entity[0] === "#") {
      const isHex = entity[1]?.toLowerCase() === "x";
      const numericValue = isHex ? entity.slice(2) : entity.slice(1);
      const codePoint = Number.parseInt(numericValue, isHex ? 16 : 10);

      if (!Number.isFinite(codePoint) || codePoint <= 0) {
        return match;
      }

      try {
        return String.fromCodePoint(codePoint);
      } catch {
        return match;
      }
    }

    return namedEntities[entity] ?? match;
  });
}

function stripHtmlToText(html: string) {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<img[^>]*>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|section|article|li|ul|ol|h1|h2|h3|h4|h5|h6)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\r/g, "")
      .replace(/\t/g, " ")
      .replace(/[ ]{2,}/g, " ")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

function stripSections(html: string, patterns: RegExp[]) {
  return patterns.reduce((currentHtml, pattern) => currentHtml.replace(pattern, " "), html);
}

function extractSegmentBySelectors(html: string, selectors: string[]) {
  for (const selector of selectors) {
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const attributePattern = new RegExp(
      `<([a-z0-9:-]+)([^>]*?(?:class|id|data-testid|data-test|role)=["'][^"']*${escapedSelector}[^"']*["'][^>]*)>([\\s\\S]*?)<\\/\\1>`,
      "i"
    );
    const match = html.match(attributePattern);
    if (match?.[0]) {
      return match[0];
    }
  }

  return null;
}

function normalizeExtractedText(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line, index, lines) => {
      if (!line) {
        return false;
      }

      if (index > 0 && line === lines[index - 1]) {
        return false;
      }

      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeEmailCandidate(value: string) {
  const decoded = decodeHtmlEntities(value).trim();
  const withoutMailto = decoded.replace(/^mailto:/i, "");
  const withoutQuery = withoutMailto.split("?")[0]?.trim() ?? "";
  const cleaned = withoutQuery.replace(/[)>.,;:]+$/g, "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned) ? cleaned : null;
}

function extractExplicitEmails(rawHtml: string, baseText: string) {
  const discovered = new Set<string>();

  for (const match of rawHtml.matchAll(/href=["']mailto:([^"'>\s]+)["']/gi)) {
    const email = normalizeEmailCandidate(match[1] ?? "");
    if (email) {
      discovered.add(email);
    }
  }

  const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  for (const source of [baseText, decodeHtmlEntities(rawHtml)]) {
    for (const match of source.matchAll(emailPattern)) {
      const email = normalizeEmailCandidate(match[0] ?? "");
      if (email) {
        discovered.add(email);
      }
    }
  }

  return Array.from(discovered);
}

function mergeExplicitEmailsIntoRawText(rawHtml: string, baseText: string) {
  const explicitEmails = extractExplicitEmails(rawHtml, baseText);
  if (!explicitEmails.length) {
    return normalizeExtractedText(baseText);
  }

  return normalizeExtractedText(
    compactLines([
      baseText,
      ...explicitEmails.map((email) => `Kontakt-E-Mail: ${email}`)
    ])
  );
}

function stripHtmlFragmentToSingleLine(value: string) {
  const text = stripHtmlToText(value).replace(/\s+/g, " ").trim();
  return text.length ? text : null;
}

function compactLines(lines: Array<string | null | undefined>) {
  return lines
    .map((line) => decodeHtmlEntities(String(line ?? "")).replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function hasUsableReadableText(value: string) {
  const collapsed = value.replace(/\s+/g, " ").trim();
  return collapsed.length >= 120;
}

function normalizeJsonString(value: string) {
  return decodeHtmlEntities(value);
}

function extractJsonLdBlocks(html: string) {
  return Array.from(
    html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  )
    .map((match) => normalizeJsonString(match[1] ?? "").trim())
    .filter(Boolean);
}

function getObjectType(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const objectValue = value as { "@type"?: unknown; type?: unknown };
  const typeValue = objectValue["@type"] ?? objectValue.type;

  if (typeof typeValue === "string") {
    return typeValue;
  }

  if (Array.isArray(typeValue)) {
    const firstString = typeValue.find((item) => typeof item === "string");
    return typeof firstString === "string" ? firstString : null;
  }

  return null;
}

function collectJobPostingCandidates(value: unknown): JobPostingRecord[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectJobPostingCandidates(item));
  }

  if (typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;
  const objectType = getObjectType(record)?.toLowerCase();
  const results: JobPostingRecord[] = [];

  if (objectType === "jobposting") {
    const organization = record.hiringOrganization;
    const location = record.jobLocation;
    const identifier = record.identifier;

    results.push({
      title: typeof record.title === "string" ? record.title : undefined,
      description: typeof record.description === "string" ? record.description : undefined,
      hiringOrganization:
        typeof organization === "string"
          ? organization
          : organization && typeof organization === "object" && typeof (organization as { name?: unknown }).name === "string"
            ? ((organization as { name?: string }).name ?? undefined)
            : undefined,
      jobLocation:
        typeof location === "string"
          ? location
          : Array.isArray(location)
            ? location
                .map((item) =>
                  item && typeof item === "object"
                    ? (item as { address?: { streetAddress?: string; postalCode?: string; addressLocality?: string } })
                    : null
                )
                .map((item) =>
                  item?.address
                    ? [item.address.streetAddress, item.address.postalCode, item.address.addressLocality]
                        .filter(Boolean)
                        .join(" ")
                    : null
                )
                .filter(Boolean)
                .join(" | ")
            : location && typeof location === "object"
              ? (() => {
                  const address = (location as { address?: { streetAddress?: string; postalCode?: string; addressLocality?: string } }).address;
                  return address
                    ? [address.streetAddress, address.postalCode, address.addressLocality].filter(Boolean).join(" ")
                    : undefined;
                })()
              : undefined,
      employmentType:
        typeof record.employmentType === "string" || Array.isArray(record.employmentType)
          ? (record.employmentType as string | string[])
          : undefined,
      identifier:
        typeof identifier === "string"
          ? identifier
          : identifier && typeof identifier === "object" && typeof (identifier as { value?: unknown }).value === "string"
            ? ((identifier as { value?: string }).value ?? undefined)
            : undefined
    });
  }

  for (const nestedValue of Object.values(record)) {
    results.push(...collectJobPostingCandidates(nestedValue));
  }

  return results;
}

function extractJobPostingFromJsonLd(html: string) {
  for (const block of extractJsonLdBlocks(html)) {
    try {
      const parsed = JSON.parse(block) as unknown;
      const candidates = collectJobPostingCandidates(parsed);
      const bestCandidate = candidates.find(
        (candidate) =>
          [candidate.title, candidate.description, candidate.hiringOrganization, candidate.jobLocation]
            .filter(Boolean)
            .join(" ")
            .trim().length > 40
      );

      if (bestCandidate) {
        return bestCandidate;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function buildJobPostingText(candidate: JobPostingRecord) {
  const employmentType = Array.isArray(candidate.employmentType)
    ? candidate.employmentType.join(", ")
    : candidate.employmentType;

  return compactLines([
    candidate.title ? `Titel: ${candidate.title}` : null,
    candidate.hiringOrganization ? `Krankenhaus: ${candidate.hiringOrganization}` : null,
    candidate.jobLocation ? `Standort: ${candidate.jobLocation}` : null,
    employmentType ? `Vertragsart: ${employmentType}` : null,
    candidate.identifier ? `Externe ID: ${candidate.identifier}` : null,
    candidate.description ? `Beschreibung:\n${stripHtmlToText(candidate.description)}` : null
  ]);
}

function buildImportResult(
  context: SourceAdapterContext,
  rawHtml: string,
  cleanedHtml: string,
  sourceName?: string | null
): ExternalOfferImportResult {
  const baseText = normalizeExtractedText(stripHtmlToText(cleanedHtml));

  return {
    sourceUrl: context.sourceUrl,
    sourceName: sourceName ?? context.hostname,
    rawHtml,
    rawText: mergeExplicitEmailsIntoRawText(rawHtml, baseText)
  };
}

function getHostnameFromUrl(sourceUrl: string) {
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}

function normalizeSourceName(hostname: string | null) {
  if (!hostname) {
    return null;
  }

  if (hostname.endsWith("praktischarzt.de")) {
    return "praktischarzt.de";
  }

  if (hostname.endsWith("stepstone.de")) {
    return "StepStone";
  }

  return hostname;
}

function buildBrowserLikeNavigationHeaders(targetUrl: string) {
  const target = new URL(targetUrl);

  return {
    "user-agent": BROWSER_LIKE_USER_AGENT,
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
    "cache-control": "no-cache",
    pragma: "no-cache",
    referer: `${target.origin}/`,
    "upgrade-insecure-requests": "1"
  };
}

function findPraktischarztNextListingUrl(html: string, currentPageUrl: string, baseUrl: URL) {
  const currentNormalized = normalizeImportUrl(currentPageUrl);

  for (const match of html.matchAll(/<a\b([^>]*)href=["']([^"'#]+)["'][^>]*>/gi)) {
    const attributes = match[1] ?? "";
    const href = match[2]?.trim();
    if (!href) {
      continue;
    }

    const hasNextHint =
      /\brel=["'][^"']*\bnext\b[^"']*["']/i.test(attributes) ||
      /\bclass=["'][^"']*(next|page-numbers|pagination-next)[^"']*["']/i.test(attributes) ||
      /\baria-label=["'][^"']*(next|weiter|naechste)[^"']*["']/i.test(attributes);

    if (!hasNextHint) {
      continue;
    }

    let candidateUrl: URL;
    try {
      candidateUrl = new URL(href, baseUrl);
    } catch {
      continue;
    }

    const normalizedCandidate = normalizeImportUrl(candidateUrl.toString());
    if (!normalizedCandidate || normalizedCandidate === currentNormalized) {
      continue;
    }

    const hostname = getHostnameFromUrl(normalizedCandidate);
    if (!hostname || !hostname.endsWith("praktischarzt.de")) {
      continue;
    }

    return normalizedCandidate;
  }

  return null;
}

function isPraktischarztOfferDetailPath(pathname: string) {
  const normalizedPath = pathname.toLowerCase().replace(/\/+$/, "") || "/";
  const segments = normalizedPath.split("/").filter(Boolean);
  const lastSegment = segments.at(-1) ?? "";
  if (!segments.length) {
    return false;
  }

  if (segments[0] !== "job") {
    return false;
  }

  if (
    normalizedPath.includes("/page/") ||
    normalizedPath.includes("/unternehmen/") ||
    normalizedPath.includes("/aerztestellen/") ||
    normalizedPath.includes("/praxen/") ||
    normalizedPath.includes("/kliniken/") ||
    normalizedPath.includes("/kategorie/") ||
    normalizedPath.includes("/category/") ||
    normalizedPath.includes("/tag/") ||
    normalizedPath.includes("/author/") ||
    normalizedPath.includes("/feed/") ||
    normalizedPath.includes("/search/") ||
    normalizedPath.includes("/wp-content/") ||
    normalizedPath.includes("/wp-json/")
  ) {
    return false;
  }

  if (segments.length < 2 || !lastSegment || lastSegment === "job") {
    return false;
  }

  const hasConcreteSlugShape =
    lastSegment.length >= 12 &&
    /-/.test(lastSegment) &&
    (/\d/.test(lastSegment) ||
      /m-w-d|w-m-d|arzt|ärztin|aerztin|klinik|krankenhaus|medizin|stelle|job/.test(lastSegment));

  return hasConcreteSlugShape;
}

export function isPraktischarztOfferDetailUrl(url: string) {
  const normalizedUrl = normalizeImportUrl(url);
  if (!normalizedUrl) {
    return false;
  }

  try {
    const parsed = new URL(normalizedUrl);
    const hostname = getHostnameFromUrl(normalizedUrl);
    if (!hostname || !hostname.endsWith("praktischarzt.de")) {
      return false;
    }

    return isPraktischarztOfferDetailPath(parsed.pathname);
  } catch {
    return false;
  }
}

const genericAdapter: SourceAdapter = {
  id: "generic",
  matches: () => true,
  extract: (rawHtml, context) => {
    const cleanedHtml = stripSections(rawHtml, [
      /<header[\s\S]*?<\/header>/gi,
      /<footer[\s\S]*?<\/footer>/gi,
      /<nav[\s\S]*?<\/nav>/gi,
      /<aside[\s\S]*?<\/aside>/gi,
      /<form[\s\S]*?<\/form>/gi,
      /<dialog[\s\S]*?<\/dialog>/gi
    ]);

    return buildImportResult(context, rawHtml, cleanedHtml, normalizeSourceName(context.hostname));
  }
};

const praktischarztAdapter: SourceAdapter = {
  id: "praktischarzt",
  matches: ({ hostname }) => hostname === "praktischarzt.de" || hostname?.endsWith(".praktischarzt.de") === true,
  extract: (rawHtml, context) => {
    const jobPosting = extractJobPostingFromJsonLd(rawHtml);
    if (jobPosting) {
      const jobPostingText = buildJobPostingText(jobPosting);
      if (hasUsableReadableText(jobPostingText)) {
        return {
          sourceUrl: context.sourceUrl,
          sourceName: "praktischarzt.de",
          rawHtml,
          rawText: mergeExplicitEmailsIntoRawText(rawHtml, jobPostingText)
        };
      }
    }

    const focusedSegment =
      extractSegmentBySelectors(rawHtml, [
        "job-posting",
        "job",
        "job-description",
        "jobdetail",
        "stellenangebot",
        "stellenanzeige",
        "single-job",
        "job-content",
        "entry-content",
        "content-main",
        "main-content"
      ]) ?? rawHtml;

    const cleanedHtml = stripSections(focusedSegment, [
      /<header[\s\S]*?<\/header>/gi,
      /<footer[\s\S]*?<\/footer>/gi,
      /<nav[\s\S]*?<\/nav>/gi,
      /<aside[\s\S]*?<\/aside>/gi,
      /<form[\s\S]*?<\/form>/gi,
      /<script[\s\S]*?<\/script>/gi,
      /<div[^>]*class=["'][^"']*(newsletter|share|social|related|related-jobs|sidebar|breadcrumbs)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi,
      /<section[^>]*class=["'][^"']*(newsletter|share|social|related|related-jobs|sidebar|breadcrumbs)[^"']*["'][^>]*>[\s\S]*?<\/section>/gi,
      /<div[^>]*class=["'][^"']*(cookie|consent|banner|modal|overlay|popup)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi
    ]);

    return buildImportResult(context, rawHtml, cleanedHtml, "praktischarzt.de");
  }
};

const stepStoneAdapter: SourceAdapter = {
  id: "stepstone",
  matches: ({ hostname }) => hostname === "stepstone.de" || hostname?.endsWith(".stepstone.de") === true,
  extract: (rawHtml, context) => {
    const focusedSegment =
      extractSegmentBySelectors(rawHtml, [
        "jobad",
        "job-ad",
        "listing-content",
        "job-details",
        "main-content"
      ]) ?? rawHtml;

    const cleanedHtml = stripSections(focusedSegment, [
      /<header[\s\S]*?<\/header>/gi,
      /<footer[\s\S]*?<\/footer>/gi,
      /<nav[\s\S]*?<\/nav>/gi,
      /<aside[\s\S]*?<\/aside>/gi,
      /<form[\s\S]*?<\/form>/gi,
      /<section[^>]*data-testid=["'][^"']*(similar|recommended|benefits-overview|company-overview)[^"']*["'][^>]*>[\s\S]*?<\/section>/gi,
      /<div[^>]*data-testid=["'][^"']*(similar|recommended|company-card)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi
    ]);

    return buildImportResult(context, rawHtml, cleanedHtml, "StepStone");
  }
};

const SOURCE_ADAPTERS: SourceAdapter[] = [praktischarztAdapter, stepStoneAdapter, genericAdapter];

function selectSourceAdapter(context: SourceAdapterContext) {
  return SOURCE_ADAPTERS.find((adapter) => adapter.matches(context)) ?? genericAdapter;
}

export function normalizeImportUrl(value: string) {
  const normalized = value.trim();
  if (!normalized) return "";

  try {
    const url = new URL(normalized);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

export async function importExternalOfferByUrl(sourceUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    let response: Response;

    try {
      response = await fetch(sourceUrl, {
        method: "GET",
        headers: {
          "user-agent": IMPORT_USER_AGENT,
          accept: "text/html,application/xhtml+xml"
        },
        signal: controller.signal,
        cache: "no-store",
        redirect: "follow"
      });
    } catch (error) {
      if (controller.signal.aborted) {
        throw new Error("Der Import wurde wegen Zeitüberschreitung abgebrochen.");
      }

      const message = error instanceof Error ? error.message : "Unbekannter Netzwerkfehler.";
      throw new Error(`Die externe URL konnte nicht geladen werden: ${message}`);
    }

    if (!response.ok) {
      throw new Error(`Import request failed with status ${response.status}.`);
    }

    const rawHtml = await response.text();
    const finalUrl = normalizeImportUrl(response.url) || sourceUrl;
    const context: SourceAdapterContext = {
      sourceUrl: finalUrl,
      hostname: getHostnameFromUrl(finalUrl)
    };
    const adapter = selectSourceAdapter(context);
    const imported = adapter.extract(rawHtml, context);

    if (!hasUsableReadableText(imported.rawText)) {
      throw new Error(
        "Die Zielseite konnte geladen werden, aber es wurde kein ausreichend lesbarer Stelleninhalt gefunden."
      );
    }

    return imported;
  } finally {
    clearTimeout(timeout);
  }
}

export async function discoverPraktischarztOfferUrls(
  listingUrl: string,
  maxOffers = 5
): Promise<PraktischarztDiscoveryResult> {
  const normalizedListingUrl = normalizeImportUrl(listingUrl);

  if (!normalizedListingUrl) {
    throw new Error("Bitte geben Sie eine gültige Praktischarzt-Listing-URL ein.");
  }

  const listingHostname = getHostnameFromUrl(normalizedListingUrl);
  if (!listingHostname || !listingHostname.endsWith("praktischarzt.de")) {
    throw new Error("Die Batch-Erkennung ist in diesem Schritt nur für Praktischarzt aktiviert.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    let response: Response;

    try {
      response = await fetch(normalizedListingUrl, {
        method: "GET",
        headers: buildBrowserLikeNavigationHeaders(normalizedListingUrl),
        signal: controller.signal,
        cache: "no-store",
        redirect: "follow"
      });
    } catch (error) {
      if (controller.signal.aborted) {
        throw new Error("Die Praktischarzt-Liste konnte wegen Zeitüberschreitung nicht geladen werden.");
      }

      const message = error instanceof Error ? error.message : "Unbekannter Netzwerkfehler.";
      throw new Error(`Die Praktischarzt-Liste konnte nicht geladen werden: ${message}`);
    }

    if (!response.ok) {
      throw new Error(
        `Die Praktischarzt-Liste konnte nicht geladen werden (Status ${response.status}, finale URL ${response.url}).`
      );
    }

    const html = await response.text();
    const baseUrl = new URL(response.url);
    const urls: string[] = [];
    const offers: DiscoveredExternalOffer[] = [];
    const seen = new Set<string>();

    for (const match of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
      const href = match[1]?.trim();
      if (!href) {
        continue;
      }

      let candidateUrl: URL;
      try {
        candidateUrl = new URL(href, baseUrl);
      } catch {
        continue;
      }

      const normalizedCandidate = normalizeImportUrl(candidateUrl.toString());
      if (!normalizedCandidate) {
        continue;
      }

      const candidateHostname = getHostnameFromUrl(normalizedCandidate);
      if (!candidateHostname || !candidateHostname.endsWith("praktischarzt.de")) {
        continue;
      }

      const pathname = candidateUrl.pathname.toLowerCase();
      if (!isPraktischarztOfferDetailPath(pathname)) {
        continue;
      }

      if (seen.has(normalizedCandidate)) {
        continue;
      }

      seen.add(normalizedCandidate);
      urls.push(normalizedCandidate);
      offers.push({
        url: normalizedCandidate,
        title: stripHtmlFragmentToSingleLine(match[2] ?? ""),
        hospitalName: null,
        externalOfferId: null
      });

      if (urls.length >= maxOffers) {
        break;
      }
    }

    return {
      sourceName: "praktischarzt.de",
      listingUrl: normalizedListingUrl,
      urls,
      offers,
      nextPageUrl: findPraktischarztNextListingUrl(html, response.url, baseUrl)
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function scanPraktischarztSourceOffers(options: {
  listingUrl: string;
  maxPages?: number;
  maxOffers?: number;
}) {
  const normalizedListingUrl = normalizeImportUrl(options.listingUrl);
  if (!normalizedListingUrl) {
    throw new Error("Bitte geben Sie eine gültige Praktischarzt-Listing-URL ein.");
  }

  const safePageLimit = Math.max(1, Math.min(options.maxPages ?? 3, 3));
  const safeOfferLimit = Math.max(1, Math.min(options.maxOffers ?? 30, 30));
  const offers: DiscoveredExternalOffer[] = [];
  const seen = new Set<string>();
  let nextPageUrl: string | null = normalizedListingUrl;

  for (let pageIndex = 1; pageIndex <= safePageLimit && nextPageUrl; pageIndex += 1) {
    let discovery: PraktischarztDiscoveryResult;
    try {
      discovery = await discoverPraktischarztOfferUrls(nextPageUrl, safeOfferLimit);
    } catch (error) {
      if (pageIndex === 1) {
        throw error;
      }

      break;
    }

    for (const offer of discovery.offers) {
      if (seen.has(offer.url)) {
        continue;
      }

      seen.add(offer.url);
      offers.push(offer);

      if (offers.length >= safeOfferLimit) {
        break;
      }
    }

    if (offers.length >= safeOfferLimit) {
      break;
    }

    if (!discovery.offers.length) {
      break;
    }

    nextPageUrl = discovery.nextPageUrl;
  }

  return {
    sourceName: "praktischarzt.de",
    listingUrl: normalizedListingUrl,
    maxPages: safePageLimit,
    offers
  };
}
