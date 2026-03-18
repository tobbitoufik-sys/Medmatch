import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const steps = [
  ["1. Sign up", "Choose your role as a doctor or facility and create your account."],
  ["2. Complete your profile", "Add specialties, location, experience, company details and hiring needs."],
  ["3. Search and connect", "Browse opportunities or doctors and send a professional contact request."],
  ["4. Admin moderation", "The admin dashboard helps review profiles, offers and overall platform quality."]
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="container py-20">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm uppercase tracking-[0.2em] text-primary">How it works</p>
          <h1 className="text-5xl font-semibold tracking-tight">A practical workflow designed for healthcare recruitment teams.</h1>
          <p className="text-lg text-muted-foreground">
            MedMatch avoids noise and focuses on the actions that matter in an early-stage platform: clear profiles, clear offers and a clean contact flow.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {steps.map(([title, description]) => (
            <Card key={title}>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Each step is intentionally lightweight so the platform can be deployed quickly without sacrificing professionalism.
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
