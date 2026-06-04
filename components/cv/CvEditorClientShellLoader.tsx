"use client";

import dynamic from "next/dynamic";

import type { CvTemplateKey } from "@/components/cv/template-registry";
import type { DoctorCvModel, DoctorExperience } from "@/types";

type Props = {
  cvModel: DoctorCvModel;
  experiences: DoctorExperience[];
  initialItemVisibility: Record<string, boolean>;
  initialSectionOrder: string[];
  initialSelectedTemplate: CvTemplateKey;
};

const CvEditorClientShell = dynamic(
  () => import("@/components/cv/CvEditorClientShell").then((mod) => mod.CvEditorClientShell),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f3f6f8_0%,#fbfcfd_16%,#eef3f6_100%)]">
        <main className="mx-auto w-full max-w-[1360px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <div className="rounded-[2.25rem] border border-slate-200/80 bg-white/85 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-sm text-slate-600">CV-Editor wird geladen...</p>
          </div>
        </main>
      </div>
    )
  }
);

export function CvEditorClientShellLoader(props: Props) {
  return <CvEditorClientShell {...props} />;
}
