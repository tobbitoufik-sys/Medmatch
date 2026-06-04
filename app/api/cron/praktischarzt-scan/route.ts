import { NextResponse } from "next/server";

import { runPraktischarztSourceScan } from "@/lib/external-offers/source-scan";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authorization !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const listingUrl =
    process.env.PRAKTISCHARZT_LISTING_URL ?? "https://www.praktischarzt.de/aerztestellen/";

  try {
    const supabase = createAdminSupabaseClient();
    const result = await runPraktischarztSourceScan({
      supabase,
      listingUrl,
      runTrigger: "scheduled",
      maxPages: 3,
      maxOffers: 30
    });

    if (!result.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[cron-praktischarzt-scan] scheduled scan failed", {
          listingUrl,
          message: result.message,
          rawError: result.error
        });
      }

      return NextResponse.json(
        { ok: false, listingUrl, error: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      listingUrl,
      scannedCount: result.scan.offers.length,
      newCount: result.newOffers.length,
      knownCount: result.knownOffers.length
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Der geplante Praktischarzt-Scan konnte nicht gestartet werden.";

    if (process.env.NODE_ENV !== "production") {
      console.error("[cron-praktischarzt-scan] route failed", {
        listingUrl,
        message,
        stack: error instanceof Error ? error.stack : undefined
      });
    }

    return NextResponse.json({ ok: false, listingUrl, error: message }, { status: 500 });
  }
}
