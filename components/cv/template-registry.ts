export const CV_TEMPLATE_OPTIONS = [
  { key: "modern", label: "Modern" },
  { key: "medmatchPremium", label: "MedMatch Premium" },
  { key: "clinicEdge", label: "Clinic Edge" },
  { key: "softTimeline", label: "Soft Timeline" },
  { key: "slateProfile", label: "Slate Profile" },
  { key: "roseSidebar", label: "Rose Sidebar" },
  { key: "nordHeader", label: "Nord Header" },
  { key: "sandEditorial", label: "Sand Editorial" },
  { key: "blueLedger", label: "Blue Ledger" },
  { key: "monoFrame", label: "Mono Frame" },
  { key: "aquaGrid", label: "Aqua Grid" }
] as const;

export type CvTemplateKey = (typeof CV_TEMPLATE_OPTIONS)[number]["key"];

export function isCvTemplateKey(value: string): value is CvTemplateKey {
  return CV_TEMPLATE_OPTIONS.some((template) => template.key === value);
}
