import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardList, ShieldCheck, Sparkles } from "lucide-react";

import { getJobOffers } from "@/lib/data/repository";
import { Hero } from "@/components/marketing/hero";
import { SectionHeading } from "@/components/marketing/section-heading";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function HomePage() {
  const offers = await getJobOffers();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Hero />

      <section className="container py-20">
        <SectionHeading
          eyebrow="How it works"
          title="A simple workflow for trusted healthcare hiring"
          description="MedMatch keeps the MVP focused on the essentials: strong profiles, clear offers and fast professional introductions."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Create a professional presence",
              text: "Doctors and facilities build structured profiles with specialties, locations, availability and clear context.",
              icon: ClipboardList
            },
            {
              title: "Search with practical filters",
              text: "Filter doctors or opportunities by specialty, location, contract type, availability and language.",
              icon: Sparkles
            },
            {
              title: "Connect with confidence",
              text: "Use contact requests to start recruitment conversations in a professional, trackable way.",
              icon: ShieldCheck
            }
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <item.icon className="h-6 w-6" />
                </div>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.text}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Badge>For doctors</Badge>
              <CardTitle className="text-3xl">Present your experience the right way</CardTitle>
              <CardDescription>
                Build a profile that highlights specialty, languages, availability and career goals without dealing with unnecessary complexity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                "Structured medical profile with clear professional information",
                "Access to relevant opportunities from hospitals and clinics",
                "Simple applications and contact requests",
                "Profile visibility controls and verification readiness"
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                  <p className="text-muted-foreground">{item}</p>
                </div>
              ))}
              <Button asChild className="mt-4">
                <Link href="/for-doctors">Explore doctor experience</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Badge>For facilities</Badge>
              <CardTitle className="text-3xl">Publish opportunities and source talent efficiently</CardTitle>
              <CardDescription>
                Recruiters, clinics and hospitals can present their organisation, publish roles and start conversations quickly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                "Professional facility profile with verification support",
                "Simple job posting workflow for urgent or permanent needs",
                "Searchable doctor directory with useful filters",
                "Admin moderation tools for a credible platform"
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                  <p className="text-muted-foreground">{item}</p>
                </div>
              ))}
              <Button asChild className="mt-4">
                <Link href="/for-facilities">Explore facility experience</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container py-20">
        <SectionHeading
          eyebrow="Featured opportunities"
          title="Roles that feel credible from the first glance"
          description="Clear, structured opportunities help doctors understand the role, the location and the expected profile quickly."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {offers.slice(0, 4).map((offer) => (
            <Card key={offer.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>{offer.title}</CardTitle>
                    <CardDescription>
                      {offer.facility?.facility_name || "Healthcare facility"} • {offer.city}, {offer.country}
                    </CardDescription>
                  </div>
                  <Badge>{offer.contract_type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{offer.description}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge className="bg-primary/10 text-primary">{offer.specialty}</Badge>
                  <Badge className="bg-secondary text-secondary-foreground">
                    Published {formatDate(offer.published_at)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button asChild size="lg">
            <Link href="/opportunities">
              View all opportunities
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="bg-primary py-20 text-primary-foreground">
        <div className="container flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm uppercase tracking-[0.2em] text-primary-foreground/80">Launch-ready MVP</p>
            <h2 className="text-4xl font-semibold tracking-tight">
              Start with a focused healthcare hiring platform that feels trustworthy from day one.
            </h2>
            <p className="text-lg text-primary-foreground/80">
              MedMatch is designed for a fast V0 launch, with room to grow into verification, document workflows and international expansion later.
            </p>
          </div>
          <Button asChild variant="secondary" size="lg">
            <Link href="/register">Create your account</Link>
          </Button>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
