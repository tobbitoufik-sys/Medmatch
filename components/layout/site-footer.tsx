import Link from "next/link";

import { Logo } from "@/components/layout/logo";

export function SiteFooter() {
  return (
    <footer className="border-t bg-white">
      <div className="container grid gap-10 py-12 md:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-sm text-sm text-muted-foreground">
            Premium-Plattform für medizinische Karrierewege, Bewerbungen und vertrauensvolle Kontakte zwischen Ärzten und Einrichtungen.
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-foreground">Plattform</p>
          <Link href="/how-it-works" className="block text-muted-foreground hover:text-foreground">So funktioniert es</Link>
          <Link href="/opportunities" className="block text-muted-foreground hover:text-foreground">Stellenangebote</Link>
          <Link href="/doctors" className="block text-muted-foreground hover:text-foreground">Arztprofile</Link>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-foreground">Unternehmen</p>
          <Link href="/contact" className="block text-muted-foreground hover:text-foreground">Kontakt</Link>
          <Link href="/legal" className="block text-muted-foreground hover:text-foreground">Impressum</Link>
          <Link href="/privacy" className="block text-muted-foreground hover:text-foreground">Datenschutz</Link>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-foreground">Zugang</p>
          <Link href="/login" className="block text-muted-foreground hover:text-foreground">Einloggen</Link>
          <Link href="/register" className="block text-muted-foreground hover:text-foreground">Konto erstellen</Link>
        </div>
      </div>
    </footer>
  );
}
