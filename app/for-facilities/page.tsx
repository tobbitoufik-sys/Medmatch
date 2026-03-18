import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForFacilitiesPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="container py-20">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.2em] text-primary">For facilities</p>
            <h1 className="text-5xl font-semibold tracking-tight">Recruit doctors with a platform that feels serious, fast and easy to manage.</h1>
            <p className="text-lg text-muted-foreground">
              Present your organisation, publish roles, search the doctor directory and keep every initial conversation in one clean workflow.
            </p>
            <Button asChild size="lg">
              <Link href="/register">Create a facility account</Link>
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>What facilities can do</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>Create a professional facility profile with organisation type, city, country, website and recruiter contact person.</p>
              <p>Publish, update or pause opportunities from a dedicated dashboard.</p>
              <p>Search doctor profiles with practical filters and start direct outreach.</p>
              <p>Use the admin layer to moderate quality, verify profiles and manage trust on the platform.</p>
            </CardContent>
          </Card>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
