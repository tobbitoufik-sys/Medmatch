import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SignUpForm } from "@/components/forms/auth-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="container py-20">
        <div className="mx-auto max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">MedMatch-Konto erstellen</CardTitle>
              <CardDescription>
                Wählen Sie, ob Sie als Arzt oder als medizinische Einrichtung starten möchten.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SignUpForm />
              <p className="text-sm text-muted-foreground">
                Sie haben bereits ein Konto? <Link href="/login" className="font-semibold text-primary">Einloggen</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
