import { PdfTemplateDocument } from "@/components/cv/pdf/PdfPrimitives";
import type { CvPdfData } from "@/components/cv/pdf/buildCvPdfData";
import { modernPdfTemplateConfig } from "@/components/cv/pdf/pdfTemplateConfig";

export function ModernPdfDocument({ data }: { data: CvPdfData }) {
  return <PdfTemplateDocument data={data} config={modernPdfTemplateConfig} />;
}
