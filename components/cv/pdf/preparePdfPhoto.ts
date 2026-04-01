import sharp from "sharp";

import type { CvPhotoShape } from "@/components/cv/cv-template-photo-shape";
import { normalizeCvPhotoPresentation } from "@/components/cv/v2/cv-photo-state";
import type { DoctorCvLayout } from "@/types";

type PreparePdfPhotoInput = {
  photoUrl?: string | null;
  photoPresentation?: DoctorCvLayout["photo_presentation"] | null;
  frameWidth: number;
  frameHeight: number;
  frameRadius: number;
  shape: CvPhotoShape;
};

type PreparedPdfPhoto = {
  data: Buffer;
  format: "png";
};

function createMaskSvg({
  frameWidth,
  frameHeight,
  frameRadius,
  shape
}: Pick<PreparePdfPhotoInput, "frameWidth" | "frameHeight" | "frameRadius" | "shape">) {
  if (shape === "circle") {
    const radius = Math.min(frameWidth, frameHeight) / 2;

    return Buffer.from(
      `<svg width="${frameWidth}" height="${frameHeight}" xmlns="http://www.w3.org/2000/svg"><circle cx="${frameWidth / 2}" cy="${frameHeight / 2}" r="${radius}" fill="white" /></svg>`
    );
  }

  const radius = Math.min(frameRadius, frameWidth / 2, frameHeight / 2);

  return Buffer.from(
    `<svg width="${frameWidth}" height="${frameHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="${frameWidth}" height="${frameHeight}" rx="${radius}" ry="${radius}" fill="white" /></svg>`
  );
}

export async function preparePdfPhoto({
  photoUrl,
  photoPresentation,
  frameWidth,
  frameHeight,
  frameRadius,
  shape
}: PreparePdfPhotoInput) {
  if (!photoUrl) {
    return null;
  }

  try {
    const response = await fetch(photoUrl, { cache: "no-store" });

    if (!response.ok) {
      return null;
    }

    const sourceBuffer = Buffer.from(await response.arrayBuffer());
    const metadata = await sharp(sourceBuffer).metadata();

    if (!metadata.width || !metadata.height) {
      return null;
    }

    const presentation = normalizeCvPhotoPresentation(photoPresentation, shape);
    const fitScale = Math.min(frameWidth / metadata.width, frameHeight / metadata.height);
    const baseFittedWidth = metadata.width * fitScale;
    const baseFittedHeight = metadata.height * fitScale;
    const renderedWidth = Math.max(1, Math.round(baseFittedWidth * presentation.zoom));
    const renderedHeight = Math.max(1, Math.round(baseFittedHeight * presentation.zoom));
    const shiftX = (baseFittedWidth * presentation.offsetXPercent) / 100;
    const shiftY = (baseFittedHeight * presentation.offsetYPercent) / 100;
    const left = Math.round((frameWidth - renderedWidth) / 2 + shiftX);
    const top = Math.round((frameHeight - renderedHeight) / 2 + shiftY);

    const fittedImage = await sharp(sourceBuffer)
      .resize(renderedWidth, renderedHeight, { fit: "fill" })
      .png()
      .toBuffer();

    const preparedBuffer = await sharp({
      create: {
        width: frameWidth,
        height: frameHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      }
    })
      .composite([
        {
          input: fittedImage,
          left,
          top
        }
      ])
      .composite([
        {
          input: createMaskSvg({ frameWidth, frameHeight, frameRadius, shape }),
          blend: "dest-in"
        }
      ])
      .png()
      .toBuffer();

    const preparedMetadata = await sharp(preparedBuffer).metadata();

    if (
      !preparedBuffer.length ||
      preparedMetadata.width !== frameWidth ||
      preparedMetadata.height !== frameHeight
    ) {
      return null;
    }

    const preparedStats = await sharp(preparedBuffer).stats();
    const alphaChannel = preparedStats.channels[3];

    if (alphaChannel && alphaChannel.max <= 0) {
      return null;
    }

    return {
      data: preparedBuffer,
      format: "png"
    } satisfies PreparedPdfPhoto;
  } catch {
    return null;
  }
}
