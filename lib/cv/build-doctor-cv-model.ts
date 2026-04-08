import type {
  CvAdditionalSectionItem,
  CvEducationItem,
  CvLanguageItem,
  DoctorCvLayout,
  CvQualificationItem,
  CvTrainingItem,
  CvWorkExperienceItem,
  DoctorLanguage,
  DoctorCvModel,
  DoctorProfile
} from "@/types";

function cleanText(value: string | null | undefined) {
  const next = value?.trim();
  return next ? next : null;
}

function formatMonthYear(value: string | null | undefined) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${month}.${year}`;
}

function formatDateRange(fromDate: string | null | undefined, toDate: string | null | undefined) {
  const fromLabel = formatMonthYear(fromDate);
  const toLabel = formatMonthYear(toDate);

  if (fromLabel && toLabel) return `${fromLabel} – ${toLabel}`;
  if (fromLabel) return `${fromLabel} – heute`;
  if (toLabel) return toLabel;
  return "Datum nicht angegeben";
}

function formatSinceDate(value: string | null | undefined) {
  const label = formatMonthYear(value);
  return label ? `seit ${label}` : null;
}

function getLicenseTitle(licenseType: DoctorProfile["license_type"]) {
  if (licenseType === "approbation") {
    return "Die deutsche Approbation";
  }

  if (licenseType === "berufserlaubnis") {
    return "Berufserlaubnis";
  }

  return null;
}

function joinUniqueParts(parts: Array<string | null | undefined>, separator: string) {
  const seen = new Set<string>();

  return parts
    .map((part) => cleanText(part))
    .filter((part): part is string => Boolean(part))
    .filter((part) => {
      const key = part.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(separator);
}

function getInitials(fullName: string) {
  const parts = fullName
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return "D";
  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function getFullName(profile: DoctorProfile | null, fallbackName: string | null | undefined) {
  const name = [cleanText(profile?.first_name), cleanText(profile?.last_name)]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || cleanText(fallbackName) || "Ihr Name";
}

function getPhotoUrl(path: string | null | undefined, supabaseUrl: string | null | undefined) {
  if (!path || !supabaseUrl) return null;
  return `${supabaseUrl}/storage/v1/object/public/doctor-profile-photos/${path}`;
}

function getExperienceBullets(description: string | null | undefined) {
  return (description ?? "")
    .split("\n")
    .map((line) => line.replace(/^[*-\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
}


function buildWorkExperience(
  profile: DoctorProfile | null,
  experiences: NonNullable<DoctorProfile["experiences"]>
): CvWorkExperienceItem[] {
  const sharedLocation = joinUniqueParts([profile?.city, profile?.country], ", ");

  return experiences.map((experience) => ({
    id: experience.id,
    title: cleanText(experience.title) || "Positionsbezeichnung",
    organization_line:
      joinUniqueParts([cleanText(experience.institution) || "Einrichtung", sharedLocation], " | ") ||
      null,
    date_label: formatDateRange(experience.from_date, experience.to_date),
    
    bullets: getExperienceBullets(experience.description)
  }));
}

function buildEducation(
  profile: DoctorProfile | null,
  educations: NonNullable<DoctorProfile["educations"]>
): CvEducationItem[] {
  const locationMeta = joinUniqueParts([profile?.city, profile?.country], ", ");
  const items: CvEducationItem[] = educations.map((education) => ({
    id: education.id,
    title:
      cleanText(education.degree_name) ||
      cleanText(education.education_university) ||
      "Ausbildung",
    subtitle: cleanText(education.education_university),
    meta: locationMeta || null,
    date_label: formatDateRange(education.from_date, education.to_date),
    item_type: "education" as const,
    issuer_line: null,
    since_label: null
  }));

  const licenseTitle = getLicenseTitle(profile?.license_type ?? "");

  if (licenseTitle) {
    items.push({
      id: "approbation-entry",
      title: licenseTitle,
      subtitle: null,
      meta: null,
      date_label: null,
      item_type: "medical_license",
      issuer_line: cleanText(profile?.license_issuer),
      since_label: formatSinceDate(profile?.license_since)
    });
  }

  return items;
}

function buildQualifications(profile: DoctorProfile | null): CvQualificationItem[] {
  void profile;
  return [];
}

function buildTrainings(trainings: NonNullable<DoctorProfile["trainings"]>): CvTrainingItem[] {
  return trainings
    .map((training) => ({
      id: training.id,
      title: cleanText(training.training_name) || "Fortbildung",
      detail: joinUniqueParts([training.certificate_name, training.institution], " | ") || null,
      date_label:
        formatMonthYear(training.from_date) || formatMonthYear(training.to_date)
          ? formatDateRange(training.from_date, training.to_date)
          : null
    }))
    .filter((training) => Boolean(training.title));
}

function buildLanguages(
  languages: string[] | null | undefined,
  doctorLanguages: DoctorLanguage[] | null | undefined
): CvLanguageItem[] {
  const structuredLanguages = (doctorLanguages ?? [])
    .map((language, index) => ({ language, index }))
    .sort((left, right) => {
      const leftOrder =
        typeof left.language.sort_order === "number" ? left.language.sort_order : left.index;
      const rightOrder =
        typeof right.language.sort_order === "number" ? right.language.sort_order : right.index;

      return leftOrder - rightOrder;
    })
    .map<CvLanguageItem | null>(({ language, index }) => {
      const name = cleanText(language.language_name);
      const cefrLevel = cleanText(language.level_cefr);
      const levelLabel = cleanText(language.level_label);

      if (!name && !cefrLevel && !levelLabel) {
        return null;
      }

      let label = name ?? "";

      if (name && cefrLevel && levelLabel) {
        label = `${name} - ${cefrLevel} (${levelLabel})`;
      } else if (name && cefrLevel) {
        label = `${name} - ${cefrLevel}`;
      } else if (name && levelLabel) {
        label = `${name} - ${levelLabel}`;
      } else if (!name && cefrLevel && levelLabel) {
        label = `${cefrLevel} (${levelLabel})`;
      } else if (!name && cefrLevel) {
        label = cefrLevel;
      } else if (!name && levelLabel) {
        label = levelLabel;
      }

      return {
        id: language.id || `doctor-language-${index}`,
        label,
        cefrLevel: cefrLevel ?? undefined,
        levelLabel: levelLabel ?? undefined
      };
    })
    .filter((language): language is CvLanguageItem => Boolean(language?.label));

  if (structuredLanguages.length > 0) {
    return structuredLanguages;
  }

  return (languages ?? [])
    .map((language, index) => ({
      id: `language-${index}`,
      label: language.trim()
    }))
    .filter((language) => Boolean(language.label));
}

function buildAdditionalSections(
  sections: NonNullable<DoctorProfile["additional_sections"]>
): CvAdditionalSectionItem[] {
  return sections
    .map((section) => {
      const title = cleanText(section.section_title);
      const bullets = [
        section.bullet_1,
        section.bullet_2,
        section.bullet_3,
        section.bullet_4,
        section.bullet_5
      ]
        .map((bullet) => bullet.trim())
        .filter(Boolean);

      return {
        id: section.id,
        title: title || "Weiterer Abschnitt",
        bullets,
        hasContent: Boolean(title) || bullets.length > 0
      };
    })
    .filter((section) => section.hasContent)
    .map(({ hasContent: _hasContent, ...section }) => section);
}

function buildCustomBlock(profile: DoctorProfile | null) {
  const block = profile?.cv_custom_block;

  if (!block) {
    return null;
  }

  const title = cleanText(block.title);
  const entries = (block.entries ?? [])
    .map((entry) => ({
      id: entry.id,
      content: cleanText(entry.content),
      description: cleanText(entry.description),
      date_label:
        formatMonthYear(entry.from_date) || formatMonthYear(entry.to_date)
          ? formatDateRange(entry.from_date, entry.to_date)
          : null
    }))
    .filter((entry) => Boolean(entry.content || entry.description || entry.date_label))
    .map((entry) => ({
      id: entry.id,
      content: entry.content ?? "",
      description: entry.description,
      date_label: entry.date_label
    }));

  if (!title && entries.length === 0) {
    return null;
  }

  return {
    title,
    entries
  };
}

export function buildDoctorCvModel({
  profile,
  photoPresentation,
  fallbackName,
  email,
  supabaseUrl
}: {
  profile: DoctorProfile | null;
  photoPresentation?: DoctorCvLayout["photo_presentation"] | null;
  fallbackName?: string | null;
  email?: string | null;
  supabaseUrl?: string | null;
}): DoctorCvModel {
  const fullName = getFullName(profile, fallbackName);
  const canonicalPhotoPresentation = profile?.cv_photo_presentation ?? photoPresentation ?? null;
  const rawPhotoUrl = getPhotoUrl(profile?.profile_photo_path, supabaseUrl);
  const preparedPhotoUrl = getPhotoUrl(profile?.cv_photo_path, supabaseUrl);
  const compactLocation = joinUniqueParts([profile?.city, profile?.country], ", ");
  const personalInfoItems = [
    cleanText(profile?.phone),
    cleanText(email),
    compactLocation || null
  ].filter((item): item is string => Boolean(item));

  return {
    header: {
      full_name: fullName,
      subtitle: null,
      photo_url: preparedPhotoUrl ?? rawPhotoUrl,
      prepared_photo_url: preparedPhotoUrl,
      initials: getInitials(fullName),
      photo_presentation: preparedPhotoUrl ? null : canonicalPhotoPresentation
    },
    personalInfo: {
      items: personalInfoItems,
      address_line: joinUniqueParts([profile?.street, profile?.postal_code], ", ") || null
    },
    workExperience: buildWorkExperience(profile, profile?.experiences ?? []),
    education: buildEducation(profile, profile?.educations ?? []),
    qualifications: buildQualifications(profile),
    trainings: buildTrainings(profile?.trainings ?? []),
    languages: buildLanguages(profile?.languages, profile?.doctor_languages),
    additionalSections: buildAdditionalSections(profile?.additional_sections ?? []),
    customBlock: buildCustomBlock(profile)
  };
}

