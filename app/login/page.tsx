import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SignInForm } from "@/components/forms/auth-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="container py-20">
        <div className="mx-auto max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Log in</CardTitle>
              <CardDescription>
                Access your MedMatch workspace. In demo mode, the auth flow becomes live once Supabase is connected.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SignInForm />
              <p className="text-sm text-muted-foreground">
                No account yet? <Link href="/register" className="font-semibold text-primary">Create one</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
