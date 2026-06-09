import type { JobOffer } from "@/types";
import { createOrUpdateOfferAction } from "@/lib/actions";
import { ServerForm } from "@/components/forms/server-form";
import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  jobOfferContractTypes,
  jobOfferContractTypeLabels,
  normalizeJobOfferContractType
} from "@/lib/job-offers";

export function JobOfferForm({ offer }: { offer?: JobOffer }) {
  return (
    <ServerForm action={createOrUpdateOfferAction} submitLabel={offer ? "Stellenangebot aktualisieren" : "Stellenangebot erstellen"}>
      {offer ? <input type="hidden" name="offer_id" value={offer.id} /> : null}
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Titel"><Input name="title" defaultValue={offer?.title} required /></Field>
        <Field label="Fachrichtung"><Input name="specialty" defaultValue={offer?.specialty} required /></Field>
        <Field label="Stadt"><Input name="city" defaultValue={offer?.city} required /></Field>
        <Field label="Land"><Input name="country" defaultValue={offer?.country} required /></Field>
        <Field label="Vertragsart">
          <Select
            name="contract_type"
            defaultValue={normalizeJobOfferContractType(offer?.contract_type)}
            required
          >
            {jobOfferContractTypes.map((contractType) => (
              <option key={contractType} value={contractType}>
                {jobOfferContractTypeLabels[contractType]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Gehaltsrahmen (optional)"><Input name="salary_range_optional" defaultValue={offer?.salary_range_optional || ""} /></Field>
        <Field label="Status">
          <Select name="status" defaultValue={offer?.status || "draft"}>
            <option value="draft">Entwurf</option>
            <option value="published">Veröffentlicht</option>
            <option value="paused">Pausiert</option>
          </Select>
        </Field>
      </div>
      <Field label="Beschreibung"><Textarea name="description" defaultValue={offer?.description} required /></Field>
      <Field label="Anforderungen"><Textarea name="requirements" defaultValue={offer?.requirements} required /></Field>
    </ServerForm>
  );
}
