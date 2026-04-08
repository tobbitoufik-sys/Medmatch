"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { GripVertical, Home, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  getCvPhotoFrameClasses,
  getCvTemplatePhotoShape
} from "@/components/cv/cv-template-photo-shape";
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
  initialSectionOrder: string[];
  initialSelectedTemplate: CvTemplateKey;
};

type EditorSectionKey = CvSectionKey | "custom_block";

type SectionDefinition = {
  key: EditorSectionKey;
  title: string;
  helper: string;
  emphasis?: "strong" | "standard";
};

type HeaderItem = {
  id: string;
  label: string;
  value?: string | null;
  kind: "photo" | "name" | "title" | "phone" | "email" | "address";
};

const SECTION_DEFINITIONS: SectionDefinition[] = [
  {
    key: "work_experience",
    title: "Berufserfahrung",
    helper:
      "Die wichtigste Station zuerst: Reihenfolge und Sichtbarkeit steuern Sie hier direkt.",
    emphasis: "strong"
  },
  {
    key: "education",
    title: "Ausbildung",
    helper: "Abschlusse und Universitat bleiben in einer klaren, leicht scanbaren Reihenfolge."
  },
  {
    key: "trainings",
    title: "Fortbildungen",
    helper: "Relevante Weiterbildungen sichtbar halten, weniger wichtige Eintrage ausblenden."
  },
  {
    key: "languages",
    title: "Sprachen",
    helper: "Sprachen nach Recruiting-Relevanz sortieren und bei Bedarf ausblenden."
  },
  {
    key: "additional_sections",
    title: "Zusatzliche Abschnitte",
    helper: "Individuelle Zusatzthemen mit Uberschrift und Stichpunkten werden hier gepflegt."
  },
  {
    key: "custom_block",
    title: "Aus Profil uebernommen",
    helper: "Dieser Zusatzblock wird im Profil gepflegt und unten im Lebenslauf angezeigt."
  }
];

function reorderList<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function areSectionArraysEqual(left: EditorSectionKey[], right: EditorSectionKey[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function normalizeEditorSectionOrder(
  input: string[] | null | undefined,
  availableSectionKeys: EditorSectionKey[],
  defaultSectionOrder: EditorSectionKey[]
) {
  const available = new Set(availableSectionKeys);
  const next: EditorSectionKey[] = [];

  for (const key of input ?? []) {
    if (!available.has(key as EditorSectionKey)) continue;
    if (next.includes(key as EditorSectionKey)) continue;
    next.push(key as EditorSectionKey);
  }

  for (const key of defaultSectionOrder) {
    if (!available.has(key)) continue;
    if (!next.includes(key)) next.push(key);
  }

  return next;
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

function getContactIcon(kind: HeaderItem["kind"]) {
  if (kind === "phone") {
    return Phone;
  }

  if (kind === "email") {
    return Mail;
  }

  if (kind === "address") {
    return Home;
  }

  return MapPin;
}

function normalizeGermanCity(value: string | null | undefined) {
  if (!value) return null;

  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => part.toLowerCase() !== "deutschland");

  return parts[0] ?? null;
}

function joinAddressParts(parts: Array<string | null | undefined>) {
  const filtered = parts.map((part) => part?.trim()).filter(Boolean);
  return filtered.length ? filtered.join(", ") : null;
}

function getSectionCardClass(emphasis: SectionDefinition["emphasis"]) {
  if (emphasis === "strong") {
    return "rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]";
  }

  return "rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm";
}

export function CvEditorClientShell({
  cvModel,
  experiences,
  initialItemVisibility,
  initialSectionOrder,
  initialSelectedTemplate
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [selectedTemplate, setSelectedTemplate] = useState<CvTemplateKey>(initialSelectedTemplate);
  const [draggedSectionKey, setDraggedSectionKey] = useState<EditorSectionKey | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<EditorSectionKey | null>(null);
  const [itemVisibility, setItemVisibility] =
    useState<Record<string, boolean>>(initialItemVisibility);
  const [orderedEducation, setOrderedEducation] = useState(cvModel.education);
  const [orderedTrainings, setOrderedTrainings] = useState(cvModel.trainings);
  const [orderedLanguages, setOrderedLanguages] = useState<CvLanguageItem[]>(cvModel.languages);
  const [orderedAdditionalSections, setOrderedAdditionalSections] = useState(
    cvModel.additionalSections
  );
  const [orderedCustomBlockEntries, setOrderedCustomBlockEntries] = useState(
    cvModel.customBlock?.entries ?? []
  );
  const [draggedEducationId, setDraggedEducationId] = useState<string | null>(null);
  const [dropTargetEducationId, setDropTargetEducationId] = useState<string | null>(null);
  const [draggedTrainingId, setDraggedTrainingId] = useState<string | null>(null);
  const [dropTargetTrainingId, setDropTargetTrainingId] = useState<string | null>(null);
  const [draggedLanguageId, setDraggedLanguageId] = useState<string | null>(null);
  const [dropTargetLanguageId, setDropTargetLanguageId] = useState<string | null>(null);
  const [draggedAdditionalSectionId, setDraggedAdditionalSectionId] = useState<string | null>(null);
  const [dropTargetAdditionalSectionId, setDropTargetAdditionalSectionId] = useState<string | null>(null);
  const [draggedCustomBlockEntryId, setDraggedCustomBlockEntryId] = useState<string | null>(null);
  const [dropTargetCustomBlockEntryId, setDropTargetCustomBlockEntryId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const availableSectionKeys = useMemo(() => {
    const keys: CvSectionKey[] = [];

    if (cvModel.workExperience.length) keys.push("work_experience");
    if (cvModel.education.length) keys.push("education");
    if (cvModel.trainings.length) keys.push("trainings");
    if (cvModel.languages.length) keys.push("languages");
    if (cvModel.additionalSections.length) keys.push("additional_sections");

    return keys;
  }, [
    cvModel.additionalSections.length,
    cvModel.education.length,
    cvModel.languages.length,
    cvModel.trainings.length,
    cvModel.workExperience.length
  ]);

  const hasCustomBlock =
    !!cvModel.customBlock && !!(cvModel.customBlock.title || orderedCustomBlockEntries.length);

  const availableEditorSectionKeys = useMemo<EditorSectionKey[]>(() => {
    const keys: EditorSectionKey[] = [...availableSectionKeys];

    if (hasCustomBlock) {
      keys.push("custom_block");
    }

    return keys;
  }, [availableSectionKeys, hasCustomBlock]);

  const defaultOrder = useMemo(
    () => normalizeCvSectionOrder(DEFAULT_CV_SECTION_ORDER, availableSectionKeys),
    [availableSectionKeys]
  );

  const defaultEditorOrder = useMemo<EditorSectionKey[]>(() => {
    const next: EditorSectionKey[] = [...defaultOrder];

    if (hasCustomBlock && !next.includes("custom_block")) {
      next.push("custom_block");
    }

    return next;
  }, [defaultOrder, hasCustomBlock]);

  const normalizedInitialEditorOrder = useMemo<EditorSectionKey[]>(() => {
    return normalizeEditorSectionOrder(
      initialSectionOrder,
      availableEditorSectionKeys,
      defaultEditorOrder
    );
  }, [availableEditorSectionKeys, defaultEditorOrder, initialSectionOrder]);

  const [sectionOrder, setSectionOrder] = useState<EditorSectionKey[]>(
    () => normalizedInitialEditorOrder
  );

  useEffect(() => {
    setSectionOrder((current) =>
      areSectionArraysEqual(current, normalizedInitialEditorOrder)
        ? current
        : normalizedInitialEditorOrder
    );
  }, [normalizedInitialEditorOrder]);

  useEffect(() => {
    setItemVisibility((current) =>
      areRecordValuesEqual(current, initialItemVisibility) ? current : initialItemVisibility
    );
  }, [initialItemVisibility]);

  useEffect(() => {
    setOrderedEducation(cvModel.education);
  }, [cvModel.education]);

  useEffect(() => {
    setOrderedTrainings(cvModel.trainings);
  }, [cvModel.trainings]);

  useEffect(() => {
    setOrderedLanguages(cvModel.languages);
  }, [cvModel.languages]);

  useEffect(() => {
    setOrderedAdditionalSections(cvModel.additionalSections);
  }, [cvModel.additionalSections]);

  useEffect(() => {
    setOrderedCustomBlockEntries(cvModel.customBlock?.entries ?? []);
  }, [cvModel.customBlock]);

  useEffect(() => {
    setSelectedTemplate(initialSelectedTemplate);
  }, [initialSelectedTemplate]);

  const photoShape = useMemo(
    () => getCvTemplatePhotoShape(selectedTemplate),
    [selectedTemplate]
  );
  const photoFrameClasses = useMemo(
    () => getCvPhotoFrameClasses(photoShape),
    [photoShape]
  );

  const isDirty =
    !areSectionArraysEqual(sectionOrder, normalizedInitialEditorOrder) ||
    !areRecordValuesEqual(itemVisibility, initialItemVisibility);

  const headerItems = useMemo<HeaderItem[]>(() => {
    const phoneEntry = cvModel.personalInfo.items.find(
      (item) => /\d/.test(item) && !item.includes("@")
    );
    const emailEntry = cvModel.personalInfo.items.find((item) => item.includes("@"));
    const locationEntry = cvModel.personalInfo.items.find(
      (item) => !item.includes("@") && !/\d/.test(item)
    );
    const cityLabel = normalizeGermanCity(locationEntry);
    const addressLabel = joinAddressParts([cvModel.personalInfo.address_line, cityLabel]);

    return [
      { id: "header-photo", label: "Foto", kind: "photo" },
      {
        id: "header-full-name",
        label: "Vollstandiger Name",
        value: cvModel.header.full_name,
        kind: "name"
      },
      ...(cvModel.header.subtitle
        ? [
            {
              id: "header-subtitle",
              label: "Berufsbezeichnung" as const,
              value: cvModel.header.subtitle,
              kind: "title" as const
            }
          ]
        : []),
      ...(phoneEntry
        ? [
            {
              id: "personal-info-phone",
              label: phoneEntry,
              value: phoneEntry,
              kind: "phone" as const
            }
          ]
        : []),
      ...(emailEntry
        ? [
            {
              id: "personal-info-email",
              label: emailEntry,
              value: emailEntry,
              kind: "email" as const
            }
          ]
        : []),
      ...(addressLabel
        ? [
            {
              id: "personal-info-address",
              label: addressLabel,
              value: addressLabel,
              kind: "address" as const
            }
          ]
        : [])
    ];
  }, [cvModel]);

  const photoItem = headerItems.find((item) => item.id === "header-photo") ?? null;
  const nameItem = headerItems.find((item) => item.id === "header-full-name") ?? null;
  const contactHeaderItems = headerItems.filter(
    (item) =>
      item.kind === "phone" ||
      item.kind === "email" ||
      item.kind === "address"
  );

  function toggleItemVisibility(id: string) {
    setItemVisibility((current) => ({
      ...current,
      [id]: current[id] === false
    }));
    setStatusMessage("");
  }

  function updateSelectedTemplate(nextTemplate: CvTemplateKey) {
    setSelectedTemplate(nextTemplate);

    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.set("template", nextTemplate);

    if (typeof window !== "undefined") {
      const nextQuery = nextSearchParams.toString();
      window.history.replaceState({}, "", nextQuery ? `${pathname}?${nextQuery}` : pathname);
    }
  }

  function saveLayout() {
    startTransition(async () => {
      const result = await saveDoctorCvLayoutAction({
        sectionOrder,
        itemVisibility,
        templateKey: selectedTemplate
      });

      setStatusMessage(result.message);

      if (result.success) {
        router.refresh();
      }
    });
  }

  function resetLayout() {
    setSectionOrder(defaultEditorOrder);
    setItemVisibility(initialItemVisibility);
    setOrderedEducation(cvModel.education);
    setOrderedTrainings(cvModel.trainings);
    setOrderedLanguages(cvModel.languages);
    setOrderedAdditionalSections(cvModel.additionalSections);
    setStatusMessage("");
  }

  function moveSection(targetKey: EditorSectionKey) {
    if (!draggedSectionKey || draggedSectionKey === targetKey) {
      return;
    }

    const fromIndex = sectionOrder.findIndex((key) => key === draggedSectionKey);
    const toIndex = sectionOrder.findIndex((key) => key === targetKey);

    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    setSectionOrder((current) => reorderList(current, fromIndex, toIndex));
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

    setOrderedLanguages((current) => reorderList(current, fromIndex, toIndex));
  }

  function moveEducationItem(targetId: string) {
    if (!draggedEducationId || draggedEducationId === targetId) {
      return;
    }

    const fromIndex = orderedEducation.findIndex((item) => item.id === draggedEducationId);
    const toIndex = orderedEducation.findIndex((item) => item.id === targetId);

    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    setOrderedEducation((current) => reorderList(current, fromIndex, toIndex));
  }

  function moveTrainingItem(targetId: string) {
    if (!draggedTrainingId || draggedTrainingId === targetId) {
      return;
    }

    const fromIndex = orderedTrainings.findIndex((item) => item.id === draggedTrainingId);
    const toIndex = orderedTrainings.findIndex((item) => item.id === targetId);

    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    setOrderedTrainings((current) => reorderList(current, fromIndex, toIndex));
  }

  function moveAdditionalSectionItem(targetId: string) {
    if (!draggedAdditionalSectionId || draggedAdditionalSectionId === targetId) {
      return;
    }

    const fromIndex = orderedAdditionalSections.findIndex(
      (item) => item.id === draggedAdditionalSectionId
    );
    const toIndex = orderedAdditionalSections.findIndex((item) => item.id === targetId);

    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    setOrderedAdditionalSections((current) => reorderList(current, fromIndex, toIndex));
  }

  function moveCustomBlockEntry(targetId: string) {
    if (!draggedCustomBlockEntryId || draggedCustomBlockEntryId === targetId) {
      return;
    }

    const fromIndex = orderedCustomBlockEntries.findIndex(
      (item) => item.id === draggedCustomBlockEntryId
    );
    const toIndex = orderedCustomBlockEntries.findIndex((item) => item.id === targetId);

    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    setOrderedCustomBlockEntries((current) => reorderList(current, fromIndex, toIndex));
  }

  function renderSectionEditor(sectionKey: EditorSectionKey) {
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
          items={orderedEducation.map((education) => ({
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
          draggable={orderedEducation.length > 1}
          onToggleVisibility={toggleItemVisibility}
          draggedId={draggedEducationId}
          dropTargetId={dropTargetEducationId}
          onDragStart={(id) => setDraggedEducationId(id)}
          onDragOver={(id) => setDropTargetEducationId(id)}
          onDrop={(id) => {
            moveEducationItem(id);
            setDraggedEducationId(null);
            setDropTargetEducationId(null);
          }}
          onDragEnd={() => {
            setDraggedEducationId(null);
            setDropTargetEducationId(null);
          }}
        />
      );
    }

    if (sectionKey === "trainings") {
      return (
        <CvEntryList
          items={orderedTrainings.map((training) => ({
            id: training.id,
            title: training.title,
            subtitle: training.detail,
            dateLabel: training.date_label
          }))}
          itemVisibility={itemVisibility}
          reorderLabel="Fortbildungen neu anordnen"
          draggable={orderedTrainings.length > 1}
          onToggleVisibility={toggleItemVisibility}
          draggedId={draggedTrainingId}
          dropTargetId={dropTargetTrainingId}
          onDragStart={(id) => setDraggedTrainingId(id)}
          onDragOver={(id) => setDropTargetTrainingId(id)}
          onDrop={(id) => {
            moveTrainingItem(id);
            setDraggedTrainingId(null);
            setDropTargetTrainingId(null);
          }}
          onDragEnd={() => {
            setDraggedTrainingId(null);
            setDropTargetTrainingId(null);
          }}
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
          onDrop={(id) => {
            moveLanguage(id);
            setDraggedLanguageId(null);
            setDropTargetLanguageId(null);
          }}
          onDragEnd={() => {
            setDraggedLanguageId(null);
            setDropTargetLanguageId(null);
          }}
        />
      );
    }

    if (sectionKey === "additional_sections") {
      return (
        <CvEntryList
          items={orderedAdditionalSections.map((section) => ({
            id: section.id,
            title: section.title,
            bullets: section.bullets
          }))}
          itemVisibility={itemVisibility}
          reorderLabel="Zusatzliche Abschnitte neu anordnen"
          draggable={orderedAdditionalSections.length > 1}
          onToggleVisibility={toggleItemVisibility}
          draggedId={draggedAdditionalSectionId}
          dropTargetId={dropTargetAdditionalSectionId}
          onDragStart={(id) => setDraggedAdditionalSectionId(id)}
          onDragOver={(id) => setDropTargetAdditionalSectionId(id)}
          onDrop={(id) => {
            moveAdditionalSectionItem(id);
            setDraggedAdditionalSectionId(null);
            setDropTargetAdditionalSectionId(null);
          }}
          onDragEnd={() => {
            setDraggedAdditionalSectionId(null);
            setDropTargetAdditionalSectionId(null);
          }}
        />
      );
    }

    if (sectionKey === "custom_block" && cvModel.customBlock) {
      return (
        <div className="space-y-3">
          {cvModel.customBlock.title ? (
            <p className="text-sm font-semibold text-slate-900">{cvModel.customBlock.title}</p>
          ) : null}

          <CvEntryList
            items={orderedCustomBlockEntries.map((entry) => ({
              id: entry.id,
              title: entry.content,
              subtitle: entry.description,
              dateLabel: entry.date_label
            }))}
            itemVisibility={itemVisibility}
            reorderLabel="Zusatzblock neu anordnen"
            draggable={orderedCustomBlockEntries.length > 1}
            onToggleVisibility={toggleItemVisibility}
            draggedId={draggedCustomBlockEntryId}
            dropTargetId={dropTargetCustomBlockEntryId}
            onDragStart={(id) => setDraggedCustomBlockEntryId(id)}
            onDragOver={(id) => setDropTargetCustomBlockEntryId(id)}
            onDrop={(id) => {
              moveCustomBlockEntry(id);
              setDraggedCustomBlockEntryId(null);
              setDropTargetCustomBlockEntryId(null);
            }}
            onDragEnd={() => {
              setDraggedCustomBlockEntryId(null);
              setDropTargetCustomBlockEntryId(null);
            }}
          />
        </div>
      );
    }

    return null;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f3f6f8_0%,#fbfcfd_16%,#eef3f6_100%)]">
      <main className="mx-auto w-full max-w-[1360px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <div className="mb-4">
          <Button asChild variant="outline">
            <Link href="/dashboard/doctor">Zuruck zum Dashboard</Link>
          </Button>
        </div>

        <div className="rounded-[2.25rem] border border-slate-200/80 bg-white/85 p-4 shadow-[0_28px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1120px] space-y-6">
            <section className="rounded-[1.9rem] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_55%,#eef4f7_100%)] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:p-7">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex min-w-0 flex-1 flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="flex shrink-0 flex-col items-center gap-2">
                    <div
                      className={`relative flex h-28 w-28 items-center justify-center overflow-hidden ring-1 transition ${photoFrameClasses.headerFrame} ${
                        photoItem && itemVisibility[photoItem.id] !== false
                          ? "bg-slate-100 ring-slate-200"
                          : "bg-slate-100/70 opacity-55 ring-slate-200"
                      }`}
                    >
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
                    <p className="text-center text-xs font-medium text-slate-500">
                      Zuschnitt wird im Profil verwaltet
                    </p>
                    {photoItem ? (
                      <button
                        type="button"
                        onClick={() => toggleItemVisibility(photoItem.id)}
                        className="text-xs font-medium text-slate-500 transition hover:text-slate-700"
                      >
                        {itemVisibility[photoItem.id] !== false ? "Foto ausblenden" : "Foto einblenden"}
                      </button>
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Kopfbereich
                      </p>
                      {nameItem ? (
                        <button
                          type="button"
                          onClick={() => toggleItemVisibility(nameItem.id)}
                          className={`block text-left text-2xl font-semibold tracking-tight transition sm:text-[2rem] ${
                            itemVisibility[nameItem.id] !== false
                              ? "text-slate-950 hover:text-slate-700"
                              : "text-slate-400 opacity-45 hover:opacity-70"
                          }`}
                        >
                          {nameItem.value}
                        </button>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {contactHeaderItems.map((item) => {
                        const Icon = getContactIcon(item.kind);
                        const isActive = itemVisibility[item.id] !== false;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleItemVisibility(item.id)}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
                              isActive
                                ? "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-700"
                                : "border-slate-200 bg-white/70 text-slate-400 opacity-55 hover:opacity-75"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5 text-slate-400" />
                            <span>{item.value}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-3 xl:w-auto xl:min-w-[420px] xl:max-w-[460px]">
                  <div className="rounded-[1.4rem] border border-slate-200 bg-white/80 p-4 shadow-sm">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor="cv-template-select"
                          className="text-sm font-medium text-slate-700"
                        >
                          CV-Design
                        </label>
                        <select
                          id="cv-template-select"
                          value={selectedTemplate}
                          onChange={(event) =>
                            updateSelectedTemplate(event.target.value as CvTemplateKey)
                          }
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus-visible:ring-2 focus-visible:ring-slate-300"
                        >
                          {CV_TEMPLATE_OPTIONS.map((template) => (
                            <option key={template.key} value={template.key}>
                              {template.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2 xl:items-end">
                        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-xl"
                            disabled={isPending || !availableSectionKeys.length}
                            onClick={resetLayout}
                          >
                            Standard wiederherstellen
                          </Button>
                          <Button
                            type="button"
                            className="h-11 rounded-xl"
                            disabled={isPending || !isDirty}
                            onClick={saveLayout}
                          >
                            {isPending ? "Layout wird gespeichert..." : "Layout speichern"}
                          </Button>
                          <Button asChild variant="outline" className="h-11 rounded-xl">
                            <Link
                              href={{
                                pathname: "/dashboard/doctor/cv/export",
                                query: { template: selectedTemplate }
                              }}
                              target="_blank"
                              rel="noreferrer"
                            >
                              PDF exportieren
                            </Link>
                          </Button>
                          <Button asChild variant="outline" className="h-11 rounded-xl">
                            <Link
                              href={{
                                pathname: "/dashboard/doctor/cv/pdf-preview",
                                query: { template: selectedTemplate }
                              }}
                              target="_blank"
                              rel="noreferrer"
                            >
                              CV-Vorschau oeffnen
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {statusMessage ? <p className="text-sm text-slate-600">{statusMessage}</p> : null}

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
                    className={`${getSectionCardClass(definition.emphasis)} transition ${
                      dropTargetKey === sectionKey ? "border-sky-200 bg-sky-50/60" : ""
                    }`}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                          {definition.title}
                        </h3>
                        <p className="text-sm text-slate-600">{definition.helper}</p>
                      </div>
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
              <section className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(135deg,#f8fbfd_0%,#eef5f8_100%)] p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Naechster Schritt
                    </p>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Motivationsschreiben aus Ihrem Profil erstellen
                    </h3>
                    <p className="text-sm text-slate-600">
                      Nutzen Sie Ihren fertigen Lebenslauf als Grundlage fuer ein professionelles deutsches Motivationsschreiben.
                    </p>
                  </div>
                  <Button asChild className="h-11 rounded-xl sm:shrink-0">
                    <Link href="/dashboard/doctor/cover-letter">
                      Motivationsschreiben mit KI erstellen
                    </Link>
                  </Button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
