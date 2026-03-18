import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="container max-w-4xl py-20">
        <h1 className="text-4xl font-semibold tracking-tight">Privacy policy</h1>
        <div className="mt-8 space-y-6 text-muted-foreground">
          <p>This MVP only covers professional account, profile and recruitment data. It is intentionally not designed for patient health data.</p>
          <p>When you connect Supabase, you should add your final retention, lawful basis, access and deletion policies.</p>
          <p>For production, review your jurisdiction-specific obligations and update this page with your final privacy counsel wording.</p>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
