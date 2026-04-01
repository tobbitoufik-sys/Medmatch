import type { FacilityProfile } from "@/types";
import { updateFacilityProfileAction } from "@/lib/actions";
import { ServerForm } from "@/components/forms/server-form";
import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function FacilityProfileForm({ profile }: { profile: FacilityProfile | null }) {
  return (
    <ServerForm action={updateFacilityProfileAction} submitLabel="Save facility profile">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Facility name" required><Input name="facility_name" defaultValue={profile?.facility_name} required /></Field>
        <Field label="Facility type" required><Input name="facility_type" defaultValue={profile?.facility_type} required /></Field>
        <Field label="City" required><Input name="city" defaultValue={profile?.city} required /></Field>
        <Field label="Country" required><Input name="country" defaultValue={profile?.country} required /></Field>
        <Field label="Website"><Input name="website" defaultValue={profile?.website || ""} placeholder="https://example.com" /></Field>
        <Field label="Contact person" required><Input name="contact_person_name" defaultValue={profile?.contact_person_name} required /></Field>
      </div>
      <Field label="Description" required>
        <Textarea name="description" defaultValue={profile?.description} required />
      </Field>
    </ServerForm>
  );
}
