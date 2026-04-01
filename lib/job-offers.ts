import type { JobOfferContractType } from "@/types";

export const jobOfferContractTypes = ["honorar", "befristet", "unbefristet"] as const;

export const jobOfferContractTypeLabels: Record<JobOfferContractType, string> = {
  honorar: "Honorar",
  befristet: "Befristet",
  unbefristet: "Unbefristet"
};

export function normalizeJobOfferContractType(value: string | null | undefined): JobOfferContractType {
  const normalized = value?.trim().toLowerCase() ?? "";

  switch (normalized) {
    case "honorar":
    case "locum":
    case "freelance":
    case "freelancer":
    case "contract":
      return "honorar";
    case "befristet":
    case "fixed term":
    case "fixed-term":
    case "temporary":
    case "temp":
      return "befristet";
    case "unbefristet":
    case "permanent":
    case "full time":
    case "full-time":
      return "unbefristet";
    default:
      return "unbefristet";
  }
}

export function getJobOfferContractTypeLabel(value: string | null | undefined) {
  return jobOfferContractTypeLabels[normalizeJobOfferContractType(value)];
}
