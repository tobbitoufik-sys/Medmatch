import Link from "next/link";
import { redirect } from "next/navigation";

import { resolvePdfCvTemplate } from "@/components/cv/pdf/CvDocument";
import { CvPdfPreview } from "@/components/cv/pdf/CvPdfPreview";
import { buildCvPdfData } from "@/components/cv/pdf/buildCvPdfData";
import { buildDoctorCvModel } from "@/lib/cv/build-doctor-cv-model";
import {
  getCurrentDoctorCvLayout,
  getCurrentDoctorProfile,
  getCurrentUser
} from "@/lib/data/repository";

export default async function DoctorCvPdfPreviewPage({
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

  const profile = await getCurrentDoctorProfile();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedTemplate = resolvePdfCvTemplate(resolvedSearchParams?.template);
  const layout = await getCurrentDoctorCvLayout(selectedTemplate);
  const cvModel = buildDoctorCvModel({
    profile,
    photoPresentation: layout?.photo_presentation,
    fallbackName: user.full_name,
    email: user.email,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
  });
  const pdfData = buildCvPdfData(
    cvModel,
    layout?.section_order as string[] | null | undefined
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#edf2f7_0%,#f8fafc_18%,#eef4f7_100%)]">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/doctor/cv"
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
            >
              Zuruck zum Lebenslauf
            </Link>

            <div className="space-y-1">
              <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                PDF-Vorschau
              </h1>
              <p className="text-sm text-slate-600">
                Isolierte Vorschau des PDF-nativen Lebenslaufs.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <CvPdfPreview data={pdfData} template={selectedTemplate} />
      </main>
    </div>
  );
}
