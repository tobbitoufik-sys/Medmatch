import type { ReactNode } from "react";

export function BlueLedgerTemplate({
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
    <div className="min-h-[265mm] w-full overflow-hidden bg-white">
      <div className="grid min-h-[265mm] grid-cols-[29%_71%]">
        <aside className="space-y-6 bg-[#16324f] px-6 py-8 text-white">
          <div className="h-[150px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/10 [&_div]:h-full [&_div]:w-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img]:object-center">
            {headerPhoto}
          </div>
          <div className="space-y-4 [&_h3]:text-white [&_p]:text-slate-100 [&_.text-slate-400]:text-slate-200 [&_.text-slate-500]:text-slate-200 [&_.text-slate-600]:text-slate-100">
            <div className="[&_h3]:text-white [&_p]:text-slate-100">{personalInfo}</div>
            {sidebarSections}
          </div>
        </aside>

        <div className="space-y-7 px-8 py-8">
          <header className="border-b border-slate-200 pb-6">
            <div className="space-y-2">{headerIdentity}</div>
          </header>
          <div className="space-y-6">{mainSections}</div>
        </div>
      </div>
    </div>
  );
}
