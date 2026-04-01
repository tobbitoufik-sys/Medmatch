import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { BriefcaseBusiness, Building2, Inbox, LayoutGrid, Search, UserRound, Users } from "lucide-react";

import { dashboardNav } from "@/lib/site";
import { getCurrentDoctorProfile, getCurrentUser } from "@/lib/data/repository";
import { getUnreadConversationCount } from "@/lib/application-conversations";
import { Logo } from "@/components/layout/logo";
import { SignOutButton } from "@/components/forms/sign-out-button";

const navIcons = {
  Overview: LayoutGrid,
  Profile: UserRound,
  Opportunities: BriefcaseBusiness,
  Offers: BriefcaseBusiness,
  "Find doctors": Search,
  Inbox,
  Users,
  Profiles: Building2
} as const;

const doctorNavLabels: Record<string, string> = {
  Overview: "Übersicht",
  Profile: "Profil",
  Opportunities: "Stellenangebote",
  Inbox: "Postfach",
  Applications: "Bewerbungen"
};

function getInitials(name: string, email: string) {
  const source = name.trim() || email.split("@")[0] || "U";

  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getDoctorDisplayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  fallbackName: string
) {
  const parts = [firstName?.trim(), lastName?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : fallbackName;
}

export async function DashboardShell({
  role,
  title,
  description,
  children
}: {
  role: "doctor" | "facility" | "admin";
  title: string;
  description: string;
  children: ReactNode;
}) {
  const user = await getCurrentUser(role);
  if (!user) redirect("/");
  if (user.role !== role) redirect("/dashboard");
  const doctorProfile = role === "doctor" ? await getCurrentDoctorProfile() : null;
  const doctorProfileImageUrl =
    role === "doctor" && doctorProfile?.profile_photo_path
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/doctor-profile-photos/${doctorProfile.profile_photo_path}`
      : null;
  const doctorDisplayName =
    role === "doctor"
      ? getDoctorDisplayName(doctorProfile?.first_name, doctorProfile?.last_name, user.full_name)
      : user.full_name;
  const userInitials = getInitials(doctorDisplayName, user.email);
  const contactsUnreadCount =
    role === "doctor" || role === "facility"
      ? await getUnreadConversationCount(role, user.id)
      : 0;

  return (
    <div className="min-h-screen bg-secondary/40">
      <div className="container grid gap-8 py-8 lg:grid-cols-[260px_1fr]">
        <aside className="surface h-fit p-5">
          <div className="space-y-6">
            <Logo />
            <div className="rounded-3xl border border-border/60 bg-gradient-to-b from-background to-secondary/60 px-4 py-5 shadow-sm">
              <div className="flex flex-col items-center text-center">
                {doctorProfileImageUrl ? (
                  <img
                    src={doctorProfileImageUrl}
                    alt="Profilbild"
                    className="h-24 w-24 rounded-full border-4 border-background object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-background bg-muted shadow-sm">
                    <span className="text-2xl font-semibold">{userInitials}</span>
                  </div>
                )}
                <p className="mt-4 text-base font-semibold leading-tight text-foreground">
                  {doctorDisplayName}
                </p>
              </div>
            </div>
            <nav className="space-y-2">
              {dashboardNav[role].map((item) => (
                (() => {
                  const Icon = navIcons[item.label as keyof typeof navIcons] ?? LayoutGrid;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{role === "doctor" ? doctorNavLabels[item.label] ?? item.label : item.label}</span>
                      </span>
                  {item.href.endsWith("/contacts") ? (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                          {contactsUnreadCount}
                        </span>
                  ) : null}
                    </Link>
                  );
                })()
              ))}
            </nav>
            <SignOutButton />
          </div>
        </aside>
        <main className="space-y-8">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.18em] text-primary">Arbeitsbereich</p>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="max-w-3xl text-muted-foreground">{description}</p>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
