import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="container py-20">
        <div className="mx-auto max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Neues Passwort</CardTitle>
              <CardDescription>
                Legen Sie ein neues Passwort für Ihr MedMatch Konto fest.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<p className="text-sm text-muted-foreground">Link wird geprüft...</p>}>
                <ResetPasswordForm />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
