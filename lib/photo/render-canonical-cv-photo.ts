import sharp from "sharp";

import { normalizePhotoCropPresentation } from "@/components/shared/photo/photo-crop-state";

type RenderCanonicalCvPhotoInput = {
  sourceBuffer: Buffer;
  photoPresentation: unknown;
  size?: number;
};

export async function renderCanonicalCvPhoto({
  sourceBuffer,
  photoPresentation,
  size = 1200
}: RenderCanonicalCvPhotoInput) {
  const metadata = await sharp(sourceBuffer).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Source photo dimensions are unavailable.");
  }

  const frameSize = Math.max(1, Math.round(size));
  const presentation = normalizePhotoCropPresentation(photoPresentation, "circle");
  const fitScale = Math.min(frameSize / metadata.width, frameSize / metadata.height);
  const baseFittedWidth = metadata.width * fitScale;
  const baseFittedHeight = metadata.height * fitScale;
  const renderedWidth = Math.max(1, Math.round(baseFittedWidth * presentation.zoom));
  const renderedHeight = Math.max(1, Math.round(baseFittedHeight * presentation.zoom));
  const shiftX = (baseFittedWidth * presentation.offsetXPercent) / 100;
  const shiftY = (baseFittedHeight * presentation.offsetYPercent) / 100;
  const left = Math.round((frameSize - renderedWidth) / 2 + shiftX);
  const top = Math.round((frameSize - renderedHeight) / 2 + shiftY);
  const leftPadding = Math.max(left, 0);
  const topPadding = Math.max(top, 0);
  const rightPadding = Math.max(frameSize - (left + renderedWidth), 0);
  const bottomPadding = Math.max(frameSize - (top + renderedHeight), 0);
  const extractLeft = Math.max(-left, 0);
  const extractTop = Math.max(-top, 0);

  const paddedWidth = leftPadding + renderedWidth + rightPadding;
  const paddedHeight = topPadding + renderedHeight + bottomPadding;

  if (
    renderedWidth < 1 ||
    renderedHeight < 1 ||
    paddedWidth < frameSize ||
    paddedHeight < frameSize
  ) {
    throw new Error(
      `Invalid CV photo render dimensions: rendered=${renderedWidth}x${renderedHeight}, padded=${paddedWidth}x${paddedHeight}, frame=${frameSize}x${frameSize}.`
    );
  }

  const fittedImage = await sharp(sourceBuffer)
    .resize(renderedWidth, renderedHeight, { fit: "fill" })
    .ensureAlpha()
    .png()
    .toBuffer();

  const extractedImage = await sharp(fittedImage)
    .extend({
      top: topPadding,
      bottom: bottomPadding,
      left: leftPadding,
      right: rightPadding,
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .extract({
      left: extractLeft,
      top: extractTop,
      width: frameSize,
      height: frameSize
    })
    .png()
    .toBuffer();

  const cornerRadius =
    presentation.shape === "roundedRect" ? Math.round(frameSize * 0.18) : frameSize / 2;
  const maskSvg =
    presentation.shape === "circle"
      ? `<svg width="${frameSize}" height="${frameSize}" viewBox="0 0 ${frameSize} ${frameSize}" xmlns="http://www.w3.org/2000/svg"><circle cx="${frameSize / 2}" cy="${frameSize / 2}" r="${frameSize / 2}" fill="white"/></svg>`
      : `<svg width="${frameSize}" height="${frameSize}" viewBox="0 0 ${frameSize} ${frameSize}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${frameSize}" height="${frameSize}" rx="${cornerRadius}" ry="${cornerRadius}" fill="white"/></svg>`;

  try {
    return await sharp(extractedImage)
      .composite([
        {
          input: Buffer.from(maskSvg),
          blend: "dest-in"
        }
      ])
      .png()
      .toBuffer();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown sharp composite failure.";

    throw new Error(
      `Unable to finalize the prepared CV photo mask: ${message} (frame=${frameSize}x${frameSize}, rendered=${renderedWidth}x${renderedHeight}, extract=${extractLeft},${extractTop}).`
    );
  }
}
