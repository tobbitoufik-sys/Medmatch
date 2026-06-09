import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { refineExternalOfferRawItem } from "@/lib/ai/external-offer-refinement";
import { getCurrentUser } from "@/lib/data/repository";
import { deleteImportRunById } from "@/lib/external-offers/admin-delete";
import {
  discoverPraktischarztOfferUrls,
  importExternalOfferByUrl,
  isPraktischarztOfferDetailUrl,
  normalizeImportUrl,
  type DiscoveredExternalOffer
} from "@/lib/external-offers/import";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isTemporaryExternalOfferRefinementError } from "@/lib/ai/external-offer-refinement";
import { runPraktischarztSourceScan } from "@/lib/external-offers/source-scan";

type ImportRunRecord = {
  id: string;
  source_url: string;
  source_name: string | null;
  import_status: "pending" | "succeeded" | "failed";
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

type ImportItemRecord = {
  id: string;
  import_run_id: string;
  source_url: string;
  source_name: string | null;
  raw_html: string | null;
  raw_text: string | null;
  created_at: string;
  updated_at: string;
};

type RefinementQueueRecord = {
  id: string;
  import_item_id: string;
  refinement_status: "pending" | "succeeded" | "failed";
};

type SourceScanRunRecord = {
  id: string;
  source_name: string;
  listing_url: string;
  scanned_count: number;
  new_count: number;
  known_count: number;
  new_offers: DiscoveredExternalOffer[] | null;
  created_at: string;
  run_trigger: "manual" | "scheduled";
  run_status: "succeeded" | "failed";
  error_message: string | null;
};

type SourceOfferMemoryRecord = {
  offer_url: string;
  title: string | null;
  hospital_name: string | null;
  pipeline_imported_at: string | null;
  pipeline_import_run_id: string | null;
};

function getActionableErrorMessage(error: unknown, fallback: string) {
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

  const fallbackString = String(error ?? "").trim();
  return fallbackString && fallbackString !== "[object Object]" ? fallbackString : fallback;
}

async function requireAdminUser() {
  "use server";

  const user = await getCurrentUser("admin");
  if (!user || user.role !== "admin") {
    throw new Error("Only admins can import external offers.");
  }

  return user;
}

async function createImportRunWithRawItem(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  normalizedUrl: string
) {
  const { data: run, error: createRunError } = await supabase
    .from("external_offer_import_runs")
    .insert({
      source_url: normalizedUrl,
      source_name: null,
      import_status: "pending"
    })
    .select("id")
    .single();

  if (createRunError || !run?.id) {
    throw createRunError ?? new Error("Der Importlauf konnte nicht angelegt werden.");
  }

  try {
    const imported = await importExternalOfferByUrl(normalizedUrl);

    const { data: item, error: createItemError } = await supabase
      .from("external_offer_import_items")
      .insert({
        import_run_id: run.id,
        source_url: imported.sourceUrl,
        source_name: imported.sourceName,
        raw_html: imported.rawHtml,
        raw_text: imported.rawText
      })
      .select("*")
      .single();

    if (createItemError || !item) {
      throw createItemError ?? new Error("Der Rohimport konnte nicht gespeichert werden.");
    }

    const { error: updateRunError } = await supabase
      .from("external_offer_import_runs")
      .update({
        source_name: imported.sourceName,
        import_status: "succeeded",
        error_message: null
      })
      .eq("id", run.id);

    if (updateRunError) {
      throw updateRunError;
    }

    return {
      runId: run.id,
      item: item as ImportItemRecord
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Importfehler.";

    await supabase
      .from("external_offer_import_runs")
      .update({
        import_status: "failed",
        error_message: message
      })
      .eq("id", run.id);

    throw error;
  }
}

async function createOrUpdateRefinementQueueFromRawItem(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  importRunId: string,
  rawItem: ImportItemRecord
) {
  if (!(rawItem.raw_text ?? "").trim()) {
    throw new Error("Für diese URL wurde kein ausreichend lesbarer Rohtext gespeichert.");
  }

  const { data: queueEntry, error: queueCreateError } = await supabase
    .from("external_offer_refinement_queue")
    .upsert(
      {
        import_run_id: importRunId,
        import_item_id: rawItem.id,
        source_url: rawItem.source_url,
        source_name: rawItem.source_name,
        raw_text_snapshot: rawItem.raw_text,
        refinement_status: "pending",
        error_message: null
      },
      { onConflict: "import_item_id" }
    )
    .select("id")
    .single();

  if (queueCreateError || !queueEntry?.id) {
    throw queueCreateError ?? new Error("Der Queue-Eintrag konnte nicht angelegt werden.");
  }

  try {
    const draft = await refineExternalOfferRawItem({
      sourceUrl: rawItem.source_url,
      sourceName: rawItem.source_name,
      rawText: rawItem.raw_text ?? ""
    });

    const { error: updateQueueError } = await supabase
      .from("external_offer_refinement_queue")
      .update({
        source_name: draft.source_name,
        refinement_status: "succeeded",
        error_message: null,
        title: draft.title,
        hospital_name: draft.hospital_name,
        location: draft.location,
        clinic_address: draft.clinic_address,
        contact_person: draft.contact_person,
        salutation: draft.salutation,
        contact_email: draft.contact_email,
        contact_phone: draft.contact_phone,
        specialty: draft.specialty,
        contract_type: draft.contract_type,
        summary: draft.summary,
        external_offer_id: draft.external_offer_id
      })
      .eq("id", queueEntry.id);

    if (updateQueueError) {
      throw updateQueueError;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Die KI-Aufbereitung konnte nicht abgeschlossen werden.";

    await supabase
      .from("external_offer_refinement_queue")
      .update({
        refinement_status: "failed",
        error_message: message
      })
      .eq("id", queueEntry.id);

    throw error;
  }
}

async function createExternalOfferImportRunAction(formData: FormData): Promise<void> {
  "use server";

  await requireAdminUser();

  const normalizedUrl = normalizeImportUrl(String(formData.get("source_url") ?? ""));
  if (!normalizedUrl) {
    redirect("/admin/import-runs?createStatus=validation");
  }

  const supabase = await createServerSupabaseClient();
  try {
    await createImportRunWithRawItem(supabase, normalizedUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Importfehler.";

    if (process.env.NODE_ENV !== "production") {
      console.error("[admin-import-runs] single import failed", {
        message,
        stack: error instanceof Error ? error.stack : undefined
      });
    }

    revalidatePath("/admin/import-runs");
    redirect("/admin/import-runs?createStatus=error");
  }

  revalidatePath("/admin/import-runs");
  redirect("/admin/import-runs?createStatus=success");
}

async function createRefinementQueueEntryAction(formData: FormData): Promise<void> {
  "use server";

  await requireAdminUser();

  const importRunId = String(formData.get("import_run_id") ?? "").trim();
  const importItemId = String(formData.get("import_item_id") ?? "").trim();

  if (!importRunId || !importItemId) {
    redirect("/admin/import-runs?refineStatus=error");
  }

  const supabase = await createServerSupabaseClient();
  const { data: item, error: itemError } = await supabase
    .from("external_offer_import_items")
    .select("*")
    .eq("id", importItemId)
    .eq("import_run_id", importRunId)
    .maybeSingle();

  if (itemError || !item) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[admin-import-runs] load raw import item failed", {
        message: itemError?.message,
        details: itemError?.details,
        hint: itemError?.hint,
        code: itemError?.code
      });
    }

    redirect("/admin/import-runs?refineStatus=error");
  }

  const rawItem = item as ImportItemRecord;

  try {
    await createOrUpdateRefinementQueueFromRawItem(supabase, importRunId, rawItem);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Die KI-Aufbereitung konnte nicht abgeschlossen werden.";
    const retryable = isTemporaryExternalOfferRefinementError(error);

    if (process.env.NODE_ENV !== "production") {
      console.error("[admin-import-runs] refinement failed", {
        message,
        retryable,
        stack: error instanceof Error ? error.stack : undefined
      });
    }

    revalidatePath("/admin/import-runs");
    revalidatePath("/admin/ai-queue");
    redirect(
      retryable
        ? "/admin/import-runs?refineStatus=temporaryUnavailable"
        : "/admin/import-runs?refineStatus=error"
    );
  }

  revalidatePath("/admin/import-runs");
  revalidatePath("/admin/ai-queue");
  redirect("/admin/import-runs?refineStatus=success");
}

async function createPraktischarztBatchImportAction(formData: FormData): Promise<void> {
  "use server";

  await requireAdminUser();

  const listingUrl = normalizeImportUrl(String(formData.get("listing_url") ?? ""));
  if (!listingUrl) {
    redirect("/admin/import-runs?batchStatus=validation");
  }

  let discoveredUrls: string[] = [];

  try {
    const discovery = await discoverPraktischarztOfferUrls(listingUrl, 5);
    discoveredUrls = discovery.urls.slice(0, 5);

    if (!discoveredUrls.length) {
      redirect("/admin/import-runs?batchStatus=empty");
    }

    const supabase = await createServerSupabaseClient();
    let importedCount = 0;
    let failedCount = 0;

    for (const url of discoveredUrls) {
      try {
        const { runId, item } = await createImportRunWithRawItem(supabase, url);
        await createOrUpdateRefinementQueueFromRawItem(supabase, runId, item);
        importedCount += 1;
      } catch (error) {
        failedCount += 1;

        if (process.env.NODE_ENV !== "production") {
          console.error("[admin-import-runs] praktischarzt batch item failed", {
            url,
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
        }
      }
    }

    revalidatePath("/admin/import-runs");
    revalidatePath("/admin/ai-queue");

    const params = new URLSearchParams({
      batchStatus: importedCount > 0 ? "success" : "error",
      batchFound: String(discoveredUrls.length),
      batchAttempted: String(discoveredUrls.length),
      batchImported: String(importedCount),
      batchFailed: String(failedCount),
      batchUrls: discoveredUrls.join("|")
    });

    redirect(`/admin/import-runs?${params.toString()}`);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[admin-import-runs] praktischarzt batch discovery failed", {
        listingUrl,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }

    const params = new URLSearchParams({
      batchStatus: "error",
      batchFound: String(discoveredUrls.length),
      batchAttempted: String(discoveredUrls.length),
      batchImported: "0",
      batchFailed: String(discoveredUrls.length || 0),
      batchUrls: discoveredUrls.join("|")
    });

    revalidatePath("/admin/import-runs");
    redirect(`/admin/import-runs?${params.toString()}`);
  }
}

async function createPraktischarztSourceScanAction(formData: FormData): Promise<void> {
  "use server";

  await requireAdminUser();

  const submittedListingUrl = String(formData.get("scan_listing_url") ?? "").trim();
  const listingUrl = normalizeImportUrl(submittedListingUrl);
  if (!listingUrl) {
    redirect(
      `/admin/import-runs?scanStatus=validation&scanListingUrl=${encodeURIComponent(submittedListingUrl)}`
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    const result = await runPraktischarztSourceScan({
      supabase,
      listingUrl,
      runTrigger: "manual",
      maxPages: 3,
      maxOffers: 30
    });

    if (!result.ok) {
      redirect(
        `/admin/import-runs?scanStatus=error&scanListingUrl=${encodeURIComponent(listingUrl || submittedListingUrl)}&scanError=${encodeURIComponent(result.message)}`
      );
    }
  } catch (error) {
    const message = getActionableErrorMessage(
      error,
      "Der Praktischarzt-Quellenscan konnte nicht abgeschlossen werden."
    );

    if (process.env.NODE_ENV !== "production") {
      console.error("[admin-import-runs] praktischarzt source scan failed", {
        listingUrl,
        message,
        rawError: error,
        stack: error instanceof Error ? error.stack : undefined
      });
    }

    revalidatePath("/admin/import-runs");
    redirect(
      `/admin/import-runs?scanStatus=error&scanListingUrl=${encodeURIComponent(listingUrl || submittedListingUrl)}&scanError=${encodeURIComponent(message)}`
    );
  }

  revalidatePath("/admin/import-runs");
  redirect(`/admin/import-runs?scanStatus=success&scanListingUrl=${encodeURIComponent(listingUrl)}`);
}

async function importLatestPraktischarztScanOffersAction(): Promise<void> {
  "use server";

  await requireAdminUser();

  const supabase = await createServerSupabaseClient();
  const { data: latestScanRow, error: latestScanError } = await supabase
    .from("external_source_scan_runs")
    .select("*")
    .eq("source_name", "praktischarzt.de")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestScanError) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[admin-import-runs] latest praktischarzt scan load failed", {
        message: latestScanError.message,
        details: latestScanError.details,
        hint: latestScanError.hint,
        code: latestScanError.code
      });
    }

    redirect("/admin/import-runs?scanImportStatus=error");
  }

  const latestScan = (latestScanRow as SourceScanRunRecord | null) ?? null;
  const latestNewOffers = (latestScan?.new_offers ?? []).filter(
    (offer) => offer?.url && isPraktischarztOfferDetailUrl(offer.url)
  );

  if (!latestScan || !latestNewOffers.length) {
    redirect("/admin/import-runs?scanImportStatus=empty");
  }

  const latestNewUrls = latestNewOffers.map((offer) => offer.url);
  const { data: memoryRows, error: memoryError } = await supabase
    .from("external_source_offer_memory")
    .select("offer_url, title, hospital_name, pipeline_imported_at, pipeline_import_run_id")
    .eq("source_name", "praktischarzt.de")
    .in("offer_url", latestNewUrls);

  if (memoryError) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[admin-import-runs] latest praktischarzt source memory load failed", {
        message: memoryError.message,
        details: memoryError.details,
        hint: memoryError.hint,
        code: memoryError.code
      });
    }

    redirect("/admin/import-runs?scanImportStatus=error");
  }

  const memoryByUrl = new Map(
    (((memoryRows as SourceOfferMemoryRecord[] | null) ?? []).map((row) => [row.offer_url, row]))
  );
  const importableOffers = latestNewOffers.filter(
    (offer) => !memoryByUrl.get(offer.url)?.pipeline_imported_at
  );

  if (!importableOffers.length) {
    redirect("/admin/import-runs?scanImportStatus=alreadyImported");
  }

  const cappedOffers = importableOffers.slice(0, 5);
  let importedCount = 0;
  let failedCount = 0;

  for (const offer of cappedOffers) {
    try {
      const { runId, item } = await createImportRunWithRawItem(supabase, offer.url);
      await createOrUpdateRefinementQueueFromRawItem(supabase, runId, item);
      const { error: markImportedError } = await supabase
        .from("external_source_offer_memory")
        .update({
          pipeline_imported_at: new Date().toISOString(),
          pipeline_import_run_id: runId
        })
        .eq("source_name", "praktischarzt.de")
        .eq("offer_url", offer.url);

      if (markImportedError) {
        throw markImportedError;
      }

      importedCount += 1;
    } catch (error) {
      failedCount += 1;

      if (process.env.NODE_ENV !== "production") {
        console.error("[admin-import-runs] latest praktischarzt scan offer import failed", {
          url: offer.url,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }
  }

  revalidatePath("/admin/import-runs");
  revalidatePath("/admin/ai-queue");

  const params = new URLSearchParams({
    scanImportStatus: importedCount > 0 ? "success" : "error",
    scanImportAvailable: String(importableOffers.length),
    scanImportAttempted: String(cappedOffers.length),
    scanImportImported: String(importedCount),
    scanImportFailed: String(failedCount),
    scanImportUrls: cappedOffers.map((offer) => offer.url).join("|")
  });

  redirect(`/admin/import-runs?${params.toString()}`);
}

async function importSingleLatestPraktischarztOfferAction(formData: FormData): Promise<void> {
  "use server";

  await requireAdminUser();

  const offerUrl = normalizeImportUrl(String(formData.get("source_offer_url") ?? ""));
  if (!offerUrl || !isPraktischarztOfferDetailUrl(offerUrl)) {
    redirect("/admin/import-runs?scanWorklistStatus=rowImportValidation");
  }

  const supabase = await createServerSupabaseClient();
  const { data: memoryRowData, error: memoryError } = await supabase
    .from("external_source_offer_memory")
    .select("offer_url, pipeline_imported_at, pipeline_import_run_id")
    .eq("source_name", "praktischarzt.de")
    .eq("offer_url", offerUrl)
    .maybeSingle();

  if (memoryError) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[admin-import-runs] single latest-scan memory load failed", {
        url: offerUrl,
        message: memoryError.message,
        details: memoryError.details,
        hint: memoryError.hint,
        code: memoryError.code
      });
    }

    redirect(`/admin/import-runs?scanWorklistStatus=rowImportError&scanWorklistUrl=${encodeURIComponent(offerUrl)}`);
  }

  const memoryRow = (memoryRowData as SourceOfferMemoryRecord | null) ?? null;
  if (memoryRow?.pipeline_imported_at) {
    redirect(`/admin/import-runs?scanWorklistStatus=rowAlreadyImported&scanWorklistUrl=${encodeURIComponent(offerUrl)}`);
  }

  try {
    const { runId, item } = await createImportRunWithRawItem(supabase, offerUrl);
    await createOrUpdateRefinementQueueFromRawItem(supabase, runId, item);

    const { data: queueEntry, error: queueLoadError } = await supabase
      .from("external_offer_refinement_queue")
      .select("id")
      .eq("import_item_id", item.id)
      .maybeSingle();

    if (queueLoadError || !queueEntry?.id) {
      throw queueLoadError ?? new Error("Der erzeugte Review-Eintrag konnte nicht geladen werden.");
    }

    const { error: markImportedError } = await supabase
      .from("external_source_offer_memory")
      .update({
        pipeline_imported_at: new Date().toISOString(),
        pipeline_import_run_id: runId
      })
      .eq("source_name", "praktischarzt.de")
      .eq("offer_url", offerUrl);

    if (markImportedError) {
      throw markImportedError;
    }

    revalidatePath("/admin/import-runs");
    revalidatePath("/admin/ai-queue");
    redirect(`/admin/ai-queue/${encodeURIComponent(queueEntry.id)}`);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[admin-import-runs] single latest-scan import failed", {
        url: offerUrl,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }

    revalidatePath("/admin/import-runs");
    revalidatePath("/admin/ai-queue");
    redirect(`/admin/import-runs?scanWorklistStatus=rowImportError&scanWorklistUrl=${encodeURIComponent(offerUrl)}`);
  }
}

async function deleteSelectedLatestPraktischarztOffersAction(formData: FormData): Promise<void> {
  "use server";

  await requireAdminUser();

  const selectedUrls = Array.from(
    new Set(
      formData
        .getAll("selected_offer_url")
        .map((value) => normalizeImportUrl(String(value ?? "")))
        .filter((value): value is string => Boolean(value && isPraktischarztOfferDetailUrl(value)))
    )
  );
  const selectedCount = selectedUrls.length;

  if (!selectedCount) {
    redirect("/admin/import-runs?scanWorklistStatus=deleteValidation");
  }

  const supabase = await createServerSupabaseClient();
  const { data: latestScanRow, error: latestScanError } = await supabase
    .from("external_source_scan_runs")
    .select("*")
    .eq("source_name", "praktischarzt.de")
    .eq("run_status", "succeeded")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestScanError || !latestScanRow) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[admin-import-runs] latest source scan for delete failed", {
        message: latestScanError?.message,
        details: latestScanError?.details,
        hint: latestScanError?.hint,
        code: latestScanError?.code
      });
    }

    redirect("/admin/import-runs?scanWorklistStatus=deleteError");
  }

  const latestScan = latestScanRow as SourceScanRunRecord;
  const latestOfferUrls = new Set(
    (latestScan.new_offers ?? [])
      .filter((offer) => offer?.url && isPraktischarztOfferDetailUrl(offer.url))
      .map((offer) => offer.url)
  );
  const urlsInLatestScan = selectedUrls.filter((url) => latestOfferUrls.has(url));
  const matchedCount = urlsInLatestScan.length;

  if (!matchedCount) {
    redirect(
      `/admin/import-runs?scanWorklistStatus=deleteNoMatches&scanWorklistSelected=${selectedCount}`
    );
  }

  const { data: memoryRows, error: memoryError } = await supabase
    .from("external_source_offer_memory")
    .select("offer_url, pipeline_imported_at, pipeline_import_run_id")
    .eq("source_name", "praktischarzt.de")
    .in("offer_url", urlsInLatestScan);

  if (memoryError) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[admin-import-runs] source memory load for delete failed", {
        message: memoryError.message,
        details: memoryError.details,
        hint: memoryError.hint,
        code: memoryError.code
      });
    }

    redirect("/admin/import-runs?scanWorklistStatus=deleteError");
  }

  const importedUrls = ((memoryRows as SourceOfferMemoryRecord[] | null) ?? [])
    .filter((row) => row.pipeline_imported_at)
    .map((row) => row.offer_url);
  const deletableUrls = urlsInLatestScan.filter((url) => !importedUrls.includes(url));
  const deletableCount = deletableUrls.length;

  if (!deletableCount) {
    const params = new URLSearchParams({
      scanWorklistStatus: "deleteBlocked",
      scanWorklistSelected: String(selectedCount),
      scanWorklistMatched: String(matchedCount),
      scanWorklistDeletable: "0",
      scanWorklistDeleted: "0",
      scanWorklistBlocked: String(importedUrls.length)
    });

    redirect(`/admin/import-runs?${params.toString()}`);
  }

  const { data: deletedRowsData, error: deleteMemoryError } = await supabase
      .from("external_source_offer_memory")
      .delete()
      .select("offer_url")
      .eq("source_name", "praktischarzt.de")
      .in("offer_url", deletableUrls);

  if (deleteMemoryError) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[admin-import-runs] source memory delete failed", {
        message: deleteMemoryError.message,
        details: deleteMemoryError.details,
        hint: deleteMemoryError.hint,
        code: deleteMemoryError.code
      });
    }

    redirect("/admin/import-runs?scanWorklistStatus=deleteError");
  }

  const deletedUrls = ((deletedRowsData as Array<{ offer_url: string }> | null) ?? []).map(
    (row) => row.offer_url
  );
  const deletedCount = deletedUrls.length;

  if (!deletedCount) {
    const params = new URLSearchParams({
      scanWorklistStatus: "deleteNoRows",
      scanWorklistSelected: String(selectedCount),
      scanWorklistMatched: String(matchedCount),
      scanWorklistDeletable: String(deletableCount),
      scanWorklistDeleted: "0",
      scanWorklistBlocked: String(importedUrls.length)
    });

    redirect(`/admin/import-runs?${params.toString()}`);
  }

  const remainingOffers = (latestScan.new_offers ?? []).filter(
    (offer) => !offer?.url || !deletedUrls.includes(offer.url)
  );

  const { error: updateScanError } = await supabase
    .from("external_source_scan_runs")
    .update({
      new_offers: remainingOffers,
      new_count: remainingOffers.filter((offer) => offer?.url && isPraktischarztOfferDetailUrl(offer.url)).length
    })
    .eq("id", latestScan.id);

  if (updateScanError) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[admin-import-runs] latest scan update after delete failed", {
        message: updateScanError.message,
        details: updateScanError.details,
        hint: updateScanError.hint,
        code: updateScanError.code
      });
    }

    redirect("/admin/import-runs?scanWorklistStatus=deleteError");
  }

  revalidatePath("/admin/import-runs");

  const params = new URLSearchParams({
    scanWorklistStatus: "deleteSuccess",
    scanWorklistSelected: String(selectedCount),
    scanWorklistMatched: String(matchedCount),
    scanWorklistDeletable: String(deletableCount),
    scanWorklistDeleted: String(deletedCount),
    scanWorklistBlocked: String(importedUrls.length)
  });

  redirect(`/admin/import-runs?${params.toString()}`);
}

async function deleteImportRunAction(formData: FormData): Promise<void> {
  "use server";

  await requireAdminUser();

  const importRunId = String(formData.get("import_run_id") ?? "").trim();
  if (!importRunId) {
    redirect("/admin/import-runs?deleteStatus=error");
  }

  const result = await deleteImportRunById(importRunId);

  if (!result.ok) {
    const status = result.reason === "blocked_published" ? "blockedPublished" : "error";
    redirect(`/admin/import-runs?deleteStatus=${status}`);
  }

  revalidatePath("/admin/import-runs");
  revalidatePath("/admin/import-monitor");
  revalidatePath("/admin/ai-queue");
  redirect("/admin/import-runs?deleteStatus=success");
}

export default async function AdminImportRunsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const createStatusValue = resolvedSearchParams?.createStatus;
  const createStatus = Array.isArray(createStatusValue) ? createStatusValue[0] : createStatusValue;
  const refineStatusValue = resolvedSearchParams?.refineStatus;
  const refineStatus = Array.isArray(refineStatusValue) ? refineStatusValue[0] : refineStatusValue;
  const deleteStatusValue = resolvedSearchParams?.deleteStatus;
  const deleteStatus = Array.isArray(deleteStatusValue) ? deleteStatusValue[0] : deleteStatusValue;
  const batchStatusValue = resolvedSearchParams?.batchStatus;
  const batchStatus = Array.isArray(batchStatusValue) ? batchStatusValue[0] : batchStatusValue;
  const batchFoundValue = resolvedSearchParams?.batchFound;
  const batchFound = Number(Array.isArray(batchFoundValue) ? batchFoundValue[0] : batchFoundValue ?? 0);
  const batchAttemptedValue = resolvedSearchParams?.batchAttempted;
  const batchAttempted = Number(Array.isArray(batchAttemptedValue) ? batchAttemptedValue[0] : batchAttemptedValue ?? 0);
  const batchImportedValue = resolvedSearchParams?.batchImported;
  const batchImported = Number(Array.isArray(batchImportedValue) ? batchImportedValue[0] : batchImportedValue ?? 0);
  const batchFailedValue = resolvedSearchParams?.batchFailed;
  const batchFailed = Number(Array.isArray(batchFailedValue) ? batchFailedValue[0] : batchFailedValue ?? 0);
  const batchUrlsValue = resolvedSearchParams?.batchUrls;
  const batchUrlsRaw = Array.isArray(batchUrlsValue) ? batchUrlsValue[0] : batchUrlsValue;
  const batchUrls = batchUrlsRaw ? batchUrlsRaw.split("|").filter(Boolean) : [];
  const scanStatusValue = resolvedSearchParams?.scanStatus;
  const scanStatus = Array.isArray(scanStatusValue) ? scanStatusValue[0] : scanStatusValue;
  const scanErrorValue = resolvedSearchParams?.scanError;
  const scanError = Array.isArray(scanErrorValue) ? scanErrorValue[0] : scanErrorValue;
  const scanListingUrlValue = resolvedSearchParams?.scanListingUrl;
  const scanListingUrl = Array.isArray(scanListingUrlValue) ? scanListingUrlValue[0] : scanListingUrlValue;
  const scanImportStatusValue = resolvedSearchParams?.scanImportStatus;
  const scanImportStatus = Array.isArray(scanImportStatusValue) ? scanImportStatusValue[0] : scanImportStatusValue;
  const scanImportAvailableValue = resolvedSearchParams?.scanImportAvailable;
  const scanImportAvailable = Number(
    Array.isArray(scanImportAvailableValue) ? scanImportAvailableValue[0] : scanImportAvailableValue ?? 0
  );
  const scanImportAttemptedValue = resolvedSearchParams?.scanImportAttempted;
  const scanImportAttempted = Number(
    Array.isArray(scanImportAttemptedValue) ? scanImportAttemptedValue[0] : scanImportAttemptedValue ?? 0
  );
  const scanImportImportedValue = resolvedSearchParams?.scanImportImported;
  const scanImportImported = Number(
    Array.isArray(scanImportImportedValue) ? scanImportImportedValue[0] : scanImportImportedValue ?? 0
  );
  const scanImportFailedValue = resolvedSearchParams?.scanImportFailed;
  const scanImportFailed = Number(
    Array.isArray(scanImportFailedValue) ? scanImportFailedValue[0] : scanImportFailedValue ?? 0
  );
  const scanImportUrlsValue = resolvedSearchParams?.scanImportUrls;
  const scanImportUrlsRaw = Array.isArray(scanImportUrlsValue) ? scanImportUrlsValue[0] : scanImportUrlsValue;
  const scanImportUrls = scanImportUrlsRaw ? scanImportUrlsRaw.split("|").filter(Boolean) : [];
  const scanWorklistStatusValue = resolvedSearchParams?.scanWorklistStatus;
  const scanWorklistStatus = Array.isArray(scanWorklistStatusValue)
    ? scanWorklistStatusValue[0]
    : scanWorklistStatusValue;
  const scanWorklistDeletedValue = resolvedSearchParams?.scanWorklistDeleted;
  const scanWorklistDeleted = Number(
    Array.isArray(scanWorklistDeletedValue) ? scanWorklistDeletedValue[0] : scanWorklistDeletedValue ?? 0
  );
  const scanWorklistSelectedValue = resolvedSearchParams?.scanWorklistSelected;
  const scanWorklistSelected = Number(
    Array.isArray(scanWorklistSelectedValue) ? scanWorklistSelectedValue[0] : scanWorklistSelectedValue ?? 0
  );
  const scanWorklistMatchedValue = resolvedSearchParams?.scanWorklistMatched;
  const scanWorklistMatched = Number(
    Array.isArray(scanWorklistMatchedValue) ? scanWorklistMatchedValue[0] : scanWorklistMatchedValue ?? 0
  );
  const scanWorklistDeletableValue = resolvedSearchParams?.scanWorklistDeletable;
  const scanWorklistDeletable = Number(
    Array.isArray(scanWorklistDeletableValue) ? scanWorklistDeletableValue[0] : scanWorklistDeletableValue ?? 0
  );
  const scanWorklistBlockedValue = resolvedSearchParams?.scanWorklistBlocked;
  const scanWorklistBlocked = Number(
    Array.isArray(scanWorklistBlockedValue) ? scanWorklistBlockedValue[0] : scanWorklistBlockedValue ?? 0
  );
  const scanWorklistUrlValue = resolvedSearchParams?.scanWorklistUrl;
  const scanWorklistUrl = Array.isArray(scanWorklistUrlValue) ? scanWorklistUrlValue[0] : scanWorklistUrlValue;

  const supabase = await createServerSupabaseClient();
  const [{ data: runsData }, { data: itemsData }, { data: queueData }, { data: sourceScanRunsData }] = await Promise.all([
    supabase.from("external_offer_import_runs").select("*").order("updated_at", { ascending: false }).limit(10),
    supabase.from("external_offer_import_items").select("*").order("updated_at", { ascending: false }).limit(10)
    ,
    supabase
      .from("external_offer_refinement_queue")
      .select("id, import_item_id, refinement_status")
      .order("updated_at", { ascending: false })
      .limit(50),
    supabase
      .from("external_source_scan_runs")
      .select("*")
      .eq("source_name", "praktischarzt.de")
      .order("created_at", { ascending: false })
      .limit(5)
  ]);

  const runs = (runsData as ImportRunRecord[] | null) ?? [];
  const items = (itemsData as ImportItemRecord[] | null) ?? [];
  const queueEntries = (queueData as RefinementQueueRecord[] | null) ?? [];
  const sourceScanRuns = (sourceScanRunsData as SourceScanRunRecord[] | null) ?? [];
  const latestSourceScan = sourceScanRuns.find((run) => run.run_status === "succeeded") ?? null;
  const latestScheduledSourceScan =
    sourceScanRuns.find((run) => run.run_trigger === "scheduled") ?? null;
  const latestScheduledFailedScan =
    sourceScanRuns.find((run) => run.run_trigger === "scheduled" && run.run_status === "failed") ?? null;
  const latestSourceScanNewOffers = (latestSourceScan?.new_offers ?? []).filter(
    (offer) => offer?.url && isPraktischarztOfferDetailUrl(offer.url)
  );
  const latestSourceScanUrls = latestSourceScanNewOffers.map((offer) => offer.url);
  const { data: latestSourceMemoryRowsData } = latestSourceScanUrls.length
    ? await supabase
        .from("external_source_offer_memory")
        .select("offer_url, title, hospital_name, pipeline_imported_at, pipeline_import_run_id")
        .eq("source_name", "praktischarzt.de")
        .in("offer_url", latestSourceScanUrls)
    : { data: [] };
  const latestSourceMemoryRows = (latestSourceMemoryRowsData as SourceOfferMemoryRecord[] | null) ?? [];
  const latestSourceMemoryByUrl = new Map(latestSourceMemoryRows.map((row) => [row.offer_url, row]));
  const latestSourceScanAlreadyImportedOffers = latestSourceScanNewOffers.filter(
    (offer) => latestSourceMemoryByUrl.get(offer.url)?.pipeline_imported_at
  );
  const latestSourceScanImportableOffers = latestSourceScanNewOffers.filter(
    (offer) => !latestSourceMemoryByUrl.get(offer.url)?.pipeline_imported_at
  );
  const latestImportedRunIds = Array.from(
    new Set(
      latestSourceMemoryRows
        .map((row) => row.pipeline_import_run_id)
        .filter((value): value is string => Boolean(value))
    )
  );
  const { data: latestImportedItemsData } = latestImportedRunIds.length
    ? await supabase
        .from("external_offer_import_items")
        .select("id, import_run_id")
        .in("import_run_id", latestImportedRunIds)
    : { data: [] };
  const latestImportedItems = ((latestImportedItemsData as Array<Pick<ImportItemRecord, "id" | "import_run_id">> | null) ?? []);
  const latestImportedItemByRunId = new Map(latestImportedItems.map((item) => [item.import_run_id, item]));
  const latestImportedItemIds = latestImportedItems.map((item) => item.id);
  const { data: latestImportedQueueEntriesData } = latestImportedItemIds.length
    ? await supabase
        .from("external_offer_refinement_queue")
        .select("id, import_item_id, refinement_status")
        .in("import_item_id", latestImportedItemIds)
    : { data: [] };
  const latestImportedQueueEntries =
    (latestImportedQueueEntriesData as RefinementQueueRecord[] | null) ?? [];
  const latestImportedQueueByItemId = new Map(
    latestImportedQueueEntries.map((entry) => [entry.import_item_id, entry])
  );
  const latestQueueIdByOfferUrl = new Map(
    latestSourceMemoryRows.flatMap((row) => {
      const runId = row.pipeline_import_run_id;
      if (!runId) {
        return [];
      }

      const item = latestImportedItemByRunId.get(runId);
      if (!item) {
        return [];
      }

      const queueEntry = latestImportedQueueByItemId.get(item.id);
      if (!queueEntry) {
        return [];
      }

      return [[row.offer_url, queueEntry.id] as const];
    })
  );
  const latestItemByRunId = new Map(items.map((item) => [item.import_run_id, item]));
  const queueEntryByItemId = new Map(queueEntries.map((entry) => [entry.import_item_id, entry]));

  return (
    <DashboardShell
      role="admin"
      title="Import runs"
      description="Starten Sie URL-Imports für externe Stellen, sehen Sie Rohinhalte ein und halten Sie den Publishing-Katalog getrennt."
    >
      <Card>
        <CardHeader>
          <CardTitle>Externes Stellenangebot per URL importieren</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {createStatus === "success" ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Importlauf gespeichert und Rohinhalt erfolgreich geladen.
            </div>
          ) : null}
          {createStatus === "validation" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Bitte geben Sie eine gültige URL für das externe Stellenangebot ein.
            </div>
          ) : null}
          {createStatus === "error" ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Der Importlauf konnte nicht abgeschlossen werden. Bitte prüfen Sie die URL, Weiterleitungen der Zielseite oder versuchen Sie es später erneut.
            </div>
          ) : null}
          {batchStatus === "success" ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Praktischarzt-Testbatch abgeschlossen. Gefunden: {batchFound}. Versucht: {batchAttempted}. Erfolgreich importiert: {batchImported}. Fehlgeschlagen: {batchFailed}.
            </div>
          ) : null}
          {batchStatus === "validation" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Bitte geben Sie eine gültige Praktischarzt-Listing-URL ein.
            </div>
          ) : null}
          {batchStatus === "empty" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Auf der Praktischarzt-Listing-Seite konnten keine verwertbaren Angebots-URLs gefunden werden.
            </div>
          ) : null}
          {batchStatus === "error" ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Der Praktischarzt-Testbatch konnte nicht vollständig abgeschlossen werden. Gefunden: {batchFound}. Versucht: {batchAttempted}. Erfolgreich importiert: {batchImported}. Fehlgeschlagen: {batchFailed}.
            </div>
          ) : null}
          {batchUrls.length ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Verarbeitete URLs
              </p>
              <ul className="mt-2 space-y-1 break-all">
                {batchUrls.map((url) => (
                  <li key={url}>{url}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {refineStatus === "success" ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              KI-Aufbereitung erfolgreich erstellt. Der reviewbare Entwurf liegt jetzt in der AI refinement queue.
            </div>
          ) : null}
          {refineStatus === "noRawText" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Für diese URL wurde kein ausreichend lesbarer Rohtext gespeichert. Bitte prüfen Sie zuerst den Importlauf.
            </div>
          ) : null}
          {refineStatus === "temporaryUnavailable" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Die KI-Aufbereitung ist vorübergehend nicht verfügbar. Der Queue-Eintrag bleibt erhalten und kann später erneut versucht werden.
            </div>
          ) : null}
          {refineStatus === "error" ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Die KI-Aufbereitung konnte nicht abgeschlossen werden. Bitte prüfen Sie den Rohimport und versuchen Sie es erneut.
            </div>
          ) : null}
          {deleteStatus === "success" ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Importlauf und zugehörige Roh-/Queue-Daten gelöscht.
            </div>
          ) : null}
          {deleteStatus === "blockedPublished" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Dieser Importlauf ist noch mit einem veröffentlichten externen Angebot verknüpft. Löschen Sie zuerst das veröffentlichte Angebot.
            </div>
          ) : null}
          {deleteStatus === "error" ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Der Importlauf konnte nicht gelöscht werden.
            </div>
          ) : null}

          <form action={createExternalOfferImportRunAction} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="space-y-2">
              <Label htmlFor="source-url">URL des externen Stellenangebots</Label>
              <Input
                id="source-url"
                name="source_url"
                type="url"
                placeholder="https://..."
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit">Import starten</Button>
            </div>
          </form>

          <p className="text-sm text-muted-foreground">
            Dieser Bereich speichert nur Rohimporte und Fehlerstände. Veröffentlichte externe Angebote bleiben weiterhin ausschließlich im Bereich <span className="font-medium text-foreground">External offers</span>.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Praktischarzt Testbatch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={createPraktischarztBatchImportAction} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="space-y-2">
              <Label htmlFor="praktischarzt-listing-url">Praktischarzt Listing-URL</Label>
              <Input
                id="praktischarzt-listing-url"
                name="listing_url"
                type="url"
                placeholder="https://www.praktischarzt.de/arzt-jobs/"
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" variant="outline">Praktischarzt Testbatch starten</Button>
            </div>
          </form>

          <p className="text-sm text-muted-foreground">
            Dieses Testwerkzeug ist strikt auf maximal <span className="font-medium text-foreground">5 Angebote</span> begrenzt und führt keine automatische Veröffentlichung aus.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Praktischarzt Quellenscan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {scanStatus === "success" ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Praktischarzt-Scan abgeschlossen. Neue Angebote seit dem letzten Scan sind unten sichtbar.
              {scanListingUrl ? <span className="block mt-1 break-all">Verwendete Listing-URL: {scanListingUrl}</span> : null}
            </div>
          ) : null}
          {scanStatus === "validation" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Bitte geben Sie eine gültige Praktischarzt-Listing-URL für den Quellenscan ein.
              {scanListingUrl ? <span className="block mt-1 break-all">Eingegebene URL: {scanListingUrl}</span> : null}
            </div>
          ) : null}
          {scanStatus === "empty" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {scanError || "Es konnten keine verwertbaren Praktischarzt-Detailangebote erkannt werden."}
              {scanListingUrl ? <span className="block mt-1 break-all">Verwendete Listing-URL: {scanListingUrl}</span> : null}
            </div>
          ) : null}
          {scanStatus === "error" ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {scanError || "Der Praktischarzt-Quellenscan konnte nicht abgeschlossen werden."}
              {scanListingUrl ? <span className="block mt-1 break-all">Verwendete Listing-URL: {scanListingUrl}</span> : null}
            </div>
          ) : null}
          {latestScheduledSourceScan?.run_status === "succeeded" ? (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
              Letzter geplanter Praktischarzt-Scan:
              <span className="ml-1 font-medium">
                {new Date(latestScheduledSourceScan.created_at).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}
              </span>
              . Neu erkannt:
              <span className="ml-1 font-medium">{latestScheduledSourceScan.new_count}</span>.
              {latestScheduledSourceScan.new_count > 0 ? (
                <span className="block mt-1">Es warten neue Angebote auf Ihre manuelle Übernahme.</span>
              ) : null}
            </div>
          ) : null}
          {latestScheduledFailedScan ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Letzter geplanter Praktischarzt-Scan fehlgeschlagen am{" "}
              <span className="font-medium">
                {new Date(latestScheduledFailedScan.created_at).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}
              </span>
              .
              {latestScheduledFailedScan.error_message ? (
                <span className="block mt-1">{latestScheduledFailedScan.error_message}</span>
              ) : null}
            </div>
          ) : null}
          {scanImportStatus === "success" ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Neue Praktischarzt-Angebote importiert. Verfügbar: {scanImportAvailable}. Versucht: {scanImportAttempted}. Erfolgreich importiert: {scanImportImported}. Fehlgeschlagen: {scanImportFailed}.
            </div>
          ) : null}
          {scanImportStatus === "empty" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Im letzten Praktischarzt-Scan liegen aktuell keine neuen importierbaren Detailangebote vor.
            </div>
          ) : null}
          {scanImportStatus === "alreadyImported" ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              Die neu erkannten Praktischarzt-Angebote aus dem letzten Scan wurden bereits in die externe Import-Pipeline übernommen.
            </div>
          ) : null}
          {scanImportStatus === "error" ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Der Import neuer Praktischarzt-Angebote aus dem letzten Scan konnte nicht vollständig abgeschlossen werden. Verfügbar: {scanImportAvailable}. Versucht: {scanImportAttempted}. Erfolgreich importiert: {scanImportImported}. Fehlgeschlagen: {scanImportFailed}.
            </div>
          ) : null}
          {scanWorklistStatus === "deleteValidation" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Bitte wählen Sie mindestens ein Praktischarzt-Angebot aus der letzten Scan-Liste aus.
            </div>
          ) : null}
          {scanWorklistStatus === "deleteSuccess" ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Auswahl verarbeitet: {scanWorklistSelected}. Passende Scan-Einträge: {scanWorklistMatched}. Löschbar: {scanWorklistDeletable}. Entfernt: {scanWorklistDeleted}. Bereits in die Pipeline übernommene Einträge blieben unberührt: {scanWorklistBlocked}.
            </div>
          ) : null}
          {scanWorklistStatus === "deleteNoMatches" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Auswahl verarbeitet: {scanWorklistSelected}. Keiner der übergebenen Einträge konnte der aktuellen Praktischarzt-Scan-Liste zugeordnet werden.
            </div>
          ) : null}
          {scanWorklistStatus === "deleteBlocked" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Auswahl verarbeitet: {scanWorklistSelected}. Passende Scan-Einträge: {scanWorklistMatched}. Nichts gelöscht. Bereits in die Pipeline übernommene Einträge wurden aus Sicherheitsgründen übersprungen: {scanWorklistBlocked}.
            </div>
          ) : null}
          {scanWorklistStatus === "deleteNoRows" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Auswahl verarbeitet: {scanWorklistSelected}. Passende Scan-Einträge: {scanWorklistMatched}. Als löschbar erkannt: {scanWorklistDeletable}. Die Datenbank hat jedoch 0 Zeilen entfernt.
            </div>
          ) : null}
          {scanWorklistStatus === "deleteError" ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Die ausgewählten Praktischarzt-Einträge konnten nicht gelöscht werden.
            </div>
          ) : null}
          {scanWorklistStatus === "rowImportValidation" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Für die direkte Übernahme fehlt eine gültige Praktischarzt-Detail-URL.
            </div>
          ) : null}
          {scanWorklistStatus === "rowAlreadyImported" ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              Dieses Praktischarzt-Angebot wurde bereits in die Pipeline übernommen.
              {scanWorklistUrl ? <span className="mt-1 block break-all">{scanWorklistUrl}</span> : null}
            </div>
          ) : null}
          {scanWorklistStatus === "rowImportError" ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Das ausgewählte Praktischarzt-Angebot konnte nicht direkt in die Review-Pipeline übernommen werden.
              {scanWorklistUrl ? <span className="mt-1 block break-all">{scanWorklistUrl}</span> : null}
            </div>
          ) : null}
          {scanImportUrls.length ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Neu importierte Scan-URLs
              </p>
              <ul className="mt-2 space-y-1 break-all">
                {scanImportUrls.map((url) => (
                  <li key={url}>{url}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <form action={createPraktischarztSourceScanAction} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="space-y-2">
              <Label htmlFor="praktischarzt-scan-listing-url">Praktischarzt Listing-URL</Label>
              <Input
                id="praktischarzt-scan-listing-url"
                name="scan_listing_url"
                type="url"
                defaultValue={scanListingUrl ?? ""}
                placeholder="https://www.praktischarzt.de/aerztestellen/"
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" variant="outline">Praktischarzt-Scan starten</Button>
            </div>
          </form>

          <p className="text-sm text-muted-foreground">
            Dieser Quellenscan prüft aktuell maximal <span className="font-medium text-foreground">3 Listing-Seiten</span>, merkt sich bereits bekannte Detail-URLs und zeigt neue Angebote seit dem letzten Stand. Es gibt in diesem Schritt weder Auto-Import noch Auto-Veröffentlichung.
          </p>

          {latestSourceScan ? (
            <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-700">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Letzter Praktischarzt-Scan
                  </p>
                  <p className="mt-1 break-all">{latestSourceScan.listing_url}</p>
                </div>
                <p className="text-xs text-slate-500">
                  {new Date(latestSourceScan.created_at).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}
                </p>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Gescannt</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{latestSourceScan.scanned_count}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Neu</p>
                  <p className="mt-1 text-xl font-semibold text-emerald-700">{latestSourceScanNewOffers.length}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Bereits bekannt</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{latestSourceScan.known_count}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Noch importierbar</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{latestSourceScanImportableOffers.length}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Bereits in Pipeline</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{latestSourceScanAlreadyImportedOffers.length}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">Neue Angebote importieren</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Importiert ausschliesslich die neu erkannten Praktischarzt-Detailseiten aus diesem letzten Scan, aktuell sicher begrenzt auf maximal 5 Angebote.
                  </p>
                </div>
                <form action={importLatestPraktischarztScanOffersAction}>
                  <Button type="submit" variant="outline" disabled={!latestSourceScanImportableOffers.length}>
                    Neue Angebote importieren
                  </Button>
                </form>
              </div>

              <form
                action={deleteSelectedLatestPraktischarztOffersAction}
                className="mt-4 space-y-4"
              >
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Worklist bereinigen</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Wählen Sie unerwünschte Einträge aus dieser letzten Scan-Liste aus. Bereits in die Pipeline übernommene Angebote werden aus Sicherheitsgründen nicht gelöscht.
                    </p>
                  </div>
                  <ConfirmSubmitButton
                    type="submit"
                    variant="outline"
                    confirmMessage="Die ausgewählten Praktischarzt-Einträge wirklich aus dieser Scan-Worklist entfernen?"
                    disabled={!latestSourceScanImportableOffers.length}
                  >
                    Ausgewählte löschen
                  </ConfirmSubmitButton>
                </div>

                <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Neu erkannte Angebote
                </p>
                {latestSourceScanNewOffers.length ? (
                  <ul className="mt-2 space-y-2">
                    {latestSourceScanNewOffers.map((offer) => {
                      const memoryRow = latestSourceMemoryByUrl.get(offer.url);
                      const isImported = Boolean(memoryRow?.pipeline_imported_at);
                      const queueId = latestQueueIdByOfferUrl.get(offer.url);
                      const displayTitle =
                        offer.title?.trim() ||
                        memoryRow?.title?.trim() ||
                        "Ohne erkannten Titel";
                      const displayHospital =
                        offer.hospitalName?.trim() || memoryRow?.hospital_name?.trim() || null;

                      return (
                        <li key={offer.url} className="rounded-2xl bg-white px-4 py-3">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="flex items-start gap-3">
                              {isImported ? (
                                <span className="mt-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                                  -
                                </span>
                              ) : (
                                <input
                                  type="checkbox"
                                  name="selected_offer_url"
                                  value={offer.url}
                                  className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                                />
                              )}
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-medium text-slate-900">{displayTitle}</p>
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                                      isImported ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"
                                    }`}
                                  >
                                    {isImported ? "Bereits importiert" : "Importierbar"}
                                  </span>
                                </div>
                                {displayHospital ? (
                                  <p className="mt-1 text-sm text-slate-600">{displayHospital}</p>
                                ) : null}
                                {isImported ? (
                                  <p className="mt-1 text-xs text-slate-500">
                                    Bereits in der Pipeline. In dieser Scan-Worklist nicht löschbar.
                                  </p>
                                ) : null}
                                <p className="mt-1 break-all text-xs text-slate-500">{offer.url}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {isImported ? (
                                queueId ? (
                                  <Button asChild variant="outline" size="sm">
                                    <Link href={`/admin/ai-queue/${queueId}`}>Review öffnen</Link>
                                  </Button>
                                ) : (
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                                    Bereits in Pipeline
                                  </span>
                                )
                              ) : (
                                <form action={importSingleLatestPraktischarztOfferAction}>
                                  <input type="hidden" name="source_offer_url" value={offer.url} />
                                  <Button type="submit" variant="outline" size="sm">
                                    In Review übernehmen
                                  </Button>
                                </form>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">
                    Beim letzten Scan wurden keine neuen Praktischarzt-Angebote erkannt.
                  </p>
                )}
                </div>
              </form>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Letzte Importlaeufe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {runs.length ? (
            runs.map((run) => {
              const item = latestItemByRunId.get(run.id);
              const queueEntry = item ? queueEntryByItemId.get(item.id) : null;
              const rawPreview = item?.raw_text?.slice(0, 1200) ?? "";

              return (
                <article key={run.id} className="rounded-2xl border p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                          {run.import_status}
                        </span>
                        {run.source_name ? (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                            {run.source_name}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm font-medium text-slate-900 break-all">{run.source_url}</p>
                      {run.error_message ? (
                        <p className="text-sm text-rose-700">{run.error_message}</p>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-500">
                      {new Date(run.updated_at).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}
                    </p>
                  </div>

                  {item ? (
                    <div className="mt-4 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Rohtext-Vorschau
                        </p>
                        <div className="flex items-center gap-2">
                          {queueEntry ? (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                              KI-Queue: {queueEntry.refinement_status}
                            </span>
                          ) : null}
                          <form action={createRefinementQueueEntryAction}>
                            <input type="hidden" name="import_run_id" value={run.id} />
                            <input type="hidden" name="import_item_id" value={item.id} />
                            <Button type="submit" variant="outline" disabled={!rawPreview.trim()}>
                              Zur KI-Aufbereitung
                            </Button>
                          </form>
                          <form action={deleteImportRunAction}>
                            <input type="hidden" name="import_run_id" value={run.id} />
                            <ConfirmSubmitButton
                              type="submit"
                              variant="ghost"
                              size="sm"
                              confirmMessage="Diesen Importlauf inklusive Rohdaten und unveröffentlichter Queue-Einträge wirklich löschen?"
                              className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                            >
                              Löschen
                            </ConfirmSubmitButton>
                          </form>
                        </div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                        {rawPreview || "Kein lesbarer Rohtext gespeichert."}
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Noch keine Importläufe verfügbar.
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
