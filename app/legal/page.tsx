import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function LegalPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="container max-w-4xl py-20">
        <h1 className="text-4xl font-semibold tracking-tight">Legal notice</h1>
        <div className="mt-8 space-y-6 text-muted-foreground">
          <p>This template includes a placeholder legal notice for your MVP launch. Replace it with your final company details before going live.</p>
          <p>MedMatch is a professional recruitment platform. It does not process patient records or provide medical advice.</p>
          <p>Add your legal entity name, registration number, address, publication director and host information in this page before production launch.</p>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
