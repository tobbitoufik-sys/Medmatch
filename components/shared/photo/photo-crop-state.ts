import type { CSSProperties } from "react";

import type { CvPhotoShape } from "@/components/cv/cv-template-photo-shape";

export type PhotoCropPresentation = {
  shape: CvPhotoShape;
  version: 1;
  zoom: number;
  offsetXPercent: number;
  offsetYPercent: number;
};

export type PhotoCropState = PhotoCropPresentation & {
  imageUrl: string | null;
  initials: string;
};

export const DEFAULT_PHOTO_CROP_PRESENTATION: PhotoCropPresentation = {
  shape: "circle",
  version: 1,
  zoom: 1,
  offsetXPercent: 0,
  offsetYPercent: 0
};

export function normalizePhotoCropPresentation(
  value: unknown,
  fallbackShape: CvPhotoShape = "circle"
): PhotoCropPresentation {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...DEFAULT_PHOTO_CROP_PRESENTATION, shape: fallbackShape };
  }

  const record = value as Record<string, unknown>;
  const zoom =
    typeof record.zoom === "number" && Number.isFinite(record.zoom)
      ? Math.min(Math.max(record.zoom, 1), 2.5)
      : DEFAULT_PHOTO_CROP_PRESENTATION.zoom;
  const offsetXPercent =
    typeof record.offsetXPercent === "number" && Number.isFinite(record.offsetXPercent)
      ? Math.min(Math.max(record.offsetXPercent, -45), 45)
      : typeof record.offsetX === "number" && Number.isFinite(record.offsetX)
        ? Math.min(Math.max(record.offsetX, -45), 45)
        : DEFAULT_PHOTO_CROP_PRESENTATION.offsetXPercent;
  const offsetYPercent =
    typeof record.offsetYPercent === "number" && Number.isFinite(record.offsetYPercent)
      ? Math.min(Math.max(record.offsetYPercent, -45), 45)
      : typeof record.offsetY === "number" && Number.isFinite(record.offsetY)
        ? Math.min(Math.max(record.offsetY, -45), 45)
        : DEFAULT_PHOTO_CROP_PRESENTATION.offsetYPercent;

  return {
    shape:
      record.shape === "roundedRect" || record.shape === "circle"
        ? record.shape
        : fallbackShape,
    version: 1,
    zoom,
    offsetXPercent,
    offsetYPercent
  };
}

export function createPhotoCropState(input: {
  imageUrl: string | null;
  initials: string;
  presentation?: unknown;
  shape: CvPhotoShape;
}): PhotoCropState {
  return {
    imageUrl: input.imageUrl,
    initials: input.initials,
    ...normalizePhotoCropPresentation(input.presentation, input.shape),
    shape: input.shape
  };
}

export function getPhotoCropImageStyle(
  state: Pick<PhotoCropState, "zoom" | "offsetXPercent" | "offsetYPercent">
): CSSProperties {
  return {
    transform: `translate(calc(-50% + ${state.offsetXPercent}%), calc(-50% + ${state.offsetYPercent}%)) scale(${state.zoom})`,
    transformOrigin: "center center"
  };
}

export function getPhotoCropObjectPosition(
  state: Pick<PhotoCropPresentation, "offsetXPercent" | "offsetYPercent">
) {
  return `${50 + state.offsetXPercent}% ${50 + state.offsetYPercent}%`;
}
