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
              <CardTitle className="text-3xl">Create your MedMatch account</CardTitle>
              <CardDescription>
                Choose whether you are a doctor or a healthcare facility. The database structure is ready for role-based onboarding and dashboards.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SignUpForm />
              <p className="text-sm text-muted-foreground">
                Already have an account? <Link href="/login" className="font-semibold text-primary">Log in</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
