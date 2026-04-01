import type { ReactNode } from "react";

export function NordHeaderTemplate({
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
    <div className="min-h-[265mm] w-full overflow-hidden bg-white">
      <header className="bg-slate-900 px-7 py-8 text-white">
        <div className="grid grid-cols-[minmax(0,1fr)_148px] items-start gap-7">
          <div className="space-y-4">
            <div className="[&_h3]:text-white [&_p]:text-slate-200">{headerIdentity}</div>
            {personalInfo ? (
              <div className="[&_p]:text-slate-300 [&_span]:text-slate-300">{personalInfo}</div>
            ) : null}
          </div>

          <div className="justify-self-end h-[148px] w-[148px] overflow-hidden rounded-[1.25rem] border border-white/10 bg-slate-800 [&_div]:h-full [&_div]:w-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img]:object-center">
            {headerPhoto}
          </div>
        </div>
      </header>

      <div className="space-y-6 px-7 py-8">
        {sections.map((section, index) => (
          <div
            key={`nord-header-section-${index}`}
            className="border-b border-slate-200 pb-6 last:border-b-0 last:pb-0"
          >
            {section}
          </div>
        ))}
      </div>
    </div>
  );
}
