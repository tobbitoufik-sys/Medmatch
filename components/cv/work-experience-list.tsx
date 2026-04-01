"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { reorderDoctorExperiencesAction } from "@/lib/actions";
import { CvEntryList } from "@/components/cv/cv-entry-list";
import type { CvWorkExperienceItem, DoctorExperience } from "@/types";

function reorderList<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function WorkExperienceList({
  experiences,
  items,
  itemVisibility,
  onToggleVisibility
}: {
  experiences: DoctorExperience[];
  items: CvWorkExperienceItem[];
  itemVisibility?: Record<string, boolean>;
  onToggleVisibility?: (id: string) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [orderedExperiences, setOrderedExperiences] = useState(experiences);
  const [orderedItems, setOrderedItems] = useState(items);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  useEffect(() => {
    setOrderedExperiences(experiences);
    setOrderedItems(items);
  }, [experiences, items]);

  const experienceIds = useMemo(
    () => orderedExperiences.map((experience) => experience.id),
    [orderedExperiences]
  );

  async function persistOrder(nextExperiences: DoctorExperience[]) {
    const nextIds = nextExperiences.map((experience) => experience.id);

    startTransition(async () => {
      try {
        await reorderDoctorExperiencesAction(nextIds);
        router.refresh();
      } catch {
        setOrderedExperiences(experiences);
        setOrderedItems(items);
      }
    });
  }

  function moveItem(targetId: string) {
    if (!draggedId || draggedId === targetId) return;

    const fromIndex = orderedExperiences.findIndex((experience) => experience.id === draggedId);
    const toIndex = orderedExperiences.findIndex((experience) => experience.id === targetId);

    if (fromIndex < 0 || toIndex < 0) return;

    const nextExperiences = reorderList(orderedExperiences, fromIndex, toIndex);
    const nextItems = reorderList(orderedItems, fromIndex, toIndex);
    setOrderedExperiences(nextExperiences);
    setOrderedItems(nextItems);
    setDraggedId(null);
    setDropTargetId(null);
    void persistOrder(nextExperiences);
  }

  return (
    <CvEntryList
      items={orderedItems.map((experience) => ({
        id: experience.id,
        title: experience.title,
        subtitle: experience.organization_line,
        dateLabel: experience.date_label,
        bullets: experience.bullets
      }))}
      itemVisibility={itemVisibility}
      reorderLabel="Berufserfahrung neu anordnen"
      draggable={!isPending}
      onToggleVisibility={onToggleVisibility}
      draggedId={draggedId}
      dropTargetId={dropTargetId}
      onDragStart={(id) => setDraggedId(id)}
      onDragOver={(id) => setDropTargetId(id)}
      onDrop={(id) => moveItem(id)}
      onDragEnd={() => {
        setDraggedId(null);
        setDropTargetId(null);
      }}
      footer={
        <div className="text-xs text-slate-500">
          {isPending
            ? "Reihenfolge wird gespeichert..."
            : experienceIds.length > 1
              ? "Ziehen Sie einen Eintrag, um den Abschnitt Berufserfahrung neu anzuordnen."
              : ""}
        </div>
      }
    />
  );
}
