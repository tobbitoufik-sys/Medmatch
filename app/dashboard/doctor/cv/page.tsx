import { CvEditorClientShell } from "@/components/cv/CvEditorClientShell";
import { isCvTemplateKey, type CvTemplateKey } from "@/components/cv/template-registry";
import { normalizeCvSectionOrder } from "@/lib/cv/constants";
import { buildDoctorCvModel } from "@/lib/cv/build-doctor-cv-model";
import {
  getCurrentDoctorCvLayout,
  getCurrentDoctorProfile,
  getCurrentUser
} from "@/lib/data/repository";

export default async function DoctorCvPage({
  searchParams
}: {
  searchParams?: Promise<{ template?: string | string[] }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const templateValue = Array.isArray(resolvedSearchParams.template)
    ? resolvedSearchParams.template[0]
    : resolvedSearchParams.template;
  const selectedTemplate: CvTemplateKey =
    templateValue && isCvTemplateKey(templateValue) ? templateValue : "modern";

  const user = await getCurrentUser("doctor");
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
    fallbackName: user?.full_name,
    email: user?.email,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
  });

  const availableSectionKeys = [
    cvModel.workExperience.length ? "work_experience" : null,
    cvModel.education.length ? "education" : null,
    cvModel.qualifications.length ? "qualifications" : null,
    cvModel.languages.length ? "languages" : null,
    cvModel.trainings.length ? "trainings" : null,
    cvModel.additionalSections.length ? "additional_sections" : null
  ].filter(Boolean) as string[];

  if (cvModel.customBlock && (cvModel.customBlock.title || cvModel.customBlock.entries.length)) {
    availableSectionKeys.push("custom_block");
  }

  const initialSectionOrder = normalizeCvSectionOrder(
    layout?.section_order,
    availableSectionKeys as never
  ) as string[];

  return (
    <CvEditorClientShell
      cvModel={cvModel}
      experiences={profile?.experiences ?? []}
      initialItemVisibility={initialItemVisibility}
      initialSectionOrder={initialSectionOrder}
      initialSelectedTemplate={selectedTemplate}
    />
  );
}
