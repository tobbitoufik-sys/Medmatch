import type { JobOffer } from "@/types";
import { createOrUpdateOfferAction } from "@/lib/actions";
import { ServerForm } from "@/components/forms/server-form";
import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

export function JobOfferForm({ offer }: { offer?: JobOffer }) {
  return (
    <ServerForm action={createOrUpdateOfferAction} submitLabel={offer ? "Update offer" : "Create offer"}>
      {offer ? <input type="hidden" name="offer_id" value={offer.id} /> : null}
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Title"><Input name="title" defaultValue={offer?.title} required /></Field>
        <Field label="Specialty"><Input name="specialty" defaultValue={offer?.specialty} required /></Field>
        <Field label="City"><Input name="city" defaultValue={offer?.city} required /></Field>
        <Field label="Country"><Input name="country" defaultValue={offer?.country} required /></Field>
        <Field label="Contract type"><Input name="contract_type" defaultValue={offer?.contract_type} required /></Field>
        <Field label="Salary range (optional)"><Input name="salary_range_optional" defaultValue={offer?.salary_range_optional || ""} /></Field>
        <Field label="Status">
          <Select name="status" defaultValue={offer?.status || "draft"}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="paused">Paused</option>
          </Select>
        </Field>
      </div>
      <Field label="Description"><Textarea name="description" defaultValue={offer?.description} required /></Field>
      <Field label="Requirements"><Textarea name="requirements" defaultValue={offer?.requirements} required /></Field>
    </ServerForm>
  );
}
