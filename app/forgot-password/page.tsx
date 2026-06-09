import Link from "next/link";

import { ServerForm } from "@/components/forms/server-form";
import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requestPasswordResetAction } from "@/lib/actions";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="container py-20">
        <div className="mx-auto max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Passwort vergessen</CardTitle>
              <CardDescription>
                Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link zum Zurücksetzen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ServerForm action={requestPasswordResetAction} submitLabel="Link senden">
                <Field label="E-Mail">
                  <Input name="email" type="email" placeholder="name@beispiel.de" required />
                </Field>
              </ServerForm>
              <p className="text-sm text-muted-foreground">
                <Link href="/login" className="font-semibold text-primary">Zurück zum Login</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
