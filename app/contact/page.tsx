import { Mail, MapPin, Phone } from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="container py-20">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm uppercase tracking-[0.2em] text-primary">Contact</p>
          <h1 className="text-5xl font-semibold tracking-tight">A professional platform needs clear contact information.</h1>
          <p className="text-lg text-muted-foreground">
            Replace these default details with your company information after deployment.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: Mail, title: "Email", value: "hello@medmatch.example" },
            { icon: Phone, title: "Phone", value: "+44 20 0000 0000" },
            { icon: MapPin, title: "Address", value: "London, United Kingdom" }
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <item.icon className="h-6 w-6" />
                </div>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">{item.value}</CardContent>
            </Card>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
