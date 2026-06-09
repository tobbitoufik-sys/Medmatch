import Link from "next/link";

import { signInAction, signUpAction } from "@/lib/actions";
import { ServerForm } from "@/components/forms/server-form";
import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function SignInForm() {
  return (
    <ServerForm
      action={signInAction}
      submitLabel="Einloggen"
      submitAccessory={
        <Link href="/forgot-password" className="inline-flex text-sm font-semibold text-primary">
          Passwort vergessen?
        </Link>
      }
    >
      <Field label="E-Mail">
        <Input name="email" type="email" placeholder="name@beispiel.de" required />
      </Field>
      <Field label="Passwort">
        <Input name="password" type="password" placeholder="Mindestens 8 Zeichen" required />
      </Field>
    </ServerForm>
  );
}

export function SignUpForm() {
  return (
    <ServerForm action={signUpAction} submitLabel="Konto erstellen">
      <Field label="Vollständiger Name">
        <Input name="fullName" placeholder="Dr. Amina Schneider" required />
      </Field>
      <Field label="E-Mail">
        <Input name="email" type="email" placeholder="name@beispiel.de" required />
      </Field>
      <Field label="Passwort">
        <Input name="password" type="password" placeholder="Sicheres Passwort erstellen" required />
      </Field>
      <Field label="Kontotyp">
        <Select name="role" defaultValue="doctor">
          <option value="doctor">Arzt</option>
          <option value="facility">Klinik / Praxis / Recruiter</option>
        </Select>
      </Field>
    </ServerForm>
  );
}
