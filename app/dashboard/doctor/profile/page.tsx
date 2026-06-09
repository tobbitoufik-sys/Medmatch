import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DoctorProfileForm } from "@/components/forms/doctor-profile-form";
import { BadgeCheck, BriefcaseBusiness, ChevronRight, GraduationCap, MapPin, PenLine, ShieldPlus, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { calculateDoctorProfileCompletion, getCurrentDoctorProfile, getCurrentUser } from "@/lib/data/repository";

export default async function DoctorProfilePage() {
  const user = await getCurrentUser("doctor");
  const profile = user ? await getCurrentDoctorProfile() : null;
  const profileCompletion = calculateDoctorProfileCompletion(profile);
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || user?.full_name || "MedMatch";
  const profilePhotoUrl =
    profile?.profile_photo_path && process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/doctor-profile-photos/${profile.profile_photo_path}`
      : null;
  const profileRows = [
    {
      title: "Persönliche Daten",
      description: "Name, Kontaktdaten und weitere Angaben",
      icon: UserRound
    },
    {
      title: "Berufserfahrung",
      description: "Ihre bisherigen Positionen und Tätigkeiten",
      icon: BriefcaseBusiness
    },
    {
      title: "Ausbildung",
      description: "Studium, Abschlüsse und Weiterbildungen",
      icon: GraduationCap
    },
    {
      title: "Fortbildungen",
      description: "Zertifikate und absolvierte Weiterbildungen",
      icon: BadgeCheck
    },
    {
      title: "Medizinische Zulassung",
      description: "Approbation und weitere Zulassungen",
      icon: ShieldPlus
    }
  ];

  return (
    <DashboardShell
      role="doctor"
      title="Profil"
      description="Pflegen Sie Ihr Profil wie einen strukturierten Lebenslauf und halten Sie alle beruflichen Angaben aktuell."
    >
      <div className="space-y-5 md:hidden">
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-4">
            {profilePhotoUrl ? (
              <img src={profilePhotoUrl} alt="Profilbild" className="h-24 w-24 rounded-full object-cover shadow-sm" />
            ) : (
              <span className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <UserRound className="h-10 w-10" />
              </span>
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-950">{fullName}</h1>
              {profile ? (
                <div className="space-y-1 text-sm text-slate-600">
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">Standort: {[profile.city, profile.country].filter(Boolean).join(", ")}</span>
                  </p>
                  {profile.specialty ? <p className="truncate">Fachrichtung: {profile.specialty}</p> : null}
                  {profile.current_position ? <p className="truncate">Aktuelle Position: {profile.current_position}</p> : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-base font-semibold text-slate-950">Profilvollständigkeit</p>
              <p className="text-3xl font-semibold text-primary">{profileCompletion}%</p>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-primary" style={{ width: `${profileCompletion}%` }} />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          {profileRows.map((row) => {
            const Icon = row.icon;

            return (
              <a
                key={row.title}
                href="#profile-form"
                className="flex min-h-20 items-center gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-semibold leading-tight text-slate-950">{row.title}</span>
                  <span className="mt-1 block truncate text-sm text-slate-600">{row.description}</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-900" />
              </a>
            );
          })}
        </section>

        <Button asChild className="min-h-12 w-full rounded-2xl text-base">
          <a href="#profile-form">
            <PenLine className="mr-2 h-5 w-5" />
            Profil bearbeiten
          </a>
        </Button>
      </div>

        <Card id="profile-form">
        <CardHeader><CardTitle>Profil bearbeiten</CardTitle></CardHeader>
        <CardContent>
          <DoctorProfileForm profile={profile} email={user?.email ?? ""} />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
