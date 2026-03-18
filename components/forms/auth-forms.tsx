import { signInAction, signUpAction } from "@/lib/actions";
import { ServerForm } from "@/components/forms/server-form";
import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function SignInForm() {
  return (
    <ServerForm action={signInAction} submitLabel="Log in">
      <Field label="Email">
        <Input name="email" type="email" placeholder="you@hospital.com" required />
      </Field>
      <Field label="Password">
        <Input name="password" type="password" placeholder="Minimum 8 characters" required />
      </Field>
    </ServerForm>
  );
}

export function SignUpForm() {
  return (
    <ServerForm action={signUpAction} submitLabel="Create account">
      <Field label="Full name">
        <Input name="fullName" placeholder="Dr. Amelia Carter" required />
      </Field>
      <Field label="Email">
        <Input name="email" type="email" placeholder="you@example.com" required />
      </Field>
      <Field label="Password">
        <Input name="password" type="password" placeholder="Create a secure password" required />
      </Field>
      <Field label="Account type">
        <Select name="role" defaultValue="doctor">
          <option value="doctor">Doctor</option>
          <option value="facility">Hospital / Clinic / Recruiter</option>
        </Select>
      </Field>
    </ServerForm>
  );
}
