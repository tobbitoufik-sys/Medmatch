import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentUser } from "@/lib/data/repository";
import { deleteExternalJobOfferById } from "@/lib/external-offers/admin-delete";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ExternalJobOffer, ExternalOfferSalutation, JobOfferContractType } from "@/types";

function normalizeOptional(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized.length ? normalized : null;
}

function normalizeRequired(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function normalizeSalutation(value: FormDataEntryValue | null): ExternalOfferSalutation {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "herr" || normalized === "frau" ? normalized : "unbekannt";
}

function isValidOptionalEmail(value: string | null) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function requireAdminUser() {
  "use server";

  const user = await getCurrentUser("admin");
  if (!user || user.role !== "admin") {
    throw new Error("Only admins can manage external offers.");
  }

  return user;
}

async function createExternalOfferAction(formData: FormData): Promise<void> {
  "use server";

  await requireAdminUser();

  const title = normalizeRequired(formData.get("title"));
  const hospitalName = normalizeRequired(formData.get("hospital_name"));
  const contactEmail = normalizeOptional(formData.get("contact_email"));

  if (!title || !hospitalName) {
    redirect("/admin/external-offers?createStatus=validation");
  }

  if (!isValidOptionalEmail(contactEmail)) {
    redirect("/admin/external-offers?createStatus=invalidEmail");
  }

  const contractType = normalizeOptional(formData.get("contract_type")) as JobOfferContractType | null;
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("external_job_offers").insert({
    title,
    hospital_name: hospitalName,
    location: normalizeOptional(formData.get("location")),
    clinic_address: normalizeOptional(formData.get("clinic_address")),
    contact_person: normalizeOptional(formData.get("contact_person")),
    salutation: normalizeSalutation(formData.get("salutation")),
    contact_email: contactEmail,
    contact_phone: normalizeOptional(formData.get("contact_phone")),
    source_name: normalizeOptional(formData.get("source_name")),
    source_url: normalizeOptional(formData.get("source_url")),
    external_offer_id: normalizeOptional(formData.get("external_offer_id")),
    specialty: normalizeOptional(formData.get("specialty")),
    contract_type: contractType,
    summary: normalizeOptional(formData.get("summary")),
    is_active: formData.get("is_active") === "on"
  });

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[admin-external-offers] create failed", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    }

    redirect("/admin/external-offers?createStatus=error");
  }

  revalidatePath("/admin/external-offers");
  revalidatePath("/dashboard/doctor/external-offers");
  redirect("/admin/external-offers?createStatus=success");
}

async function updateExternalOfferAction(formData: FormData) {
  "use server";

  await requireAdminUser();

  const id = normalizeRequired(formData.get("id"));
  const title = normalizeRequired(formData.get("title"));
  const hospitalName = normalizeRequired(formData.get("hospital_name"));
  const contactEmail = normalizeOptional(formData.get("contact_email"));

  if (!id || !title || !hospitalName) {
    return;
  }

  if (!isValidOptionalEmail(contactEmail)) {
    return;
  }

  const contractType = normalizeOptional(formData.get("contract_type")) as JobOfferContractType | null;
  const supabase = await createServerSupabaseClient();
  await supabase
    .from("external_job_offers")
    .update({
      title,
      hospital_name: hospitalName,
      location: normalizeOptional(formData.get("location")),
      clinic_address: normalizeOptional(formData.get("clinic_address")),
      contact_person: normalizeOptional(formData.get("contact_person")),
      salutation: normalizeSalutation(formData.get("salutation")),
      contact_email: contactEmail,
      contact_phone: normalizeOptional(formData.get("contact_phone")),
      source_name: normalizeOptional(formData.get("source_name")),
      source_url: normalizeOptional(formData.get("source_url")),
      external_offer_id: normalizeOptional(formData.get("external_offer_id")),
      specialty: normalizeOptional(formData.get("specialty")),
      contract_type: contractType,
      summary: normalizeOptional(formData.get("summary"))
    })
    .eq("id", id);

  revalidatePath("/admin/external-offers");
  revalidatePath("/dashboard/doctor/external-offers");
}

async function toggleExternalOfferAction(formData: FormData) {
  "use server";

  await requireAdminUser();

  const id = normalizeRequired(formData.get("id"));
  const nextIsActive = formData.get("next_is_active") === "true";

  if (!id) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  await supabase.from("external_job_offers").update({ is_active: nextIsActive }).eq("id", id);

  revalidatePath("/admin/external-offers");
  revalidatePath("/dashboard/doctor/external-offers");
}

async function deactivateExternalOfferAction(formData: FormData) {
  "use server";

  const nextFormData = new FormData();
  nextFormData.set("id", String(formData.get("id") ?? ""));
  nextFormData.set("next_is_active", "false");
  await toggleExternalOfferAction(nextFormData);
}

async function activateExternalOfferAction(formData: FormData) {
  "use server";

  const nextFormData = new FormData();
  nextFormData.set("id", String(formData.get("id") ?? ""));
  nextFormData.set("next_is_active", "true");
  await toggleExternalOfferAction(nextFormData);
}

async function deleteExternalOfferAction(formData: FormData) {
  "use server";

  await requireAdminUser();

  const id = normalizeRequired(formData.get("id"));
  if (!id) {
    redirect("/admin/external-offers?deleteStatus=error");
  }

  const result = await deleteExternalJobOfferById(id);

  if (!result.ok) {
    redirect("/admin/external-offers?deleteStatus=error");
  }

  revalidatePath("/admin/external-offers");
  revalidatePath("/admin/ai-queue");
  revalidatePath("/admin/import-monitor");
  revalidatePath("/dashboard/doctor/external-offers");
  redirect("/admin/external-offers?deleteStatus=success");
}

export default async function AdminExternalOffersPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const createStatusValue = resolvedSearchParams?.createStatus;
  const createStatus = Array.isArray(createStatusValue) ? createStatusValue[0] : createStatusValue;
  const deleteStatusValue = resolvedSearchParams?.deleteStatus;
  const deleteStatus = Array.isArray(deleteStatusValue) ? deleteStatusValue[0] : deleteStatusValue;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("external_job_offers").select("*").order("updated_at", { ascending: false });

  const offers = (data as ExternalJobOffer[] | null) ?? [];

  return (
    <DashboardShell
      role="admin"
      title="External offers"
      description="Verwalten Sie importierte externe Stellenangebote getrennt vom nativen job_offers-Workflow."
    >
      <Card>
        <CardHeader>
          <CardTitle>Externes Stellenangebot anlegen</CardTitle>
        </CardHeader>
        <CardContent>
          {createStatus === "success" ? (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Externes Stellenangebot gespeichert.
            </div>
          ) : null}
          {createStatus === "validation" ? (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Bitte fuellen Sie mindestens Titel und Krankenhaus aus.
            </div>
          ) : null}
          {createStatus === "invalidEmail" ? (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Bitte geben Sie eine gültige Kontakt-E-Mail-Adresse ein.
            </div>
          ) : null}
          {createStatus === "error" ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Das externe Stellenangebot konnte nicht gespeichert werden.
            </div>
          ) : null}
          {deleteStatus === "success" ? (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Externes Stellenangebot gelöscht.
            </div>
          ) : null}
          {deleteStatus === "error" ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Das externe Stellenangebot konnte nicht gelöscht werden.
            </div>
          ) : null}

          <form action={createExternalOfferAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-title">Titel</Label>
              <Input id="new-title" name="title" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-hospital-name">Krankenhaus</Label>
              <Input id="new-hospital-name" name="hospital_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-location">Standort</Label>
              <Input id="new-location" name="location" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-clinic-address">Klinikadresse</Label>
              <Input id="new-clinic-address" name="clinic_address" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-contact-person">Ansprechpartner</Label>
              <Input id="new-contact-person" name="contact_person" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-salutation">Anrede</Label>
              <select
                id="new-salutation"
                name="salutation"
                defaultValue="unbekannt"
                className="flex h-11 w-full rounded-2xl border bg-white px-4 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="unbekannt">Unbekannt</option>
                <option value="frau">Frau</option>
                <option value="herr">Herr</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-contact-email">Kontakt-E-Mail</Label>
              <Input id="new-contact-email" name="contact_email" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-contact-phone">Kontakt-Telefon</Label>
              <Input id="new-contact-phone" name="contact_phone" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-specialty">Fachrichtung</Label>
              <Input id="new-specialty" name="specialty" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-source-name">Quelle</Label>
              <Input id="new-source-name" name="source_name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-source-url">Source URL</Label>
              <Input id="new-source-url" name="source_url" type="url" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-external-offer-id">Externe Offer-ID</Label>
              <Input id="new-external-offer-id" name="external_offer_id" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-contract-type">Vertrag</Label>
              <select
                id="new-contract-type"
                name="contract_type"
                className="flex h-11 w-full rounded-2xl border bg-white px-4 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Nicht angegeben</option>
                <option value="honorar">Honorar</option>
                <option value="befristet">Befristet</option>
                <option value="unbefristet">Unbefristet</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="new-summary">Zusammenfassung</Label>
              <Textarea id="new-summary" name="summary" className="min-h-[120px]" />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground md:col-span-2">
              <input type="checkbox" name="is_active" defaultChecked className="h-4 w-4 rounded border" />
              Aktiv veröffentlichen
            </label>
            <div className="md:col-span-2">
              <Button type="submit">Externes Angebot speichern</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Externe Stellenangebote</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {offers.length ? (
            offers.map((offer) => (
              <form key={offer.id} action={updateExternalOfferAction} className="rounded-2xl border p-4">
                <input type="hidden" name="id" value={offer.id} />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`title-${offer.id}`}>Titel</Label>
                    <Input id={`title-${offer.id}`} name="title" defaultValue={offer.title} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`hospital-${offer.id}`}>Krankenhaus</Label>
                    <Input id={`hospital-${offer.id}`} name="hospital_name" defaultValue={offer.hospital_name} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`location-${offer.id}`}>Standort</Label>
                    <Input id={`location-${offer.id}`} name="location" defaultValue={offer.location ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`clinic-address-${offer.id}`}>Klinikadresse</Label>
                    <Input
                      id={`clinic-address-${offer.id}`}
                      name="clinic_address"
                      defaultValue={offer.clinic_address ?? ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`contact-person-${offer.id}`}>Ansprechpartner</Label>
                    <Input
                      id={`contact-person-${offer.id}`}
                      name="contact_person"
                      defaultValue={offer.contact_person ?? ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`salutation-${offer.id}`}>Anrede</Label>
                    <select
                      id={`salutation-${offer.id}`}
                      name="salutation"
                      defaultValue={offer.salutation}
                      className="flex h-11 w-full rounded-2xl border bg-white px-4 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="unbekannt">Unbekannt</option>
                      <option value="frau">Frau</option>
                      <option value="herr">Herr</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`contact-email-${offer.id}`}>Kontakt-E-Mail</Label>
                    <Input
                      id={`contact-email-${offer.id}`}
                      name="contact_email"
                      type="email"
                      defaultValue={offer.contact_email ?? ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`contact-phone-${offer.id}`}>Kontakt-Telefon</Label>
                    <Input
                      id={`contact-phone-${offer.id}`}
                      name="contact_phone"
                      defaultValue={offer.contact_phone ?? ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`specialty-${offer.id}`}>Fachrichtung</Label>
                    <Input id={`specialty-${offer.id}`} name="specialty" defaultValue={offer.specialty ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`source-name-${offer.id}`}>Quelle</Label>
                    <Input id={`source-name-${offer.id}`} name="source_name" defaultValue={offer.source_name ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`source-url-${offer.id}`}>Source URL</Label>
                    <Input id={`source-url-${offer.id}`} name="source_url" type="url" defaultValue={offer.source_url ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`external-id-${offer.id}`}>Externe Offer-ID</Label>
                    <Input
                      id={`external-id-${offer.id}`}
                      name="external_offer_id"
                      defaultValue={offer.external_offer_id ?? ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`contract-${offer.id}`}>Vertrag</Label>
                    <select
                      id={`contract-${offer.id}`}
                      name="contract_type"
                      defaultValue={offer.contract_type ?? ""}
                      className="flex h-11 w-full rounded-2xl border bg-white px-4 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Nicht angegeben</option>
                      <option value="honorar">Honorar</option>
                      <option value="befristet">Befristet</option>
                      <option value="unbefristet">Unbefristet</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`summary-${offer.id}`}>Zusammenfassung</Label>
                    <Textarea
                      id={`summary-${offer.id}`}
                      name="summary"
                      defaultValue={offer.summary ?? ""}
                      className="min-h-[120px]"
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
                    {offer.is_active ? "Aktiv" : "Inaktiv"}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" variant="outline">
                      Aenderungen speichern
                    </Button>
                    <button
                      type="submit"
                      formAction={offer.is_active ? deactivateExternalOfferAction : activateExternalOfferAction}
                      className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      {offer.is_active ? "Deaktivieren" : "Aktivieren"}
                    </button>
                    <ConfirmSubmitButton
                      type="submit"
                      formAction={deleteExternalOfferAction}
                      variant="ghost"
                      confirmMessage="Dieses veröffentlichte externe Stellenangebot wirklich löschen?"
                      className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                    >
                      Löschen
                    </ConfirmSubmitButton>
                  </div>
                </div>
              </form>
            ))
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Titel</TH>
                  <TH>Krankenhaus</TH>
                  <TH>Standort</TH>
                  <TH>Quelle</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                <TR>
                  <TD colSpan={5} className="py-8 text-center text-muted-foreground">
                    Noch keine externen Stellenangebote angelegt.
                  </TD>
                </TR>
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
