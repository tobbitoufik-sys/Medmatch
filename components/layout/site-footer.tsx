import Link from "next/link";

import { Logo } from "@/components/layout/logo";

export function SiteFooter() {
  return (
    <footer className="border-t bg-white">
      <div className="container grid gap-10 py-12 md:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-sm text-sm text-muted-foreground">
            Premium healthcare recruitment platform connecting doctors and trusted facilities across borders.
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-foreground">Platform</p>
          <Link href="/how-it-works" className="block text-muted-foreground hover:text-foreground">How it works</Link>
          <Link href="/opportunities" className="block text-muted-foreground hover:text-foreground">Opportunities</Link>
          <Link href="/doctors" className="block text-muted-foreground hover:text-foreground">Doctors</Link>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-foreground">Company</p>
          <Link href="/contact" className="block text-muted-foreground hover:text-foreground">Contact</Link>
          <Link href="/legal" className="block text-muted-foreground hover:text-foreground">Legal notice</Link>
          <Link href="/privacy" className="block text-muted-foreground hover:text-foreground">Privacy</Link>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-foreground">Access</p>
          <Link href="/login" className="block text-muted-foreground hover:text-foreground">Log in</Link>
          <Link href="/register" className="block text-muted-foreground hover:text-foreground">Create account</Link>
        </div>
      </div>
    </footer>
  );
}
