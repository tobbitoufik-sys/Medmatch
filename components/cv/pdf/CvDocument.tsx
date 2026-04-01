import type { DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";

import { ClinicEdgePdfDocument } from "@/components/cv/pdf/ClinicEdgePdfDocument";
import type { CvPdfData } from "@/components/cv/pdf/buildCvPdfData";
import { PdfTemplateDocument } from "@/components/cv/pdf/PdfPrimitives";
import {
  clinicEdgePdfTemplateConfig,
  medmatchPremiumPdfTemplateConfig,
  modernPdfTemplateConfig,
  slateProfilePdfTemplateConfig,
  softTimelinePdfTemplateConfig
} from "@/components/cv/pdf/pdfTemplateConfig";

export type PdfCvTemplateKey =
  | "modern"
  | "medmatchPremium"
  | "clinicEdge"
  | "softTimeline"
  | "slateProfile";

export function resolvePdfCvTemplate(
  template?: string | string[] | null
): PdfCvTemplateKey {
  const value = Array.isArray(template) ? template[0] : template;

  if (value === "medmatchPremium") {
    return "medmatchPremium";
  }

  if (value === "softTimeline") {
    return "softTimeline";
  }

  if (value === "slateProfile") {
    return "slateProfile";
  }

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

  if (template === "medmatchPremium") {
    return <PdfTemplateDocument data={data} config={medmatchPremiumPdfTemplateConfig} />;
  }

  if (template === "softTimeline") {
    return <PdfTemplateDocument data={data} config={softTimelinePdfTemplateConfig} />;
  }

  if (template === "slateProfile") {
    return <PdfTemplateDocument data={data} config={slateProfilePdfTemplateConfig} />;
  }

  return <PdfTemplateDocument data={data} config={modernPdfTemplateConfig} />;
}
