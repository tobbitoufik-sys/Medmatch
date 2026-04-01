import type { CvTemplateKey } from "@/components/cv/template-registry";

export type CvPhotoShape = "circle" | "roundedRect";

export function getCvTemplatePhotoShape(template: CvTemplateKey): CvPhotoShape {
  if (template === "clinicEdge") {
    return "roundedRect";
  }

  return "circle";
}

export function getCvPhotoFrameClasses(shape: CvPhotoShape) {
  return {
    headerFrame: shape === "circle" ? "rounded-full" : "rounded-[1.85rem]",
    modalCanvas: shape === "circle" ? "rounded-full" : "rounded-[1.85rem]",
    modalPreview: shape === "circle" ? "rounded-full" : "rounded-[1.6rem]"
  };
}
