import type { ReactNode } from "react";

export function ClinicEdgeDocument({
  headerPhoto,
  contactInfo,
  languagesSection,
  sidebarAdditionalSection,
  headerIdentity,
  mainSections
}: {
  headerPhoto: ReactNode;
  contactInfo: ReactNode;
  languagesSection?: ReactNode;
  sidebarAdditionalSection?: ReactNode;
  headerIdentity: ReactNode;
  mainSections: ReactNode[];
}) {
  return (
    <div className="clinic-edge-doc mx-auto w-full overflow-hidden rounded-[30px] border border-[#d5ddd9] bg-[#f2f1ed] shadow-[0_24px_80px_rgba(15,23,42,0.10)] print:h-[273mm] print:min-h-[273mm] print:break-inside-avoid print:rounded-none print:border-[#d8ddd9] print:shadow-none print:[page-break-inside:avoid]">
      <style>{`
        .clinic-edge-doc {
          width: 100%;
          background: #f2f1ed;
          border: 1px solid #d5ddd9;
          overflow: hidden;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
        .clinic-edge-grid {
          display: grid;
          grid-template-columns: 34% 66%;
          min-height: 297mm;
        }
        .clinic-edge-sidebar,
        .clinic-edge-main,
        .clinic-edge-main-inner,
        .clinic-edge-sidebar-inner,
        .clinic-edge-sidebar-lower {
          box-sizing: border-box;
        }
        .clinic-edge-sidebar {
          position: relative;
          display: flex;
          flex-direction: column;
          min-height: 297mm;
          padding: 40px 32px;
          background: linear-gradient(180deg, #cad5d1 0%, #d8e1dd 32%, #e4ebe8 64%, #ecf1ee 100%);
        }
        .clinic-edge-sidebar-inner {
          position: relative;
          display: flex;
          flex: 1 1 auto;
          flex-direction: column;
        }
        .clinic-edge-sidebar-top {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        .clinic-edge-sidebar-divider {
          height: 1px;
          background: rgba(15,23,42,0.12);
        }
        .clinic-edge-sidebar-lower {
          display: flex;
          flex: 1 1 auto;
          flex-direction: column;
          justify-content: space-between;
          gap: 32px;
          margin-top: 32px;
        }
        .clinic-edge-sidebar-stack {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        .clinic-edge-contact-card {
          border: 1px solid rgba(255,255,255,0.5);
          border-radius: 24px;
          background: rgba(255,255,255,0.2);
          padding: 20px;
          backdrop-filter: blur(1px);
        }
        .clinic-edge-topwash {
          position: absolute;
          inset: 0 0 auto 0;
          height: 7rem;
          background: linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0) 100%);
        }
        .clinic-edge-photo-frame {
          overflow: hidden;
          border-radius: 30px;
          border: 1px solid rgba(255,255,255,0.7);
          background: linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.18) 100%);
          box-shadow: 0 24px 48px rgba(15,23,42,0.12);
        }
        .clinic-edge-photo-inner {
          overflow: hidden;
          border-radius: 24px;
          background: #d8e2de;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.35);
        }
        .clinic-edge-sidebar .sidebar-photo,
        .clinic-edge-sidebar .sidebar-photo-fallback {
          width: 100%;
          height: 320px;
          border-radius: 24px;
        }
        .clinic-edge-sidebar .sidebar-photo {
          object-fit: cover;
          object-position: center;
          display: block;
        }
        .clinic-edge-sidebar .sidebar-photo-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, #cfd8d4 0%, #bcc9c4 100%);
          color: #475569;
          font-size: 52px;
          font-weight: 600;
        }
        .clinic-edge-sidebar .sidebar-section {
          margin-top: 0;
          padding-top: 24px;
          border-top: 1px solid rgba(15,23,42,0.1);
        }
        .clinic-edge-sidebar .sidebar-section:first-of-type {
          padding-top: 0;
          border-top: 0;
        }
        .clinic-edge-sidebar .accent-title {
          margin: 0 0 12px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #48615f;
        }
        .clinic-edge-sidebar .info {
          margin-top: 0;
          font-size: 13.5px;
          line-height: 1.7;
          color: #334155;
        }
        .clinic-edge-sidebar .entry-bullets {
          margin: 0;
          padding-left: 20px;
          font-size: 13.5px;
          line-height: 1.6;
          color: #334155;
        }
        .clinic-edge-main {
          min-height: 297mm;
          padding: 44px;
          background: linear-gradient(180deg, #fffefd 0%, #ffffff 38%, #fbfbfa 100%);
        }
        .clinic-edge-main-inner {
          display: flex;
          min-height: 297mm;
          flex-direction: column;
        }
        .clinic-edge-header {
          padding-bottom: 40px;
          border-bottom: 1px solid rgba(226,232,240,0.9);
        }
        .clinic-edge-header-line {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .clinic-edge-header-rule {
          height: 1px;
          flex: 1 1 auto;
          background: #e2e8f0;
        }
        .clinic-edge-kicker {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.38em;
          text-transform: uppercase;
          color: #94a3b8;
        }
        .clinic-edge-identity {
          max-width: 92%;
          margin-top: 24px;
        }
        .clinic-edge-content {
          flex: 1 1 auto;
          padding-top: 40px;
        }
        .clinic-edge-content > * + * {
          margin-top: 36px;
        }
        .clinic-edge-main .name-large {
          margin: 0;
          font-size: 2.9rem;
          font-weight: 600;
          line-height: 1;
          letter-spacing: -0.045em;
          color: #0f172a;
        }
        .clinic-edge-main .subtitle {
          margin: 0;
          font-size: 0.99rem;
          line-height: 1.75;
          color: #475569;
        }
        .clinic-edge-main .section {
          padding-top: 28px;
          border-top: 1px solid rgba(226,232,240,0.9);
        }
        .clinic-edge-main .section-title {
          margin: 0 0 12px;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: #64748b;
        }
        .clinic-edge-main .entry {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: 0;
        }
        .clinic-edge-main .entry-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }
        .clinic-edge-main .entry-title {
          margin: 0;
          font-size: 1.04rem;
          font-weight: 600;
          line-height: 1.5;
          color: #0f172a;
        }
        .clinic-edge-main .entry-subtitle {
          margin: 4px 0 0;
          font-size: 0.98rem;
          line-height: 1.75;
          color: #475569;
        }
        .clinic-edge-main .entry-meta {
          margin: 4px 0 0;
          font-size: 0.93rem;
          line-height: 1.6;
          color: #64748b;
        }
        .clinic-edge-main .entry-date {
          flex-shrink: 0;
          white-space: nowrap;
          font-size: 0.82rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #64748b;
        }
        .clinic-edge-main .entry-bullets {
          margin: 12px 0 0;
          padding-left: 20px;
          font-size: 0.95rem;
          line-height: 1.75;
          color: #475569;
        }
        @media print {
          .clinic-edge-doc {
            height: 273mm;
            min-height: 273mm;
            border-radius: 0;
            box-shadow: none;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .clinic-edge-grid,
          .clinic-edge-sidebar,
          .clinic-edge-main,
          .clinic-edge-main-inner,
          .clinic-edge-sidebar-inner,
          .clinic-edge-sidebar-lower,
          .clinic-edge-content {
            height: 273mm;
            min-height: 273mm;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .clinic-edge-sidebar {
            padding: 40px 32px;
          }
          .clinic-edge-main {
            padding: 44px;
          }
        }
      `}</style>
      <div className="clinic-edge-grid grid min-h-[297mm] grid-cols-[34%_66%] print:h-full print:min-h-[273mm] print:break-inside-avoid print:[page-break-inside:avoid]">
        <aside
          className={[
            "clinic-edge-sidebar relative flex min-h-[297mm] flex-col overflow-hidden bg-[linear-gradient(180deg,#cad5d1_0%,#d8e1dd_32%,#e4ebe8_64%,#ecf1ee_100%)] px-8 py-10 print:h-full print:min-h-[273mm] print:break-inside-avoid print:[page-break-inside:avoid]",
            "[&_.sidebar-photo]:h-[320px] [&_.sidebar-photo]:w-full [&_.sidebar-photo]:rounded-[24px] [&_.sidebar-photo]:object-cover [&_.sidebar-photo]:object-center",
            "[&_.sidebar-photo-fallback]:flex [&_.sidebar-photo-fallback]:h-[320px] [&_.sidebar-photo-fallback]:w-full [&_.sidebar-photo-fallback]:items-center [&_.sidebar-photo-fallback]:justify-center [&_.sidebar-photo-fallback]:rounded-[24px] [&_.sidebar-photo-fallback]:bg-[linear-gradient(180deg,#cfd8d4_0%,#bcc9c4_100%)] [&_.sidebar-photo-fallback]:text-[52px] [&_.sidebar-photo-fallback]:font-semibold [&_.sidebar-photo-fallback]:text-slate-600",
            "[&_.sidebar-section]:mt-0 [&_.sidebar-section]:border-t [&_.sidebar-section]:border-slate-800/10 [&_.sidebar-section]:pt-6 [&_.sidebar-section:first-of-type]:border-t-0 [&_.sidebar-section:first-of-type]:pt-0",
            "[&_.accent-title]:mb-3 [&_.accent-title]:text-[11px] [&_.accent-title]:font-semibold [&_.accent-title]:uppercase [&_.accent-title]:tracking-[0.28em] [&_.accent-title]:text-[#48615f]",
            "[&_.info]:text-[13.5px] [&_.info]:leading-6 [&_.info]:text-slate-700",
            "[&_.entry-bullets]:m-0 [&_.entry-bullets]:pl-5 [&_.entry-bullets]:text-[13.5px] [&_.entry-bullets]:leading-6 [&_.entry-bullets]:text-slate-700 [&_.entry-bullets_li]:mt-1"
          ].join(" ")}
        >
          <div
            aria-hidden="true"
            className="clinic-edge-topwash absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,0.34)_0%,rgba(255,255,255,0)_100%)]"
          />

          <div className="clinic-edge-sidebar-inner relative flex flex-1 flex-col">
            <div className="clinic-edge-sidebar-top space-y-7">
              <div className="clinic-edge-photo-frame overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.42)_0%,rgba(255,255,255,0.18)_100%)] p-3 shadow-[0_24px_48px_rgba(15,23,42,0.12)]">
                <div className="clinic-edge-photo-inner overflow-hidden rounded-[24px] bg-[#d8e2de] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
                  {headerPhoto}
                </div>
              </div>
              <div className="clinic-edge-sidebar-divider h-px bg-slate-800/12" />
            </div>

            <div className="clinic-edge-sidebar-lower mt-8 flex flex-1 flex-col justify-between gap-8">
              <div className="clinic-edge-sidebar-stack space-y-7">
                <div className="clinic-edge-contact-card rounded-[24px] border border-white/50 bg-white/20 px-5 py-5 backdrop-blur-[1px]">
                  {contactInfo}
                </div>

                {languagesSection ? (
                  <div className="border-t border-slate-800/10 pt-6">{languagesSection}</div>
                ) : null}
              </div>

              {sidebarAdditionalSection ? (
                <div className="border-t border-slate-800/10 pt-6">{sidebarAdditionalSection}</div>
              ) : (
                <div className="h-12 border-t border-slate-800/10" />
              )}
            </div>
          </div>
        </aside>

        <div
          className={[
            "clinic-edge-main bg-[linear-gradient(180deg,#fffefd_0%,#ffffff_38%,#fbfbfa_100%)] px-11 py-11 print:h-full print:min-h-[273mm] print:break-inside-avoid print:[page-break-inside:avoid]",
            "[&_.name-large]:m-0 [&_.name-large]:text-[2.9rem] [&_.name-large]:font-semibold [&_.name-large]:tracking-[-0.045em] [&_.name-large]:leading-[1] [&_.name-large]:text-slate-950",
            "[&_.subtitle]:m-0 [&_.subtitle]:text-[0.99rem] [&_.subtitle]:leading-7 [&_.subtitle]:text-slate-600",
            "[&_.section]:space-y-5 [&_.section]:border-t [&_.section]:border-slate-200/80 [&_.section]:pt-7",
            "[&_.section-title]:m-0 [&_.section-title]:text-[0.8rem] [&_.section-title]:font-semibold [&_.section-title]:uppercase [&_.section-title]:tracking-[0.24em] [&_.section-title]:text-slate-500",
            "[&_.entry]:mb-0 [&_.entry]:border-b-0 [&_.entry]:pb-0",
            "[&_.entry-top]:flex [&_.entry-top]:items-start [&_.entry-top]:justify-between [&_.entry-top]:gap-5",
            "[&_.entry-title]:m-0 [&_.entry-title]:text-[1.04rem] [&_.entry-title]:font-semibold [&_.entry-title]:leading-6 [&_.entry-title]:text-slate-900",
            "[&_.entry-subtitle]:mt-1 [&_.entry-subtitle]:text-[0.98rem] [&_.entry-subtitle]:leading-7 [&_.entry-subtitle]:text-slate-600",
            "[&_.entry-meta]:mt-1 [&_.entry-meta]:text-[0.93rem] [&_.entry-meta]:leading-6 [&_.entry-meta]:text-slate-500",
            "[&_.entry-date]:shrink-0 [&_.entry-date]:whitespace-nowrap [&_.entry-date]:text-[0.82rem] [&_.entry-date]:font-medium [&_.entry-date]:uppercase [&_.entry-date]:tracking-[0.08em] [&_.entry-date]:text-slate-500",
            "[&_.entry-bullets]:mt-3 [&_.entry-bullets]:pl-5 [&_.entry-bullets]:text-[0.95rem] [&_.entry-bullets]:leading-7 [&_.entry-bullets]:text-slate-600 [&_.entry-bullets_li]:mt-1"
          ].join(" ")}
        >
          <div className="clinic-edge-main-inner flex min-h-[297mm] flex-col print:h-full print:min-h-[273mm]">
            <header className="clinic-edge-header space-y-6 border-b border-slate-200/90 pb-10">
              <div className="clinic-edge-header-line flex items-center gap-3">
                <div className="clinic-edge-header-rule h-px flex-1 bg-slate-200" />
                <div className="clinic-edge-kicker text-[11px] font-semibold uppercase tracking-[0.38em] text-slate-400">
                  Lebenslauf
                </div>
              </div>

              <div className="clinic-edge-identity max-w-[92%] space-y-4 [&_h1]:text-[2.9rem] [&_h1]:font-semibold [&_h1]:tracking-[-0.045em] [&_h1]:leading-[1] [&_h1]:text-slate-950 [&_h2]:text-[2.9rem] [&_h2]:font-semibold [&_h2]:tracking-[-0.045em] [&_h2]:leading-[1] [&_h2]:text-slate-950 [&_p]:text-[0.99rem] [&_p]:leading-7 [&_p]:text-slate-600">
                {headerIdentity}
              </div>
            </header>

            <div className="clinic-edge-content flex-1 space-y-9 pt-10">{mainSections}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
