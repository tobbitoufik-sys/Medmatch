"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { Bell, BriefcaseBusiness, FileText, Inbox, LayoutGrid, UserRound } from "lucide-react";

import { dashboardNav } from "@/lib/site";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

type MobileNavItem = {
  href: Route;
  label: string;
  match: (pathname: string) => boolean;
  icon: typeof LayoutGrid;
};

function getDoctorNavHref(label: string, fallback: Route) {
  return dashboardNav.doctor.find((item) => item.label === label)?.href ?? fallback;
}

const mobileDoctorNavItems: MobileNavItem[] = [
  {
    href: getDoctorNavHref("Übersicht", "/dashboard/doctor"),
    label: "Übersicht",
    icon: LayoutGrid,
    match: (pathname) => pathname === "/dashboard/doctor"
  },
  {
    href: getDoctorNavHref("Stellenangebote", "/dashboard/doctor/opportunities"),
    label: "Jobs",
    icon: BriefcaseBusiness,
    match: (pathname) =>
      pathname.startsWith("/dashboard/doctor/opportunities") ||
      pathname.startsWith("/dashboard/doctor/external-offers")
  },
  {
    href: "/dashboard/doctor/cv" as Route,
    label: "CV",
    icon: FileText,
    match: (pathname) =>
      pathname.startsWith("/dashboard/doctor/cv") ||
      pathname.startsWith("/dashboard/doctor/cover-letter") ||
      pathname.startsWith("/dashboard/doctor/application-email")
  },
  {
    href: getDoctorNavHref("Postfach", "/dashboard/doctor/contacts"),
    label: "Postfach",
    icon: Inbox,
    match: (pathname) => pathname.startsWith("/dashboard/doctor/contacts")
  },
  {
    href: getDoctorNavHref("Profil", "/dashboard/doctor/profile"),
    label: "Profil",
    icon: UserRound,
    match: (pathname) => pathname.startsWith("/dashboard/doctor/profile")
  }
];

export function MobileDoctorChrome({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm backdrop-blur md:hidden">
        <div className="flex min-h-12 items-center justify-between gap-3">
          <Logo />
          <Link
            href={getDoctorNavHref("Postfach", "/dashboard/doctor/contacts")}
            className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm"
            aria-label="Postfach öffnen"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-primary" />
            ) : null}
          </Link>
        </div>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
        aria-label="Mobile Doktor-Navigation"
      >
        <div className="grid grid-cols-5 gap-1">
          {mobileDoctorNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.match(pathname);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-medium text-slate-700",
                  isActive ? "bg-primary/10 text-primary" : "hover:bg-slate-50"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
