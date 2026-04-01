import type { ReactNode } from "react";

export function SlateProfileTemplate({
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
    <div className="min-h-[265mm] w-full bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_18%)] px-7 py-8">
      <header className="border-b border-slate-300 pb-8">
        <div className="grid grid-cols-[minmax(0,1fr)_148px] items-start gap-7">
          <div className="space-y-4">
            <div className="space-y-2">{headerIdentity}</div>
            {personalInfo ? <div className="text-sm text-slate-600">{personalInfo}</div> : null}
          </div>

          <div className="justify-self-end">
            <div className="h-[148px] w-[148px] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white [&_div]:h-full [&_div]:w-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img]:object-center">
              {headerPhoto}
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-6 pt-8">
        {sections.map((section, index) => (
          <div
            key={`slate-profile-section-${index}`}
            className="border-b border-slate-200 pb-6 last:border-b-0 last:pb-0"
          >
            {section}
          </div>
        ))}
      </div>
    </div>
  );
}
