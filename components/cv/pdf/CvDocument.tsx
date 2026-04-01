import type { DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";

import { ClinicEdgePdfDocument } from "@/components/cv/pdf/ClinicEdgePdfDocument";
import type { CvPdfData } from "@/components/cv/pdf/buildCvPdfData";
import { ModernPdfDocument } from "@/components/cv/pdf/ModernPdfDocument";

export type PdfCvTemplateKey = "modern" | "clinicEdge";

export function resolvePdfCvTemplate(
  template?: string | string[] | null
): PdfCvTemplateKey {
  const value = Array.isArray(template) ? template[0] : template;

  return value === "clinicEdge" ? "clinicEdge" : "modern";
}

export function CvDocument({
  data,
  template = "modern"
}: {
  data: CvPdfData;
  template?: PdfCvTemplateKey;
}): ReactElement<DocumentProps> {
  if (template === "clinicEdge") {
    return <ClinicEdgePdfDocument data={data} />;
  }

  return <ModernPdfDocument data={data} />;
}
