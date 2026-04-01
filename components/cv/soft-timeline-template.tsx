import type { ReactNode } from "react";

export function SoftTimelineTemplate({
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
    <div className="min-h-[265mm] w-full bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_24%)] px-7 py-8">
      <header className="border-b border-sky-100 pb-7">
        <div className="grid grid-cols-[148px_minmax(0,1fr)] items-start gap-7">
          <div className="h-[148px] w-[148px] overflow-hidden rounded-[1.5rem] bg-sky-50 [&_div]:h-full [&_div]:w-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img]:object-center">
            {headerPhoto}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-600">
                Lebenslauf
              </div>
              <div className="space-y-2">{headerIdentity}</div>
            </div>

            {personalInfo ? (
              <div className="rounded-[1.25rem] border border-sky-100 bg-sky-50/70 px-5 py-4">
                {personalInfo}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="space-y-6 pt-8">
        {sections.map((section, index) => (
          <section key={`soft-timeline-section-${index}`} className="grid grid-cols-[28px_minmax(0,1fr)] gap-4">
            <div className="flex justify-center">
              <div className="flex min-h-full flex-col items-center">
                <div className="mt-1 h-3 w-3 rounded-full border-2 border-sky-300 bg-white" />
                {index < sections.length - 1 ? <div className="mt-2 w-px flex-1 bg-sky-100" /> : null}
              </div>
            </div>

            <div className="rounded-[1rem] border border-slate-200 bg-white/95 px-5 py-5">
              {section}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
