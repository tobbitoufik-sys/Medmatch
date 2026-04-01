import type { ReactNode } from "react";

export function ModernTemplate({
  headerPhoto,
  headerIdentity,
  personalInfo,
  sections
}: {
  headerPhoto: ReactNode;
  headerIdentity: ReactNode;
  personalInfo: ReactNode;
  sections: ReactNode[];
}) {
  return (
    <div className="min-h-[265mm] w-full bg-white px-7 py-8">
      <header className="border-b border-slate-200 pb-6">
        <div className="flex items-start gap-5">
          <div className="shrink-0">{headerPhoto}</div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="space-y-1">{headerIdentity}</div>
            {personalInfo}
          </div>
        </div>
      </header>

      <div className="space-y-6">{sections}</div>
    </div>
  );
}
