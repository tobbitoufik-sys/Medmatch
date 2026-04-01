import { PdfTemplateDocument } from "@/components/cv/pdf/PdfPrimitives";
import type { CvPdfData } from "@/components/cv/pdf/buildCvPdfData";
import { clinicEdgePdfTemplateConfig } from "@/components/cv/pdf/pdfTemplateConfig";

export function ClinicEdgePdfDocument({ data }: { data: CvPdfData }) {
  return <PdfTemplateDocument data={data} config={clinicEdgePdfTemplateConfig} />;
}
