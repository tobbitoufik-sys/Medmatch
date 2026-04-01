import { renderToBuffer } from "@react-pdf/renderer";
import { NextRequest, NextResponse } from "next/server";

import {
  CvDocument,
  resolvePdfCvTemplate
} from "@/components/cv/pdf/CvDocument";
import { buildCvPdfData } from "@/components/cv/pdf/buildCvPdfData";
import { buildDoctorCvModel } from "@/lib/cv/build-doctor-cv-model";
import {
  getCurrentDoctorCvLayout,
  getCurrentDoctorProfile,
  getCurrentUser
} from "@/lib/data/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser("doctor");

  if (!user || user.role !== "doctor") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const selectedTemplate = resolvePdfCvTemplate(request.nextUrl.searchParams.get("template"));
  const profile = await getCurrentDoctorProfile();
  const layout = await getCurrentDoctorCvLayout(selectedTemplate);
  const cvModel = buildDoctorCvModel({
    profile,
    photoPresentation: layout?.photo_presentation,
    fallbackName: user.full_name,
    email: user.email,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
  });
  const pdfData = buildCvPdfData(cvModel, layout?.section_order as string[] | null | undefined);

  try {
    const pdfDocument = CvDocument({
      data: pdfData,
      template: selectedTemplate
    });
    const pdfBuffer = await renderToBuffer(pdfDocument);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="cv-${selectedTemplate}.pdf"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    console.error("[cv-export-pdf] Failed to generate CV PDF", {
      template: selectedTemplate,
      error
    });

    return new NextResponse("Failed to generate CV PDF.", { status: 500 });
  }
}
