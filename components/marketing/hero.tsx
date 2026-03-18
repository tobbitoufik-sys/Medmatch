import Link from "next/link";
import { ArrowRight, Building2, Stethoscope } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="grid-background bg-hero-radial">
      <div className="container grid gap-10 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
        <div className="space-y-8">
          <Badge>Built for trusted healthcare hiring</Badge>
          <div className="space-y-5">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-foreground md:text-6xl">
              Connect exceptional doctors with ambitious hospitals and clinics.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              MedMatch is a focused healthcare recruitment platform for professional profiles, verified opportunities and simple cross-border introductions.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href="/register">
                Create an account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/opportunities">Browse opportunities</Link>
            </Button>
          </div>
        </div>
        <Card className="overflow-hidden border-primary/10">
          <CardContent className="space-y-6 p-8">
            <div className="flex items-center justify-between rounded-3xl bg-secondary p-5">
              <div>
                <p className="text-sm text-muted-foreground">Doctor side</p>
                <p className="text-xl font-semibold">Professional profile</p>
              </div>
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Stethoscope className="h-6 w-6" />
              </div>
            </div>
            <div className="space-y-4 rounded-3xl border p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Dr. Amelia Carter</p>
                  <p className="text-sm text-muted-foreground">Cardiology • London</p>
                </div>
                <Badge>Verified</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Looking for permanent consultant opportunities in premium clinics and tertiary hospitals.
              </p>
            </div>
            <div className="space-y-4 rounded-3xl border p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">NorthStar Clinic</p>
                  <p className="text-sm text-muted-foreground">Private clinic • Dubai</p>
                </div>
                <div className="rounded-2xl bg-accent/10 p-3 text-accent">
                  <Building2 className="h-6 w-6" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Hiring a consultant cardiologist with international exposure and strong outpatient leadership experience.
              </p>
              <Button asChild className="w-full">
                <Link href="/opportunities">View featured roles</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
