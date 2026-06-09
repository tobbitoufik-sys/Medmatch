import type { Route } from "next";
import type { UserRole } from "@/types";

export const siteConfig = {
  name: "MedMatch",
  description:
    "Premium-Plattform für die Vermittlung von Ärztinnen und Ärzten an Kliniken und Praxen."
};

export const navLinks: { href: Route; label: string }[] = [
  { href: "/", label: "Startseite" },
  { href: "/how-it-works", label: "So funktioniert es" },
  { href: "/for-doctors", label: "Für Ärzte" },
  { href: "/for-facilities", label: "Für Einrichtungen" },
  { href: "/opportunities", label: "Stellenangebote" },
  { href: "/doctors", label: "Arztprofile" },
  { href: "/contact", label: "Kontakt" }
];

export const dashboardNav: Record<UserRole, { href: Route; label: string }[]> = {
  doctor: [
    { href: "/dashboard/doctor", label: "Übersicht" },
    { href: "/dashboard/doctor/profile", label: "Profil" },
    { href: "/dashboard/doctor/opportunities", label: "Stellenangebote" },
    { href: "/dashboard/doctor/contacts", label: "Postfach" }
  ],
  facility: [
    { href: "/dashboard/facility", label: "Übersicht" },
    { href: "/dashboard/facility/profile", label: "Profil" },
    { href: "/dashboard/facility/offers", label: "Stellenangebote" },
    { href: "/dashboard/facility/doctors", label: "Ärzte finden" },
    { href: "/dashboard/facility/contacts", label: "Postfach" }
  ],
  admin: [
    { href: "/admin", label: "Übersicht" },
    { href: "/admin/statistics" as Route, label: "Statistiken" },
    { href: "/admin/external-offers" as Route, label: "Externe Angebote" },
    { href: "/admin/import-runs" as Route, label: "Importläufe" },
    { href: "/admin/import-monitor" as Route, label: "Importmonitor" },
    { href: "/admin/ai-queue" as Route, label: "KI-Review-Queue" },
    { href: "/admin/users", label: "Nutzer" },
    { href: "/admin/profiles", label: "Profile" },
    { href: "/admin/offers", label: "Angebote" },
    { href: "/admin/contacts", label: "Postfach" }
  ]
};
