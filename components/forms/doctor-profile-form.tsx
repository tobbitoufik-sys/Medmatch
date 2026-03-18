import type { DoctorProfile } from "@/types";
import { updateDoctorProfileAction } from "@/lib/actions";
import { ServerForm } from "@/components/forms/server-form";
import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function DoctorProfileForm({ profile }: { profile: DoctorProfile | null }) {
  return (
    <ServerForm action={updateDoctorProfileAction} submitLabel="Save doctor profile">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="First name"><Input name="first_name" defaultValue={profile?.first_name} required /></Field>
        <Field label="Last name"><Input name="last_name" defaultValue={profile?.last_name} required /></Field>
        <Field label="Professional title"><Input name="title" defaultValue={profile?.title || "MD"} required /></Field>
        <Field label="Specialty"><Input name="specialty" defaultValue={profile?.specialty} required /></Field>
        <Field label="Sub-specialty"><Input name="sub_specialty" defaultValue={profile?.sub_specialty} /></Field>
        <Field label="Years of experience"><Input name="years_experience" type="number" defaultValue={profile?.years_experience ?? 0} required /></Field>
        <Field label="City"><Input name="city" defaultValue={profile?.city} required /></Field>
        <Field label="Country"><Input name="country" defaultValue={profile?.country} required /></Field>
        <Field label="Availability"><Input name="availability" defaultValue={profile?.availability} required /></Field>
        <Field label="Contract type"><Input name="contract_type" defaultValue={profile?.contract_type} required /></Field>
      </div>
      <Field label="Languages" hint="Separate multiple languages with commas.">
        <Input name="languages" defaultValue={profile?.languages.join(", ")} required />
      </Field>
      <Field label="Professional bio">
        <Textarea name="bio" defaultValue={profile?.bio} required />
      </Field>
      <label className="flex items-center gap-3 rounded-2xl border bg-secondary/50 px-4 py-3 text-sm">
        <input name="is_public" type="checkbox" defaultChecked={profile?.is_public ?? true} className="h-4 w-4 rounded border" />
        Make my profile visible in the public doctor directory
      </label>
    </ServerForm>
  );
}
