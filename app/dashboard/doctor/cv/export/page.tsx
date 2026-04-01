import type { ReactNode } from "react";
import { AquaGridTemplate } from "@/components/cv/aqua-grid-template";
import { BlueLedgerTemplate } from "@/components/cv/blue-ledger-template";
import { ClinicEdgeDocument } from "@/components/cv/clinic-edge-document";
import { buildDoctorCvModel } from "@/lib/cv/build-doctor-cv-model";
import { normalizeCvSectionOrder } from "@/lib/cv/constants";
import { ModernTemplate } from "@/components/cv/modern-template";
import { MonoFrameTemplate } from "@/components/cv/mono-frame-template";
import { NordHeaderTemplate } from "@/components/cv/nord-header-template";
import { RoseSidebarTemplate } from "@/components/cv/rose-sidebar-template";
import { SandEditorialTemplate } from "@/components/cv/sand-editorial-template";
import { SlateProfileTemplate } from "@/components/cv/slate-profile-template";
import { SoftTimelineTemplate } from "@/components/cv/soft-timeline-template";
import { isCvTemplateKey } from "@/components/cv/template-registry";
import { redirect } from "next/navigation";
import type { CvSectionKey } from "@/types";
import {
  getCurrentDoctorCvLayout,
  getCurrentDoctorProfile,
  getCurrentUser
} from "@/lib/data/repository";

function isIncluded(itemVisibility: Record<string, boolean>, id: string) {
  return itemVisibility[id] !== false;
}

const MONTH_REPLACEMENTS: Record<string, string> = {
  Jan: "Januar",
  Feb: "Februar",
  Mar: "März",
  Apr: "April",
  May: "Mai",
  Jun: "Juni",
  Jul: "Juli",
  Aug: "August",
  Sep: "September",
  Oct: "Oktober",
  Nov: "November",
  Dec: "Dezember"
};

function normalizeGermanDateLabel(value: string | null | undefined) {
  if (!value) return value ?? null;

  let next = value;

  for (const [source, target] of Object.entries(MONTH_REPLACEMENTS)) {
    next = next.replace(new RegExp(`\\b${source}\\b`, "g"), target);
  }

  return next
    .replace(/\s-\sPresent\b/g, " - heute")
    .replace(/^since\s+/i, "seit ")
    .replace(/^Dates not specified$/i, "Zeitraum nicht angegeben")
    .replace(/^Date not specified$/i, "Datum nicht angegeben");
}

function normalizeGermanSystemText(value: string | null | undefined) {
  if (!value) return value ?? null;

  const normalized = value.trim();

  switch (normalized) {
    case "Medical license in Germany":
      return "Approbation in Deutschland";
    case "Medical authorization in Germany":
      return "Berufserlaubnis in Deutschland";
    case "Current position":
      return "Aktuelle Position";
    case "Education":
      return "Ausbildung";
    case "Training":
      return "Fortbildung";
    case "Role title":
      return "Position";
    case "Institution":
      return "Einrichtung";
    case "Additional section":
      return "Weiterer Abschnitt";
    default:
      return normalizeGermanDateLabel(normalized);
  }
}

export default async function DoctorCvExportPage({
  searchParams
}: {
  searchParams?: Promise<{ template?: string | string[]; mode?: string | string[] }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedTemplate =
    typeof resolvedSearchParams.template === "string" && isCvTemplateKey(resolvedSearchParams.template)
      ? resolvedSearchParams.template
      : "modern";
  const renderMode = resolvedSearchParams.mode === "render";

  if (!renderMode) {
    redirect(`/dashboard/doctor/cv/export/pdf?template=${encodeURIComponent(selectedTemplate)}`);
  }

  const user = await getCurrentUser("doctor");
  const profile = user ? await getCurrentDoctorProfile() : null;
  const layout = user ? await getCurrentDoctorCvLayout(selectedTemplate) : null;
  const itemVisibility =
    layout && typeof (layout as { item_visibility?: unknown }).item_visibility === "object" &&
    !Array.isArray((layout as { item_visibility?: unknown }).item_visibility) &&
    (layout as { item_visibility?: unknown }).item_visibility !== null
      ? ((layout as { item_visibility?: unknown }).item_visibility as Record<string, boolean>)
      : {};

  const cvModel = buildDoctorCvModel({
    profile,
    photoPresentation: layout?.photo_presentation,
    fallbackName: user?.full_name,
    email: user?.email,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
  });

  const filteredPersonalInfoItems = cvModel.personalInfo.items
    .map((item, index) => ({
      id: `personal-info-item-${index}`,
      value: item
    }))
    .filter((item) => isIncluded(itemVisibility, item.id));
  const filteredAddressLine =
    cvModel.personalInfo.address_line && isIncluded(itemVisibility, "personal-info-address-line")
      ? cvModel.personalInfo.address_line
      : null;
  const filteredWorkExperience = cvModel.workExperience.filter((item) => isIncluded(itemVisibility, item.id));
  const filteredEducation = cvModel.education.filter((item) => isIncluded(itemVisibility, item.id));
  const filteredQualifications = cvModel.qualifications.filter((item) => isIncluded(itemVisibility, item.id));
  const filteredLanguages = cvModel.languages.filter((item) => isIncluded(itemVisibility, item.id));
  const filteredTrainings = cvModel.trainings.filter((item) => isIncluded(itemVisibility, item.id));
  const filteredAdditionalSections = cvModel.additionalSections.filter((item) => isIncluded(itemVisibility, item.id));
  const availableSectionKeys = [
    filteredWorkExperience.length ? "work_experience" : null,
    filteredEducation.length ? "education" : null,
    filteredQualifications.length && !filteredWorkExperience.length ? "qualifications" : null,
    filteredLanguages.length ? "languages" : null,
    filteredTrainings.length ? "trainings" : null,
    filteredAdditionalSections.length ? "additional_sections" : null
  ].filter((value): value is CvSectionKey => Boolean(value));

  const sectionOrder = normalizeCvSectionOrder(layout?.section_order, availableSectionKeys);
  const modernHeaderPhoto = isIncluded(itemVisibility, "header-photo") ? (
    cvModel.header.photo_url ? (
      <img
        src={cvModel.header.photo_url}
        alt="Profile"
        className="photo"
      />
    ) : (
      <div className="photo-fallback">{cvModel.header.initials}</div>
    )
  ) : null;

  const clinicEdgeHeaderPhoto = isIncluded(itemVisibility, "header-photo") ? (
    cvModel.header.photo_url ? (
      <img
        src={cvModel.header.photo_url}
        alt="Profile"
        className="sidebar-photo"
      />
    ) : (
      <div className="sidebar-photo-fallback">{cvModel.header.initials}</div>
    )
  ) : null;

  const modernHeaderIdentity = (
    <>
      {isIncluded(itemVisibility, "header-full-name") ? (
        <h1 className="name">{cvModel.header.full_name}</h1>
      ) : null}
      {cvModel.header.subtitle && isIncluded(itemVisibility, "header-subtitle") ? (
        <p className="subtitle">{cvModel.header.subtitle}</p>
      ) : null}
    </>
  );

  const clinicEdgeHeaderIdentity = (
    <>
      {isIncluded(itemVisibility, "header-full-name") ? (
        <h1 className="name-large">{cvModel.header.full_name}</h1>
      ) : null}
      {cvModel.header.subtitle && isIncluded(itemVisibility, "header-subtitle") ? (
        <p className="subtitle">{cvModel.header.subtitle}</p>
      ) : null}
    </>
  );

  const modernPersonalInfo =
    filteredPersonalInfoItems.length || filteredAddressLine ? (
      <div className="info">
        {filteredPersonalInfoItems.length ? (
          <div className="info-row">
            {filteredPersonalInfoItems.map((item) => (
              <p key={item.id} style={{ margin: 0 }}>
                {item.value}
              </p>
            ))}
          </div>
        ) : null}
        {filteredAddressLine ? <p style={{ margin: "6px 0 0" }}>{filteredAddressLine}</p> : null}
      </div>
    ) : null;

  const clinicEdgeContactInfo = (
    <section className="sidebar-section">
      <h2 className="accent-title">Kontakt</h2>
      <div className="info">
        {filteredPersonalInfoItems.map((item) => (
          <p key={item.id} style={{ margin: "0 0 8px" }}>
            {item.value}
          </p>
        ))}
        {filteredAddressLine ? <p style={{ margin: 0 }}>{filteredAddressLine}</p> : null}
      </div>
    </section>
  );

  const languageSection = filteredLanguages.length ? (
    <section key="languages-section" className="section">
      <h2 className="section-title">Sprachen</h2>
      {filteredLanguages.map((item) => (
        <div key={item.id} className="entry">
          <p className="entry-title">{normalizeGermanSystemText(item.label)}</p>
        </div>
      ))}
    </section>
  ) : null;

  const clinicEdgeLanguagesSection = filteredLanguages.length ? (
    <section className="sidebar-section">
      <h2 className="accent-title">Sprachen</h2>
      <div className="info">
        {filteredLanguages.map((item) => (
          <p key={item.id} style={{ margin: "0 0 8px" }}>
            {normalizeGermanSystemText(item.label)}
          </p>
        ))}
      </div>
    </section>
  ) : null;

  const additionalSectionsSection = filteredAdditionalSections.length ? (
    <section key="additional-sections-section" className="section">
      <h2 className="section-title">Weitere Angaben</h2>
      {filteredAdditionalSections.map((item) => (
        <div key={item.id} className="entry">
          <p className="entry-title">{normalizeGermanSystemText(item.title)}</p>
          {item.bullets.length ? (
            <ul className="entry-bullets">
              {item.bullets.map((bullet, bulletIndex) => (
                <li key={`${item.id}-bullet-${bulletIndex}-${bullet}`}>{bullet}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </section>
  ) : null;

  const clinicEdgeSidebarAdditionalSection = filteredAdditionalSections[0] ? (
    <section className="sidebar-section">
      <h2 className="accent-title">{filteredAdditionalSections[0].title}</h2>
      <ul className="entry-bullets" style={{ marginTop: 0 }}>
        {filteredAdditionalSections[0].bullets.map((bullet, bulletIndex) => (
          <li key={`${filteredAdditionalSections[0].id}-bullet-${bulletIndex}-${bullet}`}>{bullet}</li>
        ))}
      </ul>
    </section>
  ) : null;

  const customBlockSection =
    cvModel.customBlock && (cvModel.customBlock.title || cvModel.customBlock.entries.length) ? (
      <section key="custom-block-section" className="section">
        {cvModel.customBlock.title ? (
          <h2 className="section-title">{normalizeGermanSystemText(cvModel.customBlock.title)}</h2>
        ) : null}
        {cvModel.customBlock.entries.map((entry) => (
          <div key={entry.id} className="entry">
            <div className="entry-top">
              <div>
                <p className="entry-title">{normalizeGermanSystemText(entry.content)}</p>
                {entry.description ? (
                  <p className="entry-subtitle">{normalizeGermanSystemText(entry.description)}</p>
                ) : null}
              </div>
              {entry.date_label ? (
                <p className="entry-date">{normalizeGermanDateLabel(entry.date_label)}</p>
              ) : null}
            </div>
          </div>
        ))}
      </section>
    ) : null;

  const sharedSections: { key: CvSectionKey; node: ReactNode }[] = [];

  for (const sectionKey of sectionOrder) {
    if (sectionKey === "work_experience" && filteredWorkExperience.length) {
      sharedSections.push({
        key: sectionKey,
        node: (
          <section key={sectionKey} className="section">
            <h2 className="section-title">Berufserfahrung</h2>
            {filteredWorkExperience.map((item) => (
              <div key={item.id} className="entry">
                <div className="entry-top">
                  <div>
                    <p className="entry-title">{normalizeGermanSystemText(item.title)}</p>
                    {item.organization_line ? <p className="entry-subtitle">{normalizeGermanSystemText(item.organization_line)}</p> : null}
                  </div>
                  <p className="entry-date">{normalizeGermanDateLabel(item.date_label)}</p>
                </div>
                {item.bullets.length ? (
                  <ul className="entry-bullets">
                    {item.bullets.map((bullet, bulletIndex) => (
                      <li key={`${item.id}-bullet-${bulletIndex}-${bullet}`}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </section>
        )
      });
      continue;
    }

    if (sectionKey === "education" && filteredEducation.length) {
      sharedSections.push({
        key: sectionKey,
        node: (
          <section key={sectionKey} className="section">
            <h2 className="section-title">Ausbildung</h2>
            {filteredEducation.map((item) => (
              <div key={item.id} className="entry">
                <div className="entry-top">
                  <div>
                    <p className="entry-title">{normalizeGermanSystemText(item.title)}</p>
                    {item.item_type === "medical_license" ? (
                      <>
                        {item.issuer_line ? (
                          <p className="entry-subtitle">{normalizeGermanSystemText(item.issuer_line)}</p>
                        ) : null}
                      </>
                    ) : (
                      <>
                        {item.subtitle ? <p className="entry-subtitle">{normalizeGermanSystemText(item.subtitle)}</p> : null}
                        {item.meta ? <p className="entry-meta">{normalizeGermanSystemText(item.meta)}</p> : null}
                      </>
                    )}
                  </div>
                  {(item.date_label || (item.item_type === "medical_license" ? item.since_label : null)) ? (
                    <p className="entry-date">
                      {item.item_type === "medical_license"
                        ? normalizeGermanDateLabel(item.since_label)
                        : normalizeGermanDateLabel(item.date_label)}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </section>
        )
      });
      continue;
    }

    if (sectionKey === "qualifications" && filteredQualifications.length) {
      sharedSections.push({
        key: sectionKey,
        node: (
          <section key={sectionKey} className="section">
            <h2 className="section-title">Berufliches Profil</h2>
            {filteredQualifications.map((item) => (
              <div key={item.id} className="entry">
                <p className="entry-title">{normalizeGermanSystemText(item.label)}</p>
                {item.detail ? <p className="entry-subtitle">{normalizeGermanSystemText(item.detail)}</p> : null}
              </div>
            ))}
          </section>
        )
      });
      continue;
    }

    if (sectionKey === "languages" && languageSection) {
      sharedSections.push({ key: sectionKey, node: languageSection });
      continue;
    }

    if (sectionKey === "trainings" && filteredTrainings.length) {
      sharedSections.push({
        key: sectionKey,
        node: (
          <section key={sectionKey} className="section">
            <h2 className="section-title">Fortbildungen</h2>
            {filteredTrainings.map((item) => (
              <div key={item.id} className="entry">
                <div className="entry-top">
                  <div>
                    <p className="entry-title">{normalizeGermanSystemText(item.title)}</p>
                    {item.detail ? <p className="entry-subtitle">{normalizeGermanSystemText(item.detail)}</p> : null}
                  </div>
                  {item.date_label ? <p className="entry-date">{normalizeGermanDateLabel(item.date_label)}</p> : null}
                </div>
              </div>
            ))}
          </section>
        )
      });
      continue;
    }

    if (sectionKey === "additional_sections" && additionalSectionsSection) {
      sharedSections.push({ key: sectionKey, node: additionalSectionsSection });
    }
  }

  const modernSections = customBlockSection
    ? [...sharedSections.map((section) => section.node), customBlockSection]
    : sharedSections.map((section) => section.node);
  const clinicEdgeMainSections = sharedSections
    .filter((section) => section.key !== "languages" && section.key !== "additional_sections")
    .map((section) => section.node);
  const clinicEdgeMainContent = customBlockSection
    ? [...clinicEdgeMainSections, customBlockSection]
    : clinicEdgeMainSections;
  const sidebarSectionKeys: CvSectionKey[] = ["languages", "qualifications", "additional_sections"];
  const sidebarSections = sharedSections
    .filter((section) => sidebarSectionKeys.includes(section.key))
    .map((section) => section.node);
  const mainSections = sharedSections
    .filter((section) => !sidebarSectionKeys.includes(section.key))
    .map((section) => section.node);
  const stackedMainSections = customBlockSection
    ? [...mainSections, customBlockSection]
    : mainSections;
  const aquaLeftColumnSections = sharedSections
    .filter((_, index) => index % 2 === 0)
    .map((section) => section.node);
  const aquaRightColumnSections = sharedSections
    .filter((_, index) => index % 2 === 1)
    .map((section) => section.node);
  const aquaBalancedLeftColumnSections = customBlockSection
    ? [...aquaLeftColumnSections, customBlockSection]
    : aquaLeftColumnSections;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page { size: A4 portrait; margin: 12mm; }
            html, body { margin: 0; padding: 0; background: #ffffff; color: #0f172a; font-family: Arial, sans-serif; }
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            *, *::before, *::after { box-sizing: border-box; }
            img { display: block; max-width: 100%; }
            .page { width: 100%; min-height: calc(297mm - 24mm); box-sizing: border-box; margin: 0; padding: 0; background: #ffffff; }
            .page-inner { width: 100%; min-height: calc(297mm - 24mm); box-sizing: border-box; padding: 0; }
            .page-inner > * { width: 100%; min-height: inherit; }
            .header { border-bottom: 1px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 24px; }
            .header-row { display: flex; gap: 16px; align-items: flex-start; }
            .photo { width: 112px; height: 112px; border-radius: 16px; object-fit: cover; object-position: center 18%; }
            .photo-fallback { width: 112px; height: 112px; border-radius: 16px; background: #e2e8f0; color: #475569; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 600; }
            .name { font-size: 34px; line-height: 1.08; font-weight: 700; margin: 0; letter-spacing: -0.02em; }
            .subtitle { margin: 6px 0 0; color: #475569; font-size: 16px; line-height: 1.35; }
            .info { margin-top: 12px; color: #475569; font-size: 13.5px; line-height: 1.45; }
            .info-row { display: flex; flex-wrap: wrap; gap: 8px 16px; }
            .section { margin-top: 24px; break-inside: avoid-page; page-break-inside: avoid; }
            .section-title { margin: 0 0 12px; font-size: 12px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: #64748b; }
            .entry { border-bottom: 1px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 14px; break-inside: avoid-page; page-break-inside: avoid; }
            .entry:last-child { border-bottom: 0; padding-bottom: 0; margin-bottom: 0; }
            .entry-top { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
            .entry-title { margin: 0; font-weight: 600; font-size: 15px; line-height: 1.35; color: #0f172a; }
            .entry-subtitle { margin: 4px 0 0; font-size: 13.5px; line-height: 1.4; color: #475569; }
            .entry-meta { margin: 4px 0 0; font-size: 13px; line-height: 1.4; color: #64748b; }
            .entry-date { white-space: nowrap; font-size: 12.5px; line-height: 1.35; color: #64748b; text-align: right; }
            .entry-bullets { margin: 8px 0 0; padding-left: 18px; font-size: 13.5px; line-height: 1.45; color: #475569; }
            .entry-bullets li { margin: 4px 0; }
            .timeline { border-left: 1px solid #e2e8f0; padding-left: 20px; }
            @media print {
              .page-inner > * { border-radius: 0 !important; box-shadow: none !important; }
            }
          `
        }}
      />
      <main className="page">
        <div className="page-inner">
          {selectedTemplate === "clinicEdge" ? (
            <div className="clinic-edge-export-shell">
              <style>{`
                .clinic-edge-export-shell {
                  width: 100%;
                }
                .clinic-edge-export-shell .clinic-edge-doc {
                  min-height: 273mm;
                  border-radius: 0;
                  border-color: #d7dfdc;
                  background: #f4f3ef;
                  box-shadow: none;
                }
                .clinic-edge-export-shell .clinic-edge-grid {
                  min-height: 273mm;
                  grid-template-columns: 33% 67%;
                }
                .clinic-edge-export-shell .clinic-edge-sidebar {
                  min-height: 273mm;
                  padding: 34px 28px;
                  background: linear-gradient(180deg, #c8d3cf 0%, #d6dfdb 30%, #e3eae7 66%, #edf1ef 100%);
                }
                .clinic-edge-export-shell .clinic-edge-topwash {
                  height: 6.25rem;
                }
                .clinic-edge-export-shell .clinic-edge-photo-frame {
                  border-radius: 26px;
                  box-shadow: 0 18px 34px rgba(15,23,42,0.10);
                }
                .clinic-edge-export-shell .clinic-edge-photo-inner {
                  border-radius: 20px;
                }
                .clinic-edge-export-shell .clinic-edge-sidebar .sidebar-photo,
                .clinic-edge-export-shell .clinic-edge-sidebar .sidebar-photo-fallback {
                  height: 270px;
                  border-radius: 20px;
                }
                .clinic-edge-export-shell .clinic-edge-sidebar .sidebar-photo {
                  object-position: center 14%;
                }
                .clinic-edge-export-shell .clinic-edge-sidebar-lower {
                  gap: 18px;
                  margin-top: 22px;
                }
                .clinic-edge-export-shell .clinic-edge-sidebar-stack {
                  gap: 18px;
                }
                .clinic-edge-export-shell .clinic-edge-contact-card {
                  padding: 16px 18px;
                  border-radius: 20px;
                  background: rgba(255,255,255,0.24);
                }
                .clinic-edge-export-shell .clinic-edge-sidebar .sidebar-section {
                  padding-top: 16px;
                }
                .clinic-edge-export-shell .clinic-edge-sidebar .accent-title {
                  margin-bottom: 10px;
                  color: #3f5d5b;
                  font-size: 10px;
                  letter-spacing: 0.24em;
                }
                .clinic-edge-export-shell .clinic-edge-sidebar .info {
                  font-size: 12.5px;
                  line-height: 1.55;
                }
                .clinic-edge-export-shell .clinic-edge-sidebar .entry-bullets {
                  font-size: 12.5px;
                  line-height: 1.5;
                }
                .clinic-edge-export-shell .clinic-edge-main {
                  min-height: 273mm;
                  padding: 34px 34px 30px;
                  background: linear-gradient(180deg, #fffefd 0%, #ffffff 42%, #fcfcfb 100%);
                }
                .clinic-edge-export-shell .clinic-edge-header {
                  padding-bottom: 26px;
                }
                .clinic-edge-export-shell .clinic-edge-identity {
                  margin-top: 18px;
                }
                .clinic-edge-export-shell .clinic-edge-main .name-large {
                  font-size: 2.55rem;
                  line-height: 1;
                }
                .clinic-edge-export-shell .clinic-edge-main .subtitle {
                  font-size: 0.94rem;
                  line-height: 1.55;
                }
                .clinic-edge-export-shell .clinic-edge-content {
                  padding-top: 26px;
                }
                .clinic-edge-export-shell .clinic-edge-content > * + * {
                  margin-top: 24px;
                }
                .clinic-edge-export-shell .clinic-edge-main .section-title {
                  margin-bottom: 10px;
                  font-size: 0.72rem;
                  letter-spacing: 0.2em;
                }
                .clinic-edge-export-shell .clinic-edge-main .entry-title {
                  font-size: 0.96rem;
                  line-height: 1.35;
                }
                .clinic-edge-export-shell .clinic-edge-main .entry-subtitle {
                  font-size: 0.86rem;
                  line-height: 1.35;
                }
                .clinic-edge-export-shell .clinic-edge-main .entry-meta {
                  font-size: 0.8rem;
                  line-height: 1.3;
                }
                .clinic-edge-export-shell .clinic-edge-main .entry-top {
                  gap: 12px;
                }
                .clinic-edge-export-shell .clinic-edge-main .entry-date {
                  width: 82px;
                  text-align: right;
                  font-size: 0.72rem;
                  letter-spacing: 0.04em;
                }
                .clinic-edge-export-shell .clinic-edge-main .entry-bullets {
                  margin-top: 8px;
                  padding-left: 18px;
                  font-size: 0.82rem;
                  line-height: 1.42;
                }
                .clinic-edge-export-shell .clinic-edge-main .section {
                  padding-top: 18px;
                }
                @media print {
                  .clinic-edge-export-shell .clinic-edge-doc {
                    border-radius: 0 !important;
                    box-shadow: none !important;
                  }
                }
              `}</style>
              <ClinicEdgeDocument
                headerPhoto={clinicEdgeHeaderPhoto}
                contactInfo={clinicEdgeContactInfo}
                languagesSection={clinicEdgeLanguagesSection}
                sidebarAdditionalSection={clinicEdgeSidebarAdditionalSection}
                headerIdentity={clinicEdgeHeaderIdentity}
                mainSections={clinicEdgeMainContent}
              />
            </div>
          ) : selectedTemplate === "softTimeline" ? (
            <SoftTimelineTemplate
              headerPhoto={modernHeaderPhoto}
              headerIdentity={modernHeaderIdentity}
              personalInfo={modernPersonalInfo}
              sections={modernSections}
            />
          ) : selectedTemplate === "slateProfile" ? (
            <SlateProfileTemplate
              headerPhoto={modernHeaderPhoto}
              headerIdentity={modernHeaderIdentity}
              personalInfo={modernPersonalInfo}
              sections={modernSections}
            />
          ) : selectedTemplate === "roseSidebar" ? (
            <RoseSidebarTemplate
              headerPhoto={modernHeaderPhoto}
              headerIdentity={modernHeaderIdentity}
              personalInfo={modernPersonalInfo}
              sidebarSections={sidebarSections}
              mainSections={stackedMainSections}
            />
          ) : selectedTemplate === "nordHeader" ? (
            <NordHeaderTemplate
              headerPhoto={modernHeaderPhoto}
              headerIdentity={modernHeaderIdentity}
              personalInfo={modernPersonalInfo}
              sections={modernSections}
            />
          ) : selectedTemplate === "sandEditorial" ? (
            <SandEditorialTemplate
              headerPhoto={modernHeaderPhoto}
              headerIdentity={modernHeaderIdentity}
              personalInfo={modernPersonalInfo}
              sidebarSections={sidebarSections}
              mainSections={stackedMainSections}
            />
          ) : selectedTemplate === "blueLedger" ? (
            <BlueLedgerTemplate
              headerPhoto={modernHeaderPhoto}
              headerIdentity={modernHeaderIdentity}
              personalInfo={modernPersonalInfo}
              sidebarSections={sidebarSections}
              mainSections={stackedMainSections}
            />
          ) : selectedTemplate === "monoFrame" ? (
            <MonoFrameTemplate
              headerPhoto={modernHeaderPhoto}
              headerIdentity={modernHeaderIdentity}
              personalInfo={modernPersonalInfo}
              sidebarSections={sidebarSections}
              mainSections={mainSections}
            />
          ) : selectedTemplate === "aquaGrid" ? (
            <AquaGridTemplate
              headerPhoto={modernHeaderPhoto}
              headerIdentity={modernHeaderIdentity}
              personalInfo={modernPersonalInfo}
              leftColumnSections={aquaBalancedLeftColumnSections}
              rightColumnSections={aquaRightColumnSections}
            />
          ) : (
            <ModernTemplate
              headerPhoto={modernHeaderPhoto}
              headerIdentity={modernHeaderIdentity}
              personalInfo={modernPersonalInfo}
              sections={modernSections}
            />
          )}
        </div>
      </main>
    </>
  );
}
