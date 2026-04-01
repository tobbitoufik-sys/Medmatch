import type { ReactNode } from "react";
import { ClinicEdgeDocument } from "@/components/cv/clinic-edge-document";

export function ClinicEdgePreview({
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
    <div className="clinic-edge-preview-shell">
      <style>{`
        .clinic-edge-preview-shell {
          width: 100%;
        }
        .clinic-edge-preview-shell .clinic-edge-doc {
          min-height: 297mm;
          border-radius: 32px;
          border-color: #d7dfdc;
          background: #f4f3ef;
          box-shadow: 0 32px 95px rgba(15,23,42,0.12);
        }
        .clinic-edge-preview-shell .clinic-edge-grid {
          min-height: 297mm;
          grid-template-columns: 35% 65%;
        }
        .clinic-edge-preview-shell .clinic-edge-sidebar {
          min-height: 297mm;
          padding: 44px 34px;
          background: linear-gradient(180deg, #c8d3cf 0%, #d6dfdb 30%, #e3eae7 66%, #edf1ef 100%);
        }
        .clinic-edge-preview-shell .clinic-edge-topwash {
          height: 8rem;
        }
        .clinic-edge-preview-shell .clinic-edge-photo-frame {
          border-radius: 32px;
          box-shadow: 0 28px 52px rgba(15,23,42,0.14);
        }
        .clinic-edge-preview-shell .clinic-edge-photo-inner {
          border-radius: 26px;
        }
        .clinic-edge-preview-shell .clinic-edge-sidebar .sidebar-photo,
        .clinic-edge-preview-shell .clinic-edge-sidebar .sidebar-photo-fallback {
          height: 368px;
          border-radius: 26px;
        }
        .clinic-edge-preview-shell .clinic-edge-sidebar-lower {
          gap: 24px;
          margin-top: 28px;
        }
        .clinic-edge-preview-shell .clinic-edge-sidebar-stack {
          gap: 24px;
        }
        .clinic-edge-preview-shell .clinic-edge-contact-card {
          padding: 22px;
          border-radius: 26px;
          background: rgba(255,255,255,0.24);
        }
        .clinic-edge-preview-shell .clinic-edge-sidebar .sidebar-section {
          padding-top: 22px;
        }
        .clinic-edge-preview-shell .clinic-edge-sidebar .accent-title {
          margin-bottom: 14px;
          color: #3f5d5b;
        }
        .clinic-edge-preview-shell .clinic-edge-main {
          min-height: 297mm;
          padding: 48px 46px;
          background: linear-gradient(180deg, #fffefd 0%, #ffffff 42%, #fcfcfb 100%);
        }
        .clinic-edge-preview-shell .clinic-edge-header {
          padding-bottom: 42px;
        }
        .clinic-edge-preview-shell .clinic-edge-identity {
          margin-top: 26px;
        }
        .clinic-edge-preview-shell .clinic-edge-main .name-large {
          font-size: 3.15rem;
          line-height: 0.98;
        }
        .clinic-edge-preview-shell .clinic-edge-main .subtitle {
          font-size: 1rem;
          line-height: 1.8;
        }
        .clinic-edge-preview-shell .clinic-edge-content {
          padding-top: 42px;
        }
        .clinic-edge-preview-shell .clinic-edge-content > * + * {
          margin-top: 34px;
        }
        .clinic-edge-preview-shell .clinic-edge-main .section-title {
          margin-bottom: 14px;
        }
        .clinic-edge-preview-shell .clinic-edge-main .entry-title {
          font-size: 1.06rem;
        }
        .clinic-edge-preview-shell .clinic-edge-main .entry-date {
          font-size: 0.8rem;
        }
      `}</style>
      <ClinicEdgeDocument
        headerPhoto={headerPhoto}
        contactInfo={contactInfo}
        languagesSection={languagesSection}
        sidebarAdditionalSection={sidebarAdditionalSection}
        headerIdentity={headerIdentity}
        mainSections={mainSections}
      />
    </div>
  );
}
