import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForDoctorsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="container py-20">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.2em] text-primary">For doctors</p>
            <h1 className="text-5xl font-semibold tracking-tight">Show your experience with clarity and access relevant opportunities faster.</h1>
            <p className="text-lg text-muted-foreground">
              Build a structured professional profile, define your availability and contract preferences, and start conversations with credible healthcare employers.
            </p>
            <Button asChild size="lg">
              <Link href="/register">Create a doctor account</Link>
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>What doctors can do</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>Create a polished medical profile with specialty, sub-specialty, city, country, languages and short biography.</p>
              <p>Explore job opportunities filtered by specialty, country, city and contract type.</p>
              <p>Send a direct contact request or simple application without navigating a heavy recruitment system.</p>
              <p>Keep your profile public or private and prepare for document uploads later in the roadmap.</p>
            </CardContent>
          </Card>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
