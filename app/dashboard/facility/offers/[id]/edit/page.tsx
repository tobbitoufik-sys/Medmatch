import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ConfirmDeleteButton } from "@/components/dashboard/confirm-delete-button";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  jobOfferContractTypes,
  jobOfferContractTypeLabels,
  normalizeJobOfferContractType
} from "@/lib/job-offers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function updateOffer(formData: FormData) {
  "use server";

  const supabase = await createServerSupabaseClient();
  const id = formData.get("id")?.toString();

  if (!id) return;

  const { data, error } = await supabase
    .from("job_offers")
    .update({
      title: formData.get("title")?.toString() ?? "",
      specialty: formData.get("specialty")?.toString() ?? "",
      city: formData.get("city")?.toString() ?? "",
      country: formData.get("country")?.toString() ?? "",
      contract_type: formData.get("contract_type")?.toString() ?? "",
      salary_range_optional: formData.get("salary_range_optional")?.toString() ?? "",
      status: formData.get("status")?.toString() ?? "draft",
      description: formData.get("description")?.toString() ?? "",
      requirements: formData.get("requirements")?.toString() ?? ""
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || "Unable to update the offer.");
  }

  revalidatePath("/dashboard/facility/offers");
  redirect("/dashboard/facility/offers");
}

async function deleteOffer(formData: FormData) {
  "use server";

  const supabase = await createServerSupabaseClient();
  const id = formData.get("id")?.toString();

  if (!id) return;

  const { data, error } = await supabase
    .from("job_offers")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || "Unable to delete the offer.");
  }

  revalidatePath("/dashboard/facility/offers");
  redirect("/dashboard/facility/offers");
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: offer } = await supabase
    .from("job_offers")
    .select("*")
    .eq("id", id)
    .single();

  if (!offer) return <div>No offer</div>;

  return (
    <DashboardShell
      role="facility"
      title="Edit offer"
      description="Update the details of this role from your facility workspace."
    >
      <Card className="mx-auto w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Edit offer</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateOffer} className="space-y-6">
            <input type="hidden" name="id" value={offer.id} />

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Title">
                <Input name="title" defaultValue={offer.title} />
              </Field>
              <Field label="Specialty">
                <Input name="specialty" defaultValue={offer.specialty} />
              </Field>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="City">
                <Input name="city" defaultValue={offer.city} />
              </Field>
              <Field label="Country">
                <Input name="country" defaultValue={offer.country} />
              </Field>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Contract type">
                <Select
                  name="contract_type"
                  defaultValue={normalizeJobOfferContractType(offer.contract_type)}
                >
                  {jobOfferContractTypes.map((contractType) => (
                    <option key={contractType} value={contractType}>
                      {jobOfferContractTypeLabels[contractType]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Salary">
                <Input name="salary_range_optional" defaultValue={offer.salary_range_optional ?? ""} />
              </Field>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Status">
                <Select name="status" defaultValue={offer.status}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </Select>
              </Field>
            </div>

            <Field label="Description">
              <Textarea name="description" defaultValue={offer.description} className="min-h-[180px]" />
            </Field>

            <Field label="Requirements">
              <Textarea name="requirements" defaultValue={offer.requirements} className="min-h-[180px]" />
            </Field>

            <Button type="submit">Save</Button>
          </form>

          <div className="mt-4">
            <ConfirmDeleteButton offerId={offer.id} action={deleteOffer} />
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
