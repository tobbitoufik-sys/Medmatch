import type {
  DoctorCvLayout,
  CvSectionKey,
  CvEducationItem,
  CvTrainingItem,
  CvWorkExperienceItem,
  DoctorCvModel
} from "@/types";

export type CvPdfEntry = {
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

export type CvPdfMainSectionOrderKey =
  | "workExperience"
  | "education"
  | "fortbildungen"
  | "additionalSections"
  | "customBlock";

export type CvPdfData = {
  identity: {
    fullName: string;
    subtitle?: string | null;
    photoUrl?: string | null;
    preparedPhotoSrc?:
      | string
      | {
          data: Buffer;
          format: "png";
        }
      | null;
    initials: string;
    photoPresentation?: DoctorCvLayout["photo_presentation"] | null;
  };
  contact: string[];
  workExperience: CvPdfEntry[];
  education: CvPdfEntry[];
  fortbildungen: CvPdfEntry[];
  languages: string[];
  additionalSections: CvPdfEntry[];
  mainSectionOrder: CvPdfMainSectionOrderKey[];
  customBlock?: {
    title?: string | null;
    entries: CvPdfEntry[];
  } | null;
};

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  januar: 0,
  january: 0,
  feb: 1,
  februar: 1,
  february: 1,
  mar: 2,
  maerz: 2,
  m\u00e4rz: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  mai: 4,
  jun: 5,
  juni: 5,
  june: 5,
  jul: 6,
  juli: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  oktober: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  dez: 11,
  dezember: 11,
  december: 11
};

function parseMonthYear(value?: string | Date): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const numericMatch = trimmed.match(/^(\d{1,2})\.(\d{4})$/);

  if (numericMatch) {
    return new Date(Number(numericMatch[2]), Number(numericMatch[1]) - 1, 1);
  }

  const monthYearMatch = trimmed
    .replace(/^since\s+/i, "")
    .replace(/^seit\s+/i, "")
    .match(/^([A-Za-z\u00c4\u00d6\u00dc\u00e4\u00f6\u00fc]+)\s+(\d{4})$/);

  if (monthYearMatch) {
    const monthIndex = MONTH_INDEX[monthYearMatch[1].toLowerCase()];

    if (monthIndex !== undefined) {
      return new Date(Number(monthYearMatch[2]), monthIndex, 1);
    }
  }

  const parsedDate = new Date(trimmed);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatMonthYear(date?: string | Date): string {
  const d = parseMonthYear(date);

  if (!d) {
    return "";
  }

  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${month}.${year}`;
}

function formatDateRange(start?: string, end?: string) {
  const from = formatMonthYear(start);
  const to = end ? formatMonthYear(end) : "heute";

  if (!from) {
    return to === "heute" ? "" : to;
  }

  return `${from} \u2013 ${to}`;
}

function normalizeDateLabel(dateLabel?: string | null) {
  if (!dateLabel) {
    return dateLabel ?? null;
  }

  const trimmed = dateLabel.trim();

  if (!trimmed) {
    return null;
  }

  if (/^(since|seit)\s+/i.test(trimmed)) {
    const sinceLabel = formatMonthYear(trimmed.replace(/^(since|seit)\s+/i, ""));
    return sinceLabel ? `seit ${sinceLabel}` : null;
  }

  const rangeParts = trimmed.split(/\s*[\u2013\u2014-]\s*/);

  if (rangeParts.length >= 2) {
    const endPart = rangeParts[1].trim();

    if (/^(present|heute)$/i.test(endPart)) {
      return formatDateRange(rangeParts[0].trim());
    }

    return formatDateRange(rangeParts[0].trim(), endPart);
  }

  if (/^(present|heute)$/i.test(trimmed)) {
    return "heute";
  }

  return formatDateRange(trimmed);
}

function mapWorkExperienceItem(item: CvWorkExperienceItem): CvPdfEntry {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.organization_line,
    dateLabel: normalizeDateLabel(item.date_label),
    bullets: item.bullets
  };
}

function mapEducationItem(item: CvEducationItem): CvPdfEntry {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    meta: item.meta,
    dateLabel: normalizeDateLabel(item.date_label),
    itemType: item.item_type,
    issuerLine: item.issuer_line,
    sinceLabel: normalizeDateLabel(item.since_label)
  };
}

function mapTrainingItem(item: CvTrainingItem): CvPdfEntry {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.detail,
    dateLabel: normalizeDateLabel(item.date_label)
  };
}

function buildPdfMainSectionOrder(params: {
  sectionOrder?: string[] | null;
  hasWorkExperience: boolean;
  hasEducation: boolean;
  hasFortbildungen: boolean;
  hasAdditionalSections: boolean;
  hasCustomBlock: boolean;
}) {
  const mapping: Partial<Record<CvSectionKey | "custom_block", CvPdfMainSectionOrderKey>> = {
    work_experience: "workExperience",
    education: "education",
    trainings: "fortbildungen",
    additional_sections: "additionalSections",
    custom_block: "customBlock"
  };

  const available = new Set<CvPdfMainSectionOrderKey>();

  if (params.hasWorkExperience) available.add("workExperience");
  if (params.hasEducation) available.add("education");
  if (params.hasFortbildungen) available.add("fortbildungen");
  if (params.hasAdditionalSections) available.add("additionalSections");
  if (params.hasCustomBlock) available.add("customBlock");

  const next: CvPdfMainSectionOrderKey[] = [];

  for (const key of params.sectionOrder ?? []) {
    const mapped = mapping[key as CvSectionKey | "custom_block"];
    if (!mapped || !available.has(mapped) || next.includes(mapped)) continue;
    next.push(mapped);
  }

  for (const key of [
    "workExperience",
    "education",
    "fortbildungen",
    "additionalSections",
    "customBlock"
  ] as CvPdfMainSectionOrderKey[]) {
    if (available.has(key) && !next.includes(key)) {
      next.push(key);
    }
  }

  return next;
}

export function buildCvPdfData(
  cvModel: DoctorCvModel,
  sectionOrder?: string[] | null
): CvPdfData {
  const customBlock =
    cvModel.customBlock
      ? {
          title: cvModel.customBlock.title,
          entries: cvModel.customBlock.entries.map((entry) => ({
            id: entry.id,
            title: entry.content,
            subtitle: entry.description,
            dateLabel: normalizeDateLabel(entry.date_label)
          }))
        }
      : null;

  return {
    identity: {
      fullName: cvModel.header.full_name,
      subtitle: cvModel.header.subtitle,
      photoUrl: cvModel.header.photo_url,
      initials: cvModel.header.initials,
      photoPresentation: cvModel.header.photo_presentation ?? null
    },
    contact: [...cvModel.personalInfo.items, cvModel.personalInfo.address_line].filter(
      (item): item is string => Boolean(item)
    ),
    workExperience: cvModel.workExperience.map(mapWorkExperienceItem),
    education: cvModel.education.map(mapEducationItem),
    fortbildungen: cvModel.trainings.map(mapTrainingItem),
    languages: cvModel.languages.map((item) => item.label),
    additionalSections: cvModel.additionalSections.map((item) => ({
      id: item.id,
      title: item.title,
      bullets: item.bullets
    })),
    mainSectionOrder: buildPdfMainSectionOrder({
      sectionOrder,
      hasWorkExperience: cvModel.workExperience.length > 0,
      hasEducation: cvModel.education.length > 0,
      hasFortbildungen: cvModel.trainings.length > 0,
      hasAdditionalSections: cvModel.additionalSections.length > 0,
      hasCustomBlock: !!customBlock && (!!customBlock.title || customBlock.entries.length > 0)
    }),
    customBlock
  };
}
