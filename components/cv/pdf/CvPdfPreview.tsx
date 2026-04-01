"use client";

import dynamic from "next/dynamic";

import {
  CvDocument,
  type PdfCvTemplateKey
} from "@/components/cv/pdf/CvDocument";
import type { CvPdfData } from "@/components/cv/pdf/buildCvPdfData";

const PdfViewer = dynamic(
  () => import("@react-pdf/renderer").then((module) => module.PDFViewer),
  { ssr: false }
);

export function CvPdfPreview({
  data,
  template = "modern"
}: {
  data: CvPdfData;
  template?: PdfCvTemplateKey;
}) {
  return (
    <div className="w-full overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <PdfViewer
        showToolbar={false}
        style={{
          width: "100%",
          height: "calc(100vh - 180px)",
          minHeight: 960,
          border: "none"
        }}
      >
        <CvDocument data={data} template={template} />
      </PdfViewer>
    </div>
  );
}
