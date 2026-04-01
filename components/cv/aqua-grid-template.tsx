import type { ReactNode } from "react";

export function AquaGridTemplate({
  headerPhoto,
  headerIdentity,
  personalInfo,
  leftColumnSections,
  rightColumnSections
}: {
  headerPhoto: ReactNode;
  headerIdentity: ReactNode;
  personalInfo: ReactNode;
  leftColumnSections: ReactNode[];
  rightColumnSections: ReactNode[];
}) {
  return (
    <div className="min-h-[265mm] w-full overflow-hidden bg-[linear-gradient(180deg,#dff7f7_0%,#eefcfc_14%,#ffffff_34%)]">
      <header className="bg-[linear-gradient(135deg,#7ed4d6_0%,#a6e4e6_100%)] px-7 pb-7 pt-8">
        <div className="grid grid-cols-[148px_minmax(0,1fr)] items-end gap-7">
          <div className="h-[148px] w-[148px] overflow-hidden rounded-[1.5rem] border border-white/40 bg-white/30 [&_div]:h-full [&_div]:w-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img]:object-center">
            {headerPhoto}
          </div>
          <div className="space-y-3">
            <div className="space-y-2">{headerIdentity}</div>
            {personalInfo ? <div className="text-sm text-slate-700">{personalInfo}</div> : null}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-6 px-7 py-8">
        <div className="space-y-6">{leftColumnSections}</div>
        <div className="space-y-6">{rightColumnSections}</div>
      </div>
    </div>
  );
}
