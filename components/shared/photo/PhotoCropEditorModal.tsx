"use client";

import { useEffect, useRef, useState } from "react";

import { getCvPhotoFrameClasses } from "@/components/cv/cv-template-photo-shape";
import { Button } from "@/components/ui/button";
import {
  getPhotoCropImageStyle,
  type PhotoCropState
} from "@/components/shared/photo/photo-crop-state";

type Props = {
  open: boolean;
  value: PhotoCropState;
  isSaving?: boolean;
  errorMessage?: string | null;
  title?: string;
  description?: string;
  saveLabel?: string;
  onCancel: () => void;
  onSave: (value: PhotoCropState) => Promise<void>;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.1;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function PhotoCropEditorModal({
  open,
  value,
  isSaving = false,
  errorMessage,
  title = "Foto bearbeiten",
  description = "Ziehen Sie das Bild im Rahmen und passen Sie den Zoom an.",
  saveLabel = "Foto uebernehmen",
  onCancel,
  onSave
}: Props) {
  const [draft, setDraft] = useState<PhotoCropState>(value);
  const dragStateRef = useRef<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const frameClasses = getCvPhotoFrameClasses(value.shape);

  useEffect(() => {
    if (open) {
      setDraft(value);
    }
  }, [open, value]);

  if (!open) {
    return null;
  }

  function updateZoom(nextZoom: number) {
    setDraft((current) => ({
      ...current,
      zoom: clamp(Number(nextZoom.toFixed(2)), MIN_ZOOM, MAX_ZOOM)
    }));
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (isSaving) {
      return;
    }

    dragStateRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (isSaving || !dragStateRef.current || !canvasRef.current) {
      return;
    }

    const deltaX = event.clientX - dragStateRef.current.x;
    const deltaY = event.clientY - dragStateRef.current.y;
    const width = canvasRef.current.clientWidth || 1;
    const height = canvasRef.current.clientHeight || 1;

    dragStateRef.current = { x: event.clientX, y: event.clientY };

    setDraft((current) => ({
      ...current,
      offsetXPercent: clamp(current.offsetXPercent + (deltaX / width) * 100, -45, 45),
      offsetYPercent: clamp(current.offsetYPercent + (deltaY / height) * 100, -45, 45)
    }));
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    dragStateRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6">
      <div className="max-h-[92vh] w-full max-w-[880px] overflow-auto rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_32px_90px_rgba(15,23,42,0.18)] sm:p-7">
        <div className="flex flex-col gap-6">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Fotoeditor
            </p>
            <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
            <p className="text-sm text-slate-600">{description}</p>
            {errorMessage ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </div>
            ) : null}
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
              <div
                ref={canvasRef}
                className={`relative mx-auto flex aspect-square w-full cursor-grab items-center justify-center overflow-hidden bg-slate-100 ring-1 ring-slate-200 active:cursor-grabbing ${frameClasses.modalCanvas}`}
                style={{ maxWidth: "min(100%, 420px)", maxHeight: "52vh" }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                {draft.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={draft.imageUrl}
                    alt="CV-Foto"
                    className="pointer-events-none absolute left-1/2 top-1/2 max-h-full max-w-full"
                    style={getPhotoCropImageStyle(draft)}
                  />
                ) : (
                  <span className="text-5xl font-semibold tracking-[0.2em] text-slate-400">
                    {draft.initials}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-5 rounded-[1.75rem] border border-slate-200 bg-white p-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Zoom</span>
                  <span className="text-sm text-slate-500">{draft.zoom.toFixed(1)}x</span>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSaving}
                    onClick={() => updateZoom(draft.zoom - ZOOM_STEP)}
                  >
                    -
                  </Button>
                  <input
                    type="range"
                    min={MIN_ZOOM}
                    max={MAX_ZOOM}
                    step={ZOOM_STEP}
                    value={draft.zoom}
                    disabled={isSaving}
                    onChange={(event) => updateZoom(Number(event.target.value))}
                    className="w-full accent-slate-900"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSaving}
                    onClick={() => updateZoom(draft.zoom + ZOOM_STEP)}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700">Vorschau</p>
                <div
                  className={`relative flex h-32 w-32 items-center justify-center overflow-hidden bg-slate-100 ring-1 ring-slate-200 ${frameClasses.modalPreview}`}
                >
                  {draft.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={draft.imageUrl}
                      alt="Foto-Vorschau"
                      className="pointer-events-none absolute left-1/2 top-1/2 max-h-full max-w-full"
                      style={getPhotoCropImageStyle(draft)}
                    />
                  ) : (
                    <span className="text-2xl font-semibold tracking-[0.2em] text-slate-400">
                      {draft.initials}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      offsetYPercent: clamp(current.offsetYPercent - 4, -45, 45)
                    }))
                  }
                >
                  Nach oben
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      offsetYPercent: clamp(current.offsetYPercent + 4, -45, 45)
                    }))
                  }
                >
                  Nach unten
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      offsetXPercent: clamp(current.offsetXPercent - 4, -45, 45)
                    }))
                  }
                >
                  Nach links
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      offsetXPercent: clamp(current.offsetXPercent + 4, -45, 45)
                    }))
                  }
                >
                  Nach rechts
                </Button>
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button type="button" variant="outline" disabled={isSaving} onClick={onCancel}>
                  Abbrechen
                </Button>
                <Button type="button" disabled={isSaving} onClick={async () => await onSave(draft)}>
                  {isSaving ? "Foto wird gespeichert..." : saveLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
