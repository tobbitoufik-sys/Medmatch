import { scanPraktischarztSourceOffers } from "@/lib/external-offers/import";

type MinimalSupabaseClient = {
  from: (table: string) => any;
};

type DiscoveredExternalOffer = {
  url: string;
  title: string | null;
  hospitalName: string | null;
  externalOfferId: string | null;
};

type RunPraktischarztSourceScanOptions = {
  supabase: MinimalSupabaseClient;
  listingUrl: string;
  runTrigger: "manual" | "scheduled";
  maxPages?: number;
  maxOffers?: number;
};

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  if (error && typeof error === "object") {
    const maybeError = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };

    const parts = [
      typeof maybeError.message === "string" ? maybeError.message.trim() : "",
      typeof maybeError.details === "string" ? maybeError.details.trim() : "",
      typeof maybeError.hint === "string" ? `Hinweis: ${maybeError.hint.trim()}` : "",
      typeof maybeError.code === "string" ? `Code: ${maybeError.code.trim()}` : ""
    ].filter(Boolean);

    if (parts.length) {
      return parts.join(" | ");
    }
  }

  return fallback;
}

export async function runPraktischarztSourceScan({
  supabase,
  listingUrl,
  runTrigger,
  maxPages = 3,
  maxOffers = 30
}: RunPraktischarztSourceScanOptions) {
  try {
    const scan = await scanPraktischarztSourceOffers({
      listingUrl,
      maxPages,
      maxOffers
    });

    if (!scan.offers.length) {
      throw new Error("Es konnten keine verwertbaren Praktischarzt-Detailangebote erkannt werden.");
    }

    const scannedUrls = scan.offers.map((offer) => offer.url);
    const { data: existingRows, error: existingError } = scannedUrls.length
      ? await supabase
          .from("external_source_offer_memory")
          .select("id, offer_url")
          .eq("source_name", scan.sourceName)
          .in("offer_url", scannedUrls)
      : { data: [], error: null };

    if (existingError) {
      throw existingError;
    }

    const existingByUrl = new Map(
      (((existingRows as Array<{ id: string; offer_url: string }> | null) ?? []).map((row) => [
        row.offer_url,
        row
      ]))
    );

    const nowIso = new Date().toISOString();
    const newOffers = scan.offers.filter((offer) => !existingByUrl.has(offer.url));
    const knownOffers = scan.offers.filter((offer) => existingByUrl.has(offer.url));

    if (newOffers.length) {
      const { error: insertError } = await supabase.from("external_source_offer_memory").insert(
        newOffers.map((offer) => ({
          source_name: scan.sourceName,
          offer_url: offer.url,
          external_offer_id: offer.externalOfferId,
          title: offer.title,
          hospital_name: offer.hospitalName,
          first_seen_at: nowIso,
          last_seen_at: nowIso
        }))
      );

      if (insertError) {
        throw insertError;
      }
    }

    for (const offer of knownOffers) {
      const existingRow = existingByUrl.get(offer.url);
      if (!existingRow) {
        continue;
      }

      const { error: updateError } = await supabase
        .from("external_source_offer_memory")
        .update({
          last_seen_at: nowIso,
          title: offer.title,
          hospital_name: offer.hospitalName,
          external_offer_id: offer.externalOfferId
        })
        .eq("id", existingRow.id);

      if (updateError) {
        throw updateError;
      }
    }

    const { error: scanRunError } = await supabase.from("external_source_scan_runs").insert({
      source_name: scan.sourceName,
      listing_url: scan.listingUrl,
      scanned_count: scan.offers.length,
      new_count: newOffers.length,
      known_count: knownOffers.length,
      new_offers: newOffers,
      run_trigger: runTrigger,
      run_status: "succeeded",
      error_message: null
    });

    if (scanRunError) {
      throw scanRunError;
    }

    return {
      ok: true as const,
      scan,
      newOffers,
      knownOffers
    };
  } catch (error) {
    const message = toErrorMessage(
      error,
      "Der Praktischarzt-Quellenscan konnte nicht abgeschlossen werden."
    );

    await supabase.from("external_source_scan_runs").insert({
      source_name: "praktischarzt.de",
      listing_url: listingUrl,
      scanned_count: 0,
      new_count: 0,
      known_count: 0,
      new_offers: [] satisfies DiscoveredExternalOffer[],
      run_trigger: runTrigger,
      run_status: "failed",
      error_message: message
    });

    return {
      ok: false as const,
      error,
      message
    };
  }
}
