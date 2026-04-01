import type { CvSectionKey } from "@/types";

export const DEFAULT_CV_SECTION_ORDER: CvSectionKey[] = [
  "work_experience",
  "education",
  "qualifications",
  "languages",
  "trainings",
  "additional_sections"
];

export function normalizeCvSectionOrder(
  input: string[] | null | undefined,
  availableSectionKeys?: CvSectionKey[]
) {
  const available = new Set(availableSectionKeys ?? DEFAULT_CV_SECTION_ORDER);
  const next: CvSectionKey[] = [];

  for (const key of input ?? []) {
    if (!available.has(key as CvSectionKey)) continue;
    if (next.includes(key as CvSectionKey)) continue;
    next.push(key as CvSectionKey);
  }

  for (const key of DEFAULT_CV_SECTION_ORDER) {
    if (!available.has(key)) continue;
    if (!next.includes(key)) next.push(key);
  }

  return next;
}
