import type { ReactNode } from "react";

export function MonoFrameTemplate({
  headerPhoto,
  headerIdentity,
  personalInfo,
  sidebarSections,
  mainSections
}: {
  headerPhoto: ReactNode;
  headerIdentity: ReactNode;
  personalInfo: ReactNode;
  sidebarSections: ReactNode[];
  mainSections: ReactNode[];
}) {
  return (
    <div className="min-h-[265mm] w-full bg-[#f5f5f5] p-6">
      <div className="min-h-[calc(265mm-48px)] border border-slate-300 bg-white p-6">
        <header className="grid grid-cols-[128px_minmax(0,1fr)] items-center gap-5">
          <div className="h-32 w-32 overflow-hidden rounded-[999px] border border-slate-300 bg-slate-100 [&_div]:h-full [&_div]:w-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img]:object-center">
            {headerPhoto}
          </div>
          <div className="rounded-[1.5rem] bg-slate-900 px-6 py-5 text-white [&_h3]:text-white [&_p]:text-slate-200">
            {headerIdentity}
          </div>
        </header>

        <div className="grid grid-cols-[28%_72%] gap-8 pt-8">
          <aside className="space-y-5 border-r border-slate-200 pr-6">
            {personalInfo ? <div className="text-sm text-slate-700">{personalInfo}</div> : null}
            {sidebarSections}
          </aside>

          <div className="space-y-6">{mainSections}</div>
        </div>
      </div>
    </div>
  );
}
