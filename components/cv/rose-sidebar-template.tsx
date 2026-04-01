import type { ReactNode } from "react";

export function RoseSidebarTemplate({
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
      <div className="grid min-h-[265mm] grid-cols-[30%_70%] gap-0">
        <aside className="space-y-6 bg-rose-50 px-6 py-8">
          <div className="mx-auto h-32 w-32 overflow-hidden rounded-[999px] border border-rose-100 bg-white [&_div]:h-full [&_div]:w-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img]:object-center">
            {headerPhoto}
          </div>
          {personalInfo ? (
            <div className="rounded-[1.25rem] bg-white/70 p-5 text-sm text-slate-700">
              {personalInfo}
            </div>
          ) : null}
          {sidebarSections.length ? <div className="space-y-5">{sidebarSections}</div> : null}
        </aside>

        <div className="space-y-7 px-8 py-8">
          <header className="border-b border-rose-100 pb-6">
            <div className="space-y-2">{headerIdentity}</div>
          </header>
          <div className="space-y-6">{mainSections}</div>
        </div>
      </div>
    </div>
  );
}
