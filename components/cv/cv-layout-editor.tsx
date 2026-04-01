"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { GripVertical } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CvEntryList } from "@/components/cv/cv-entry-list";
import { CV_TEMPLATE_OPTIONS, type CvTemplateKey } from "@/components/cv/template-registry";
import { WorkExperienceList } from "@/components/cv/work-experience-list";
import { Button } from "@/components/ui/button";
import { saveDoctorCvLayoutAction } from "@/lib/actions";
import { DEFAULT_CV_SECTION_ORDER, normalizeCvSectionOrder } from "@/lib/cv/constants";
import type { CvLanguageItem, CvSectionKey, DoctorCvModel, DoctorExperience } from "@/types";

type Props = {
  cvModel: DoctorCvModel;
  experiences: DoctorExperience[];
  initialItemVisibility: Record<string, boolean>;
  initialSectionOrder: CvSectionKey[];
  initialSelectedTemplate?: CvTemplateKey;
};

type SectionDefinition = {
  key: CvSectionKey;
  title: string;
};

type HeaderItem = {
  id: string;
  label: string;
  value?: string | null;
};

const SECTION_DEFINITIONS: SectionDefinition[] = [
  { key: "work_experience", title: "Berufserfahrung" },
  { key: "education", title: "Ausbildung" },
  { key: "qualifications", title: "Medizinische Qualifikationen" },
  { key: "languages", title: "Sprachen" },
  { key: "trainings", title: "Fortbildungen" },
  { key: "additional_sections", title: "Zusatzliche Abschnitte" }
];

function reorderList<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function areSectionArraysEqual(left: CvSectionKey[], right: CvSectionKey[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function areRecordValuesEqual(
  left: Record<string, boolean>,
  right: Record<string, boolean>
) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every((key) => left[key] === right[key]);
}

export function CvLayoutEditor({
  cvModel,
  experiences,
  initialItemVisibility,
  initialSectionOrder,
  initialSelectedTemplate = "modern"
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [selectedTemplate, setSelectedTemplate] = useState<CvTemplateKey>(initialSelectedTemplate);
  const [draggedSectionKey, setDraggedSectionKey] = useState<CvSectionKey | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<CvSectionKey | null>(null);
  const [itemVisibility, setItemVisibility] = useState<Record<string, boolean>>(initialItemVisibility);
  const [orderedLanguages, setOrderedLanguages] = useState<CvLanguageItem[]>(cvModel.languages);
  const [draggedLanguageId, setDraggedLanguageId] = useState<string | null>(null);
  const [dropTargetLanguageId, setDropTargetLanguageId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const availableSectionKeys = useMemo(() => {
    const keys: CvSectionKey[] = [];

    if (cvModel.workExperience.length) keys.push("work_experience");
    if (cvModel.education.length) keys.push("education");
    if (cvModel.qualifications.length && !cvModel.workExperience.length) keys.push("qualifications");
    if (cvModel.languages.length) keys.push("languages");
    if (cvModel.trainings.length) keys.push("trainings");
    if (cvModel.additionalSections.length) keys.push("additional_sections");

    return keys;
  }, [cvModel]);

  const defaultOrder = useMemo(
    () => normalizeCvSectionOrder(DEFAULT_CV_SECTION_ORDER, availableSectionKeys),
    [availableSectionKeys]
  );

  const normalizedInitialOrder = useMemo(
    () => normalizeCvSectionOrder(initialSectionOrder, availableSectionKeys),
    [availableSectionKeys, initialSectionOrder]
  );

  const [sectionOrder, setSectionOrder] = useState<CvSectionKey[]>(() => normalizedInitialOrder);

  useEffect(() => {
    setSectionOrder((current) =>
      areSectionArraysEqual(current, normalizedInitialOrder)
        ? current
        : normalizedInitialOrder
    );
  }, [normalizedInitialOrder]);

  useEffect(() => {
    setOrderedLanguages(cvModel.languages);
  }, [cvModel.languages]);

  useEffect(() => {
    setItemVisibility((current) =>
      areRecordValuesEqual(current, initialItemVisibility) ? current : initialItemVisibility
    );
  }, [initialItemVisibility]);

  useEffect(() => {
    setSelectedTemplate(initialSelectedTemplate);
  }, [initialSelectedTemplate]);

  const isDirty =
    !areSectionArraysEqual(sectionOrder, normalizedInitialOrder) ||
    !areRecordValuesEqual(itemVisibility, initialItemVisibility);

  function moveSection(targetKey: CvSectionKey) {
    if (!draggedSectionKey || draggedSectionKey === targetKey) {
      return;
    }

    const fromIndex = sectionOrder.findIndex((key) => key === draggedSectionKey);
    const toIndex = sectionOrder.findIndex((key) => key === targetKey);

    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    setSectionOrder(reorderList(sectionOrder, fromIndex, toIndex));
    setDraggedSectionKey(null);
    setDropTargetKey(null);
    setStatusMessage("");
  }

  function moveLanguage(targetId: string) {
    if (!draggedLanguageId || draggedLanguageId === targetId) {
      return;
    }

    const fromIndex = orderedLanguages.findIndex((language) => language.id === draggedLanguageId);
    const toIndex = orderedLanguages.findIndex((language) => language.id === targetId);

    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    setOrderedLanguages(reorderList(orderedLanguages, fromIndex, toIndex));
    setDraggedLanguageId(null);
    setDropTargetLanguageId(null);
  }

  function toggleItemVisibility(id: string) {
    setItemVisibility((current) => ({
      ...current,
      [id]: current[id] === false
    }));
    setStatusMessage("");
  }

  function isItemIncluded(id: string) {
    return itemVisibility[id] !== false;
  }

  function saveLayout() {
    startTransition(async () => {
      const result = await saveDoctorCvLayoutAction({
        sectionOrder,
        itemVisibility,
        templateKey: "modern"
      });

      setStatusMessage(result.message);

      if (result.success) {
        router.refresh();
      }
    });
  }

  function updateSelectedTemplate(nextTemplate: CvTemplateKey) {
    setSelectedTemplate(nextTemplate);

    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.set("template", nextTemplate);

    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", `${pathname}?${nextSearchParams.toString()}`);
    }
  }

  const headerItems = useMemo<HeaderItem[]>(
    () => [
      { id: "header-photo", label: "Foto", value: cvModel.header.photo_url },
      { id: "header-full-name", label: "Vollstandiger Name", value: cvModel.header.full_name },
      ...(cvModel.header.subtitle
        ? [
            {
              id: "header-subtitle",
              label: "Berufsbezeichnung",
              value: cvModel.header.subtitle
            }
          ]
        : []),
      ...cvModel.personalInfo.items.map((item, index) => ({
        id: `personal-info-item-${index}`,
        label: item,
        value: item
      })),
      ...(cvModel.personalInfo.address_line
        ? [
            {
              id: "personal-info-address-line",
              label: cvModel.personalInfo.address_line,
              value: cvModel.personalInfo.address_line
            }
          ]
        : [])
    ],
    [cvModel]
  );

  function renderSectionEditor(sectionKey: CvSectionKey) {
    if (sectionKey === "work_experience") {
      return (
        <WorkExperienceList
          experiences={experiences}
          items={cvModel.workExperience}
          itemVisibility={itemVisibility}
          onToggleVisibility={toggleItemVisibility}
        />
      );
    }

    if (sectionKey === "education") {
      return (
        <CvEntryList
          items={cvModel.education.map((education) => ({
            id: education.id,
            title: education.title,
            subtitle: education.subtitle,
            meta: education.meta,
            dateLabel: education.date_label,
            itemType: education.item_type,
            issuerLine: education.issuer_line,
            sinceLabel: education.since_label
          }))}
          itemVisibility={itemVisibility}
          reorderLabel="Ausbildung neu anordnen"
          onToggleVisibility={toggleItemVisibility}
        />
      );
    }

    if (sectionKey === "qualifications") {
      return (
        <CvEntryList
          items={cvModel.qualifications.map((qualification) => ({
            id: qualification.id,
            title: qualification.label,
            subtitle: qualification.detail
          }))}
          itemVisibility={itemVisibility}
          reorderLabel="Medizinische Qualifikationen neu anordnen"
          onToggleVisibility={toggleItemVisibility}
        />
      );
    }

    if (sectionKey === "languages") {
      return (
        <CvEntryList
          items={orderedLanguages.map((language) => ({
            id: language.id,
            title: language.label
          }))}
          itemVisibility={itemVisibility}
          reorderLabel="Sprachen neu anordnen"
          draggable={orderedLanguages.length > 1}
          onToggleVisibility={toggleItemVisibility}
          draggedId={draggedLanguageId}
          dropTargetId={dropTargetLanguageId}
          onDragStart={(id) => setDraggedLanguageId(id)}
          onDragOver={(id) => setDropTargetLanguageId(id)}
          onDrop={(id) => moveLanguage(id)}
          onDragEnd={() => {
            setDraggedLanguageId(null);
            setDropTargetLanguageId(null);
          }}
        />
      );
    }

    if (sectionKey === "trainings") {
      return (
        <CvEntryList
          items={cvModel.trainings.map((training) => ({
            id: training.id,
            title: training.title,
            subtitle: training.detail,
            dateLabel: training.date_label
          }))}
          itemVisibility={itemVisibility}
          reorderLabel="Fortbildungen neu anordnen"
          onToggleVisibility={toggleItemVisibility}
        />
      );
    }

    if (sectionKey === "additional_sections") {
      return (
        <CvEntryList
          items={cvModel.additionalSections.map((section) => ({
            id: section.id,
            title: section.title,
            bullets: section.bullets
          }))}
          itemVisibility={itemVisibility}
          reorderLabel="Zusatzliche Abschnitte neu anordnen"
          onToggleVisibility={toggleItemVisibility}
        />
      );
    }

    return null;
  }

  return (
    <div className="w-full p-6">
      <div className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[1.75rem] bg-slate-100 ring-1 ring-slate-200">
                {cvModel.header.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cvModel.header.photo_url}
                    alt={cvModel.header.full_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-semibold tracking-[0.2em] text-slate-500">
                    {cvModel.header.initials}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Editor
                </p>
                <h2 className="text-lg font-semibold text-slate-950">
                  Kopfbereich bearbeiten
                </h2>
                <p className="text-sm leading-6 text-slate-600">
                  Foto, Name, Berufsbezeichnung und Kontaktdaten werden weiter unten uber
                  die Kopfbereich-Eintrage gesteuert.
                </p>
              </div>
          </div>
        </section>

        <div className="flex flex-col gap-3 border-b border-slate-100 pb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Builder
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                Lebenslauf bearbeiten
              </h2>
            </div>
            <label className="text-sm font-medium text-slate-700" htmlFor="cv-template-select">
              Vorlage
            </label>
          </div>

          <select
            id="cv-template-select"
            value={selectedTemplate}
            onChange={(event) => updateSelectedTemplate(event.target.value as CvTemplateKey)}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          >
            {CV_TEMPLATE_OPTIONS.map((template) => (
              <option key={template.key} value={template.key}>
                {template.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-900">Lebenslauf-Layout anordnen</p>
            <p className="text-xs text-slate-500">
              Ziehen Sie Abschnitte, um die Reihenfolge zu andern, und speichern Sie anschliessend das Layout.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending || !availableSectionKeys.length}
              onClick={() => {
                setSectionOrder(defaultOrder);
                setStatusMessage("");
              }}
            >
              Standard wiederherstellen
            </Button>
            <Button type="button" disabled={isPending || !isDirty} onClick={saveLayout}>
              {isPending ? "Layout wird gespeichert..." : "Layout speichern"}
            </Button>
            <Button asChild variant="outline">
              <Link
                href={{ pathname: "/dashboard/doctor/cv/export", query: { template: selectedTemplate } }}
                target="_blank"
                rel="noreferrer"
              >
                PDF exportieren
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link
                href={{ pathname: "/dashboard/doctor/cv/pdf-preview", query: { template: selectedTemplate } }}
                target="_blank"
                rel="noreferrer"
              >
                CV-Vorschau offnen
              </Link>
            </Button>
          </div>
        </div>

        {statusMessage ? <p className="text-sm text-slate-600">{statusMessage}</p> : null}

        <section className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/65 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Kopfbereich
          </h3>
          <div className="space-y-2">
            {headerItems.map((item) => {
              const included = isItemIncluded(item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleItemVisibility(item.id)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                    included
                      ? "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      : "border-slate-200 bg-slate-100 text-slate-400"
                  }`}
                >
                  <span className="pr-3">{item.label}</span>
                  <span className="shrink-0 text-[11px] uppercase tracking-[0.14em]">
                    {included ? "Aktiv" : "Aus"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="space-y-4">
          {sectionOrder.map((sectionKey) => {
            const definition = SECTION_DEFINITIONS.find((section) => section.key === sectionKey);

            if (!definition) {
              return null;
            }

            return (
              <section
                key={sectionKey}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDropTargetKey(sectionKey);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  moveSection(sectionKey);
                }}
                className={`space-y-3 rounded-[1.5rem] border bg-white p-4 shadow-sm transition ${
                  dropTargetKey === sectionKey
                    ? "border-sky-200 bg-sky-50/70"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {definition.title}
                  </h3>
                  <button
                    type="button"
                    draggable={!isPending}
                    onDragStart={() => setDraggedSectionKey(sectionKey)}
                    onDragEnd={() => {
                      setDraggedSectionKey(null);
                      setDropTargetKey(null);
                    }}
                    aria-label={`Reorder ${definition.title}`}
                    className="inline-flex cursor-grab items-center rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                </div>
                {renderSectionEditor(sectionKey)}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
