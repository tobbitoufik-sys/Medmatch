"use client";

import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";

type CvEntryListItem = {
  id: string;
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  dateLabel?: string | null;
  itemType?: "education" | "medical_license";
  issuerLine?: string | null;
  sinceLabel?: string | null;
  bullets?: string[];
};

type CvEntryListProps = {
  items: CvEntryListItem[];
  itemVisibility?: Record<string, boolean>;
  draggedId?: string | null;
  dropTargetId?: string | null;
  emptyHint?: string | null;
  reorderLabel: string;
  draggable?: boolean;
  onToggleVisibility?: (id: string) => void;
  onDragStart?: (id: string) => void;
  onDragOver?: (id: string, event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (id: string, event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
  footer?: ReactNode;
};

export function CvEntryList({
  items,
  itemVisibility = {},
  draggedId = null,
  dropTargetId = null,
  emptyHint = null,
  reorderLabel,
  draggable = false,
  onToggleVisibility,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  footer
}: CvEntryListProps) {
  if (!items.length) {
    return emptyHint ? (
      <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
        {emptyHint}
      </div>
    ) : null;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const isIncluded = itemVisibility[item.id] !== false;
        const isMedicalLicense = item.itemType === "medical_license";

        return (
          <div
            key={item.id}
            draggable={draggable}
            onClick={() => onToggleVisibility?.(item.id)}
            onDragStart={draggable ? () => onDragStart?.(item.id) : undefined}
            onDragOver={
              draggable
                ? (event) => {
                    event.preventDefault();
                    onDragOver?.(item.id, event);
                  }
                : undefined
            }
            onDrop={
              draggable
                ? (event) => {
                    event.preventDefault();
                    onDrop?.(item.id, event);
                  }
                : undefined
            }
            onDragEnd={draggable ? onDragEnd : undefined}
            className={`group relative border-b border-slate-100 pb-4 last:border-b-0 last:pb-0 ${
              dropTargetId === item.id ? "bg-sky-50/60" : ""
            } ${draggedId === item.id ? "opacity-70" : ""} ${
              onToggleVisibility ? "cursor-pointer" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <button
                type="button"
                draggable={draggable}
                aria-label={reorderLabel}
                onClick={(event) => event.stopPropagation()}
                onDragStart={
                  draggable
                    ? (event) => {
                        event.stopPropagation();
                        onDragStart?.(item.id);
                      }
                    : undefined
                }
                onDragEnd={
                  draggable
                    ? (event) => {
                        event.stopPropagation();
                        onDragEnd?.();
                      }
                    : undefined
                }
                className="mt-0.5 hidden cursor-grab rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 sm:inline-flex"
              >
                <GripVertical className="h-4 w-4" />
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`font-semibold ${
                          isIncluded ? "text-slate-900" : "text-slate-400"
                        }`}
                      >
                        {item.title}
                      </p>
                      {!isIncluded ? (
                        <span className="text-xs text-muted-foreground">
                          Ausgeblendet - zum Einblenden klicken
                        </span>
                      ) : null}
                    </div>
                    {item.subtitle ? (
                      <p
                        className={`text-sm ${
                          isIncluded ? "text-slate-600" : "text-slate-400"
                        }`}
                      >
                        {item.subtitle}
                      </p>
                    ) : null}
                    {isMedicalLicense && item.issuerLine ? (
                      <p
                        className={`text-sm ${
                          isIncluded ? "text-slate-600" : "text-slate-400"
                        }`}
                      >
                        {item.issuerLine}
                      </p>
                    ) : null}
                    {item.meta ? (
                      <p
                        className={`text-sm ${
                          isIncluded ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        {item.meta}
                      </p>
                    ) : null}
                  </div>
                  {(item.dateLabel || (isMedicalLicense ? item.sinceLabel : null)) ? (
                    <p
                      className={`whitespace-nowrap text-sm ${
                        isIncluded ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      {isMedicalLicense ? item.sinceLabel : item.dateLabel}
                    </p>
                  ) : null}
                </div>

                {item.bullets?.length ? (
                  <ul
                    className={`mt-2 space-y-1 text-sm ${
                      isIncluded ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    {item.bullets.map((bullet) => (
                      <li key={bullet}>- {bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}

      {footer}
    </div>
  );
}
