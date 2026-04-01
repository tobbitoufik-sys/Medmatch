import Link from "next/link";
import { redirect } from "next/navigation";

import { CvLayoutEditorV2 } from "@/components/cv/CvLayoutEditorV2";
import { isCvTemplateKey, type CvTemplateKey } from "@/components/cv/template-registry";
import { Button } from "@/components/ui/button";
import { normalizeCvSectionOrder } from "@/lib/cv/constants";
import { buildDoctorCvModel } from "@/lib/cv/build-doctor-cv-model";
import type { CvSectionKey } from "@/types";
import {
  getCurrentDoctorCvLayout,
  getCurrentDoctorProfile,
  getCurrentUser
} from "@/lib/data/repository";

export default async function DoctorCvV2Page({
  searchParams
}: {
  searchParams?: Promise<{ template?: string | string[] }>;
}) {
  const user = await getCurrentUser("doctor");

  if (!user) {
    redirect("/");
  }

  if (user.role !== "doctor") {
    redirect("/dashboard");
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const templateValue = Array.isArray(resolvedSearchParams.template)
    ? resolvedSearchParams.template[0]
    : resolvedSearchParams.template;
  const selectedTemplate: CvTemplateKey =
    templateValue && isCvTemplateKey(templateValue) ? templateValue : "modern";
  const profile = await getCurrentDoctorProfile();
  const layout = await getCurrentDoctorCvLayout(selectedTemplate);
  const initialItemVisibility =
    layout && typeof (layout as { item_visibility?: unknown }).item_visibility === "object" &&
    !Array.isArray((layout as { item_visibility?: unknown }).item_visibility) &&
    (layout as { item_visibility?: unknown }).item_visibility !== null
      ? ((layout as { item_visibility?: unknown }).item_visibility as Record<string, boolean>)
      : {};
  const cvModel = buildDoctorCvModel({
    profile,
    photoPresentation: layout?.photo_presentation,
    fallbackName: user.full_name,
    email: user.email,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
  });

  const availableSectionKeys = [
    cvModel.workExperience.length ? "work_experience" : null,
    cvModel.education.length ? "education" : null,
    cvModel.qualifications.length ? "qualifications" : null,
    cvModel.languages.length ? "languages" : null,
    cvModel.trainings.length ? "trainings" : null,
    cvModel.additionalSections.length ? "additional_sections" : null
  ].filter((value): value is CvSectionKey => Boolean(value));

  const initialSectionOrder = normalizeCvSectionOrder(
    layout?.section_order,
    availableSectionKeys
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#edf2f7_0%,#f8fafc_18%,#eef4f7_100%)]">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline">
              <Link href="/dashboard/doctor">Zuruck zum Dashboard</Link>
            </Button>

            <div className="space-y-1">
              <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                Lebenslauf Builder V2
              </h1>
              <p className="text-sm text-slate-600">
                Sauberer, isolierter Editor ohne eingebettete Vorschau.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild variant="outline">
              <Link href="/dashboard/doctor/cv">Zuruck zum bisherigen Editor</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/doctor/profile">Profildaten bearbeiten</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1680px] justify-center px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <div className="w-full max-w-[1380px] rounded-[2rem] border border-slate-200/80 bg-white/75 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1120px] rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.10)]">
            <div className="p-6 sm:p-9 lg:p-12">
              <CvLayoutEditorV2
                cvModel={cvModel}
                experiences={profile?.experiences ?? []}
                initialItemVisibility={initialItemVisibility}
                initialSectionOrder={initialSectionOrder}
                initialSelectedTemplate={selectedTemplate}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
