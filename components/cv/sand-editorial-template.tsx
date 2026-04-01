import type { ReactNode } from "react";

export function SandEditorialTemplate({
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
    <div className="min-h-[265mm] w-full bg-[linear-gradient(180deg,#f5efe5_0%,#fcfaf6_18%,#ffffff_40%)] px-7 py-8">
      <div className="grid grid-cols-[30%_70%] gap-8">
        <aside className="space-y-6">
          <div className="h-[190px] overflow-hidden rounded-[1.5rem] bg-[#eadfcd] [&_div]:h-full [&_div]:w-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img]:object-center">
            {headerPhoto}
          </div>
          {personalInfo ? (
            <div className="space-y-3 rounded-[1.25rem] bg-white/70 p-5 text-sm text-slate-700">
              {personalInfo}
            </div>
          ) : null}
          {sidebarSections.length ? <div className="space-y-5">{sidebarSections}</div> : null}
        </aside>

        <div className="space-y-8">
          <header className="border-b border-[#dccdb7] pb-7">
            <div className="space-y-2">{headerIdentity}</div>
          </header>
          <div className="space-y-6">{mainSections}</div>
        </div>
      </div>
    </div>
  );
}
