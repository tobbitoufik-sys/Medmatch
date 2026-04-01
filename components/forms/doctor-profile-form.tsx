"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Trash2, UserRound } from "lucide-react";

import type {
  DoctorAdditionalSection,
  DoctorCvCustomBlock,
  DoctorEducation,
  DoctorExperience,
  DoctorLanguage,
  DoctorProfile,
  DoctorTraining
} from "@/types";
import { updateDoctorProfileAction } from "@/lib/actions";
import {
  doctorLanguageCefrOptions,
  doctorLanguageLabelOptions,
  doctorLanguageOptions
} from "@/lib/constants/doctor-languages";
import { ServerForm } from "@/components/forms/server-form";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PhotoCropEditorModal } from "@/components/shared/photo/PhotoCropEditorModal";
import {
  createPhotoCropState,
  DEFAULT_PHOTO_CROP_PRESENTATION,
  getPhotoCropImageStyle,
  type PhotoCropState
} from "@/components/shared/photo/photo-crop-state";

const currentPositionOptions = [
  "Assistenzarzt",
  "Facharzt",
  "Oberarzt",
  "Leitender Oberarzt",
  "Chefarzt"
] as const;

type ExperienceDraft = {
  title: string;
  institution: string;
  from_date: string;
  to_date: string;
  bullet_1: string;
  bullet_2?: string;
  bullet_3?: string;
};

type EducationDraft = {
  education_university: string;
  degree_name: string;
  from_date: string;
  to_date: string;
};

type MedicalLicenseType = "approbation" | "berufserlaubnis" | "none";

type TrainingDraft = {
  training_name: string;
  institution: string;
  from_date: string;
  to_date: string;
  certificate_name: string;
};

type AdditionalSectionDraft = {
  section_title: string;
  bullet_1: string;
  bullet_2?: string;
  bullet_3?: string;
  bullet_4?: string;
  bullet_5?: string;
};

type LanguageDraft = {
  language_name: string;
  level_cefr: string;
  level_label: string;
};

type CustomCvEntryDraft = {
  id: string;
  content: string;
  description: string;
  from_date: string;
  to_date: string;
};

const emptyExperience = (): ExperienceDraft => ({
  title: "",
  institution: "",
  from_date: "",
  to_date: "",
  bullet_1: "",
  bullet_2: "",
  bullet_3: ""
});

const emptyEducation = (): EducationDraft => ({
  education_university: "",
  degree_name: "",
  from_date: "",
  to_date: ""
});

const emptyTraining = (): TrainingDraft => ({
  training_name: "",
  institution: "",
  from_date: "",
  to_date: "",
  certificate_name: ""
});

const emptyAdditionalSection = (): AdditionalSectionDraft => ({
  section_title: "",
  bullet_1: "",
  bullet_2: undefined,
  bullet_3: undefined,
  bullet_4: undefined,
  bullet_5: undefined
});

const emptyLanguage = (): LanguageDraft => ({
  language_name: "",
  level_cefr: "",
  level_label: ""
});

function createCustomCvEntryId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `cv-custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const emptyCustomCvEntry = (): CustomCvEntryDraft => ({
  id: createCustomCvEntryId(),
  content: "",
  description: "",
  from_date: "",
  to_date: ""
});

function parseDescriptionToBullets(description: string | null | undefined) {
  const normalized = (description ?? "")
    .split("\n")
    .map((line) => line.replace(/^[•\-\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 3);

  return {
    bullet_1: normalized[0] ?? "",
    bullet_2: normalized[1],
    bullet_3: normalized[2]
  };
}

function toDraft(experience: DoctorExperience): ExperienceDraft {
  const bullets = parseDescriptionToBullets(experience.description);

  return {
    title: experience.title ?? "",
    institution: experience.institution ?? "",
    from_date: experience.from_date ?? "",
    to_date: experience.to_date ?? "",
    ...bullets
  };
}

function toEducationDraft(education: DoctorEducation): EducationDraft {
  return {
    education_university: education.education_university ?? "",
    degree_name: education.degree_name ?? "",
    from_date: education.from_date ?? "",
    to_date: education.to_date ?? ""
  };
}

function toTrainingDraft(training: DoctorTraining): TrainingDraft {
  return {
    training_name: training.training_name ?? "",
    institution: training.institution ?? "",
    from_date: training.from_date ?? "",
    to_date: training.to_date ?? "",
    certificate_name: training.certificate_name ?? ""
  };
}

function toAdditionalSectionDraft(section: DoctorAdditionalSection): AdditionalSectionDraft {
  return {
    section_title: section.section_title ?? "",
    bullet_1: section.bullet_1 ?? "",
    bullet_2: section.bullet_2 || undefined,
    bullet_3: section.bullet_3 || undefined,
    bullet_4: section.bullet_4 || undefined,
    bullet_5: section.bullet_5 || undefined
  };
}

function toLanguageDraft(language: DoctorLanguage): LanguageDraft {
  return {
    language_name: language.language_name ?? "",
    level_cefr: language.level_cefr ?? "",
    level_label: language.level_label ?? ""
  };
}

function toCustomCvEntryDraft(
  entry: NonNullable<DoctorCvCustomBlock["entries"]>[number]
): CustomCvEntryDraft {
  return {
    id: entry.id ?? createCustomCvEntryId(),
    content: entry.content ?? "",
    description: entry.description ?? "",
    from_date: entry.from_date ?? "",
    to_date: entry.to_date ?? ""
  };
}

function Section({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-3xl border p-5">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function getDoctorProfilePhotoUrl(path: string | null | undefined) {
  if (!path) return null;

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return null;

  return `${baseUrl}/storage/v1/object/public/doctor-profile-photos/${path}`;
}

function getInitials(profile: DoctorProfile | null) {
  const fullName = [profile?.first_name, profile?.last_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");

  if (!fullName) {
    return "CV";
  }

  return fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function DoctorProfileForm({
  profile,
  email
}: {
  profile: DoctorProfile | null;
  email: string;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const profilePhotoInputId = "doctor-profile-photo";
  const initials = getInitials(profile);
  const [experiences, setExperiences] = useState<ExperienceDraft[]>(
    profile?.experiences?.length ? [...profile.experiences].reverse().map(toDraft) : [emptyExperience()]
  );
  const [educations, setEducations] = useState<EducationDraft[]>(
    profile?.educations?.length
      ? [...profile.educations].reverse().map(toEducationDraft)
      : profile?.education_university || profile?.degree_name || profile?.education_from_date || profile?.education_to_date
        ? [
            {
              education_university: profile?.education_university ?? "",
              degree_name: profile?.degree_name ?? "",
              from_date: profile?.education_from_date ?? "",
              to_date: profile?.education_to_date ?? ""
            }
          ]
        : [emptyEducation()]
  );
  const [trainings, setTrainings] = useState<TrainingDraft[]>(
    profile?.trainings?.length
      ? [...profile.trainings].reverse().map(toTrainingDraft)
      : [emptyTraining()]
  );
  const [additionalSections, setAdditionalSections] = useState<AdditionalSectionDraft[]>(
    profile?.additional_sections?.length
      ? [...profile.additional_sections].reverse().map(toAdditionalSectionDraft)
      : [emptyAdditionalSection()]
  );
  const [doctorLanguages, setDoctorLanguages] = useState<LanguageDraft[]>(
    profile?.doctor_languages?.length
      ? profile.doctor_languages.map(toLanguageDraft)
      : profile?.languages?.length
        ? profile.languages.map((language) => ({
            language_name: language,
            level_cefr: "B2",
            level_label: "Gute Kenntnisse"
          }))
        : [emptyLanguage()]
  );
  const [customCvBlockTitle, setCustomCvBlockTitle] = useState(
    profile?.cv_custom_block?.title ?? ""
  );
  const [customCvEntries, setCustomCvEntries] = useState<CustomCvEntryDraft[]>(
    profile?.cv_custom_block?.entries?.length
      ? profile.cv_custom_block.entries.map(toCustomCvEntryDraft)
      : [emptyCustomCvEntry()]
  );
  const [localPhotoPreview, setLocalPhotoPreview] = useState<string | null>(null);
  const [removeProfilePhoto, setRemoveProfilePhoto] = useState(false);
  const [isPhotoDragActive, setIsPhotoDragActive] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropError, setCropError] = useState<string | null>(null);
  const [medicalLicenseType, setMedicalLicenseType] = useState<MedicalLicenseType>(
    (profile?.license_type as MedicalLicenseType | "") || "none"
  );
  const [medicalLicenseSince, setMedicalLicenseSince] = useState(profile?.license_since ?? "");
  const [medicalLicenseIssuer, setMedicalLicenseIssuer] = useState(profile?.license_issuer ?? "");
  const [cropState, setCropState] = useState<PhotoCropState>(() =>
    createPhotoCropState({
      imageUrl: getDoctorProfilePhotoUrl(profile?.profile_photo_path ?? ""),
      initials,
      presentation: profile?.cv_photo_presentation,
      shape: "circle"
    })
  );

  useEffect(() => {
    return () => {
      if (localPhotoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(localPhotoPreview);
      }
    };
  }, [localPhotoPreview]);

  useEffect(() => {
    if (medicalLicenseType === "none") {
      setMedicalLicenseSince("");
      setMedicalLicenseIssuer("");
    }
  }, [medicalLicenseType]);

  const serializedExperiences = useMemo(
    () => JSON.stringify(experiences),
    [experiences]
  );
  const serializedEducations = useMemo(
    () => JSON.stringify(educations),
    [educations]
  );
  const serializedTrainings = useMemo(
    () => JSON.stringify(trainings),
    [trainings]
  );
  const serializedAdditionalSections = useMemo(
    () => JSON.stringify(additionalSections),
    [additionalSections]
  );
  const serializedDoctorLanguages = useMemo(
    () => JSON.stringify(doctorLanguages),
    [doctorLanguages]
  );
  const serializedCustomCvBlock = useMemo(
    () =>
      JSON.stringify({
        title: customCvBlockTitle,
        entries: customCvEntries
      }),
    [customCvBlockTitle, customCvEntries]
  );
  const existingPhotoUrl = getDoctorProfilePhotoUrl(profile?.profile_photo_path ?? "");
  const activePhotoUrl = removeProfilePhoto ? null : localPhotoPreview ?? existingPhotoUrl;
  const activeCropState = activePhotoUrl
    ? {
        ...cropState,
        imageUrl: activePhotoUrl
      }
    : cropState;

  function updatePhotoPreview(file: File | null) {
    setRemoveProfilePhoto(false);
    setCropError(null);
    setLocalPhotoPreview((current) => {
      if (current?.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }
      const nextPreview = file ? URL.createObjectURL(file) : null;

      setCropState((previous) =>
          createPhotoCropState({
            imageUrl: nextPreview ?? existingPhotoUrl,
            initials: previous.initials,
            presentation: nextPreview ? DEFAULT_PHOTO_CROP_PRESENTATION : profile?.cv_photo_presentation,
            shape: "circle"
          })
      );

      if (nextPreview) {
        setIsCropModalOpen(true);
      }

      return nextPreview;
    });
  }

  return (
    <ServerForm
      action={updateDoctorProfileAction}
      submitLabel="Profil speichern"
      refreshOnSuccess
      pendingLabel="Wird gespeichert..."
      successRefreshDelayMs={2000}
    >
      <PhotoCropEditorModal
        open={isCropModalOpen}
        value={activeCropState}
        errorMessage={cropError}
        title="Profilfoto fuer den Lebenslauf bearbeiten"
        description="Dieses Zuschnittsbild wird als kanonisches Lebenslauffoto in Editor, Vorschau und PDF verwendet."
        saveLabel="Zuschnitt uebernehmen"
        onCancel={() => {
          setCropError(null);
          setIsCropModalOpen(false);
        }}
        onSave={async (value) => {
          setCropState(value);
          setCropError(null);
          setIsCropModalOpen(false);
        }}
      />

      <div className="space-y-6">
        <Section title="Profilbild">
          <div className="max-w-2xl rounded-2xl border bg-muted/30 p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex justify-center sm:justify-start">
                  <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-background shadow-sm sm:h-28 sm:w-28">
                    {activePhotoUrl ? (
                      <img
                        src={activePhotoUrl}
                        alt="Profile preview"
                        className="pointer-events-none absolute left-1/2 top-1/2 max-h-full max-w-full"
                        style={getPhotoCropImageStyle(activeCropState)}
                      />
                    ) : (
                    <UserRound className="h-10 w-10 text-muted-foreground sm:h-12 sm:w-12" />
                  )}
                </div>
              </div>

              <div className="w-full max-w-lg space-y-3">
                <input
                  ref={fileInputRef}
                  id={profilePhotoInputId}
                  name="profile_photo"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => updatePhotoPreview(event.target.files?.[0] ?? null)}
                  required={false}
                />

                <label
                  htmlFor={profilePhotoInputId}
                  className={`block cursor-pointer rounded-2xl border border-dashed bg-background/70 p-3.5 transition-colors ${
                    isPhotoDragActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-background"
                  }`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsPhotoDragActive(true);
                  }}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setIsPhotoDragActive(true);
                  }}
                  onDragLeave={(event) => {
                    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                    setIsPhotoDragActive(false);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsPhotoDragActive(false);

                    const file = event.dataTransfer.files?.[0];
                    if (!file || !fileInputRef.current) return;

                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    fileInputRef.current.files = dataTransfer.files;
                    updatePhotoPreview(file);
                  }}
                >
                  <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1 pr-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <ImagePlus className="h-4 w-4 text-muted-foreground" />
                        <span>Foto für Ihr Profil auswählen</span>
                      </div>
                      <p className="text-sm text-muted-foreground">JPG oder PNG, max. 5 MB. Gespeichert, sobald Sie auf „Profil speichern“ klicken.</p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={(event) => {
                        event.preventDefault();
                        fileInputRef.current?.click();
                      }}
                    >
                      {activePhotoUrl ? "Foto ändern" : "Foto auswählen"}
                    </Button>
                  </div>
                </label>

                {activePhotoUrl ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCropError(null);
                        setIsCropModalOpen(true);
                      }}
                    >
                      Foto zuschneiden
                    </Button>
                    <Button type="submit">
                      Foto speichern
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-red-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                        setRemoveProfilePhoto(true);
                        setCropState(
                          createPhotoCropState({
                            imageUrl: null,
                            initials,
                            presentation: DEFAULT_PHOTO_CROP_PRESENTATION,
                            shape: "circle"
                          })
                        );
                        setLocalPhotoPreview((current) => {
                          if (current?.startsWith("blob:")) {
                            URL.revokeObjectURL(current);
                          }
                          return null;
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Entfernen
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit">
                      Foto speichern
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <input type="hidden" name="current_profile_photo_path" value={profile?.profile_photo_path ?? ""} />
          <input type="hidden" name="current_cv_photo_path" value={profile?.cv_photo_path ?? ""} />
          <input type="hidden" name="remove_profile_photo" value={removeProfilePhoto ? "true" : "false"} />
          <input
            type="hidden"
            name="cv_photo_presentation_json"
            value={JSON.stringify({
              shape: activeCropState.shape,
              version: activeCropState.version,
              zoom: activeCropState.zoom,
              offsetXPercent: activeCropState.offsetXPercent,
              offsetYPercent: activeCropState.offsetYPercent
            })}
          />
        </Section>

        <Section
          title="Persönliche Angaben"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Vorname" required>
              <Input name="first_name" defaultValue={profile?.first_name ?? ""} required />
            </Field>
            <Field label="Nachname" required>
              <Input name="last_name" defaultValue={profile?.last_name ?? ""} required />
            </Field>
            <Field label="Geburtsdatum" required>
              <Input name="date_of_birth" type="date" defaultValue={profile?.date_of_birth ?? ""} required />
            </Field>
            <Field label="Nationalität" required>
              <Input name="nationality" defaultValue={profile?.nationality ?? ""} required />
            </Field>
            <Field label="Telefon" required>
              <Input name="phone" defaultValue={profile?.phone ?? ""} required />
            </Field>
            <Field label="E-Mail" required>
              <Input value={email ?? ""} readOnly disabled required />
            </Field>
            <Field label="Straße" required>
              <Input name="street" defaultValue={profile?.street ?? ""} required />
            </Field>
            <Field label="Postleitzahl" required>
              <Input name="postal_code" defaultValue={profile?.postal_code ?? ""} required />
            </Field>
            <Field label="Stadt" required>
              <Input name="city" defaultValue={profile?.city ?? ""} required />
            </Field>
            <Field label="Land" required>
              <Input name="country" defaultValue={profile?.country ?? ""} required />
            </Field>
          </div>
        </Section>

        <section className="space-y-4 rounded-3xl border p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
              <h3 className="text-base font-semibold">Berufserfahrung</h3>
          </div>
          <Button type="button" variant="outline" onClick={() => setExperiences((current) => [emptyExperience(), ...current])}>
            Berufserfahrung hinzufügen
          </Button>
        </div>

        {experiences.map((experience, index) => (
          <div key={index} className="space-y-4 rounded-2xl border bg-secondary/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Berufserfahrung {index + 1}</p>
              {experiences.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setExperiences((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                >
                  Entfernen
                </Button>
              ) : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Position">
                <Input
                  value={experience.title}
                  onChange={(event) =>
                    setExperiences((current) =>
                      current.map((item, currentIndex) =>
                        currentIndex === index ? { ...item, title: event.target.value } : item
                      )
                    )
                  }
                  required={false}
                />
              </Field>
              <Field label="Einrichtung">
                <Input
                  value={experience.institution}
                  onChange={(event) =>
                    setExperiences((current) =>
                      current.map((item, currentIndex) =>
                        currentIndex === index ? { ...item, institution: event.target.value } : item
                      )
                    )
                  }
                  required={false}
                />
              </Field>
              <Field label="Von">
                <Input
                  type="date"
                  value={experience.from_date}
                  onChange={(event) =>
                    setExperiences((current) =>
                      current.map((item, currentIndex) =>
                        currentIndex === index ? { ...item, from_date: event.target.value } : item
                      )
                    )
                  }
                  required={false}
                />
              </Field>
              <Field label="Bis">
                <Input
                  type="date"
                  value={experience.to_date}
                  onChange={(event) =>
                    setExperiences((current) =>
                      current.map((item, currentIndex) =>
                        currentIndex === index ? { ...item, to_date: event.target.value } : item
                      )
                    )
                  }
                  required={false}
                />
              </Field>
            </div>

            <div className="space-y-3">
              <Field label="Hauptaufgabe">
                <Input
                  value={experience.bullet_1}
                  maxLength={140}
                  onChange={(event) =>
                    setExperiences((current) =>
                      current.map((item, currentIndex) =>
                        currentIndex === index ? { ...item, bullet_1: event.target.value } : item
                      )
                    )
                  }
                  required={false}
                />
              </Field>

              {experience.bullet_2 !== undefined ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">Additional responsibility</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setExperiences((current) =>
                          current.map((item, currentIndex) =>
                            currentIndex === index ? { ...item, bullet_2: undefined } : item
                          )
                        )
                      }
                    >
                  Entfernen
                    </Button>
                  </div>
                  <Input
                    value={experience.bullet_2 ?? ""}
                    maxLength={140}
                    onChange={(event) =>
                      setExperiences((current) =>
                        current.map((item, currentIndex) =>
                          currentIndex === index ? { ...item, bullet_2: event.target.value } : item
                        )
                      )
                    }
                    required={false}
                  />
                </div>
              ) : null}

              {experience.bullet_3 !== undefined ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">Additional responsibility</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setExperiences((current) =>
                          current.map((item, currentIndex) =>
                            currentIndex === index ? { ...item, bullet_3: undefined } : item
                          )
                        )
                      }
                    >
                  Entfernen
                    </Button>
                  </div>
                  <Input
                    value={experience.bullet_3 ?? ""}
                    maxLength={140}
                    onChange={(event) =>
                      setExperiences((current) =>
                        current.map((item, currentIndex) =>
                          currentIndex === index ? { ...item, bullet_3: event.target.value } : item
                        )
                      )
                    }
                    required={false}
                  />
                </div>
              ) : null}

              {(experience.bullet_2 === undefined || experience.bullet_3 === undefined) ? (
                <div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setExperiences((current) =>
                        current.map((item, currentIndex) => {
                          if (currentIndex !== index) return item;
                          if (item.bullet_2 === undefined) return { ...item, bullet_2: "" };
                          if (item.bullet_3 === undefined) return { ...item, bullet_3: "" };
                          return item;
                        })
                      )
                    }
                  >
                    Add responsibility
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        ))}
        </section>

        <section className="space-y-4 rounded-3xl border p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">Ausbildung</h3>
            </div>
            <Button type="button" variant="outline" onClick={() => setEducations((current) => [emptyEducation(), ...current])}>
              Ausbildung hinzufügen
            </Button>
          </div>

          {educations.map((education, index) => (
            <div key={index} className="space-y-4 rounded-2xl border bg-secondary/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Ausbildung {index + 1}</p>
                {educations.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEducations((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                  >
                    Entfernen
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Universität / Hochschule" required>
                  <Input
                    value={education.education_university}
                    onChange={(event) =>
                      setEducations((current) =>
                        current.map((item, currentIndex) =>
                          currentIndex === index ? { ...item, education_university: event.target.value } : item
                        )
                      )
                    }
                    required
                  />
                </Field>
                <Field label="Abschluss">
                  <Input
                    value={education.degree_name}
                    onChange={(event) =>
                      setEducations((current) =>
                        current.map((item, currentIndex) =>
                          currentIndex === index ? { ...item, degree_name: event.target.value } : item
                        )
                      )
                    }
                    required={false}
                  />
                </Field>
                <Field label="Von" required>
                  <Input
                    type="date"
                    value={education.from_date}
                    onChange={(event) =>
                      setEducations((current) =>
                        current.map((item, currentIndex) =>
                          currentIndex === index ? { ...item, from_date: event.target.value } : item
                        )
                      )
                    }
                    required
                  />
                </Field>
                <Field label="Bis" required>
                  <Input
                    type="date"
                    value={education.to_date}
                    onChange={(event) =>
                      setEducations((current) =>
                        current.map((item, currentIndex) =>
                          currentIndex === index ? { ...item, to_date: event.target.value } : item
                        )
                      )
                    }
                    required
                  />
                </Field>
              </div>


            </div>
          ))}
          <div className="space-y-4 rounded-2xl border bg-secondary/20 p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Medizinische Zulassung</p>
              <p className="text-sm text-muted-foreground">
                Diese Angabe wird als Teil der Ausbildungsstationen im Lebenslauf gefuehrt.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Zulassungsart" required>
                <select
                  name="license_type"
                  value={medicalLicenseType}
                  onChange={(event) =>
                    setMedicalLicenseType(event.target.value as MedicalLicenseType)
                  }
                  required
                  className="flex h-11 w-full rounded-2xl border bg-white px-4 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="approbation">Approbation</option>
                  <option value="berufserlaubnis">Berufserlaubnis</option>
                  <option value="none">Keine</option>
                </select>
              </Field>
              <Field label="Seit">
                <Input
                  name="license_since"
                  type="date"
                  value={medicalLicenseSince}
                  onChange={(event) => setMedicalLicenseSince(event.target.value)}
                  required={false}
                  disabled={medicalLicenseType === "none"}
                />
              </Field>
              <Field label="Ausstellende Universitaet / Behoerde">
                <Input
                  name="license_issuer"
                  value={medicalLicenseIssuer}
                  onChange={(event) => setMedicalLicenseIssuer(event.target.value)}
                  required={false}
                  disabled={medicalLicenseType === "none"}
                />
              </Field>
            </div>
          </div>
          <input type="hidden" name="education_country" defaultValue={profile?.education_country ?? "Germany"} />
          <input type="hidden" name="graduation_year" defaultValue={profile?.graduation_year ?? ""} />
        </section>

        <Section title="Medizinische Qualifikationen">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Fachrichtung">
              <Input name="specialty" defaultValue={profile?.specialty ?? ""} required={false} />
            </Field>
            <Field label="Aktuelle Position">
              <select
                name="current_position"
                defaultValue={profile?.current_position ?? ""}
                className="flex h-11 w-full rounded-2xl border bg-white px-4 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Position auswählen</option>
                {currentPositionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <input type="hidden" name="desired_position" defaultValue={profile?.headline ?? ""} />
          <input type="hidden" name="desired_contract_type" defaultValue={profile?.desired_contract_type ?? ""} />
          <input type="hidden" name="availability" defaultValue={profile?.availability ?? ""} />
        </Section>

        <section className="space-y-4 rounded-3xl border p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">Fortbildungen</h3>
            </div>
            <Button type="button" variant="outline" onClick={() => setTrainings((current) => [emptyTraining(), ...current])}>
              Fortbildung hinzufügen
            </Button>
          </div>

          {trainings.map((training, index) => (
            <div key={index} className="space-y-4 rounded-2xl border bg-secondary/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Fortbildung {index + 1}</p>
                {trainings.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setTrainings((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                  >
                    Entfernen
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Fortbildung">
                  <Input
                    value={training.training_name}
                    onChange={(event) =>
                      setTrainings((current) =>
                        current.map((item, currentIndex) =>
                          currentIndex === index ? { ...item, training_name: event.target.value } : item
                        )
                      )
                    }
                    required={false}
                  />
                </Field>
                <Field label="Einrichtung">
                  <Input
                    value={training.institution}
                    onChange={(event) =>
                      setTrainings((current) =>
                        current.map((item, currentIndex) =>
                          currentIndex === index ? { ...item, institution: event.target.value } : item
                        )
                      )
                    }
                    required={false}
                  />
                </Field>
                <Field label="Von">
                  <Input
                    type="date"
                    value={training.from_date}
                    onChange={(event) =>
                      setTrainings((current) =>
                        current.map((item, currentIndex) =>
                          currentIndex === index ? { ...item, from_date: event.target.value } : item
                        )
                      )
                    }
                    required={false}
                  />
                </Field>
                <Field label="Bis">
                  <Input
                    type="date"
                    value={training.to_date}
                    onChange={(event) =>
                      setTrainings((current) =>
                        current.map((item, currentIndex) =>
                          currentIndex === index ? { ...item, to_date: event.target.value } : item
                        )
                      )
                    }
                    required={false}
                  />
                </Field>
                <Field label="Zertifikat">
                  <Input
                    value={training.certificate_name}
                    onChange={(event) =>
                      setTrainings((current) =>
                        current.map((item, currentIndex) =>
                          currentIndex === index ? { ...item, certificate_name: event.target.value } : item
                        )
                      )
                    }
                    required={false}
                  />
                </Field>
              </div>


            </div>
          ))}
        </section>

        <Section title="Sprachen">
          <div className="space-y-3">
            {doctorLanguages.map((language, index) => (
              <div
                key={`doctor-language-${index}`}
                className="grid gap-3 rounded-2xl border bg-secondary/20 p-3 md:grid-cols-[minmax(0,1.6fr)_120px_200px_auto] md:items-end"
              >
                <Field label="Sprache">
                  <Select
                    value={language.language_name}
                    onChange={(event) =>
                      setDoctorLanguages((current) =>
                        current.map((item, currentIndex) =>
                          currentIndex === index ? { ...item, language_name: event.target.value } : item
                        )
                      )
                    }
                    required={false}
                  >
                    <option value="">Sprache auswählen</option>
                    {doctorLanguageOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="CEFR">
                  <Select
                    value={language.level_cefr}
                    onChange={(event) =>
                      setDoctorLanguages((current) =>
                        current.map((item, currentIndex) =>
                          currentIndex === index ? { ...item, level_cefr: event.target.value } : item
                        )
                      )
                    }
                    required={false}
                  >
                    <option value="">Niveau</option>
                    {doctorLanguageCefrOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Anzeigetext">
                  <Select
                    value={language.level_label}
                    onChange={(event) =>
                      setDoctorLanguages((current) =>
                        current.map((item, currentIndex) =>
                          currentIndex === index ? { ...item, level_label: event.target.value } : item
                        )
                      )
                    }
                    required={false}
                  >
                    <option value="">Label</option>
                    {doctorLanguageLabelOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </Field>

                <div className="flex items-end md:justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setDoctorLanguages((current) =>
                        current.length > 1 ? current.filter((_, currentIndex) => currentIndex !== index) : [emptyLanguage()]
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Sprache entfernen</span>
                  </Button>
                </div>
              </div>
            ))}

            <div>
              <Button type="button" variant="outline" onClick={() => setDoctorLanguages((current) => [...current, emptyLanguage()])}>
                Sprache hinzufügen
              </Button>
            </div>
          </div>
        </Section>

        <section className="space-y-4 rounded-3xl border p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">Zusätzliche Abschnitte</h3>
            </div>
            <Button type="button" variant="outline" onClick={() => setAdditionalSections((current) => [emptyAdditionalSection(), ...current])}>
              Abschnitt hinzufügen
            </Button>
          </div>

          {additionalSections.map((section, index) => (
            <div key={index} className="space-y-4 rounded-2xl border bg-secondary/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Abschnitt {index + 1}</p>
                {additionalSections.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setAdditionalSections((current) => current.filter((_, currentIndex) => currentIndex !== index))
                    }
                  >
                    Abschnitt entfernen
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Abschnittstitel">
                  <Input
                    value={section.section_title}
                    onChange={(event) =>
                      setAdditionalSections((current) =>
                        current.map((item, currentIndex) =>
                          currentIndex === index ? { ...item, section_title: event.target.value } : item
                        )
                      )
                    }
                    required={false}
                  />
                </Field>
              </div>

              <div className="space-y-3">
                <Field label="Haupteintrag">
                  <Input
                    value={section.bullet_1}
                    onChange={(event) =>
                      setAdditionalSections((current) =>
                        current.map((item, currentIndex) =>
                          currentIndex === index ? { ...item, bullet_1: event.target.value } : item
                        )
                      )
                    }
                    required={false}
                  />
                </Field>

                {(["bullet_2", "bullet_3", "bullet_4", "bullet_5"] as const).map((key) =>
                  section[key] !== undefined ? (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">Zusätzlicher Eintrag</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setAdditionalSections((current) =>
                              current.map((item, currentIndex) =>
                                currentIndex === index ? { ...item, [key]: undefined } : item
                              )
                            )
                          }
                        >
                          Entfernen
                        </Button>
                      </div>
                      <Input
                        value={section[key] ?? ""}
                        onChange={(event) =>
                          setAdditionalSections((current) =>
                            current.map((item, currentIndex) =>
                              currentIndex === index ? { ...item, [key]: event.target.value } : item
                            )
                          )
                        }
                        required={false}
                      />
                    </div>
                  ) : null
                )}

                {(section.bullet_2 === undefined ||
                  section.bullet_3 === undefined ||
                  section.bullet_4 === undefined ||
                  section.bullet_5 === undefined) ? (
                  <div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setAdditionalSections((current) =>
                          current.map((item, currentIndex) => {
                            if (currentIndex !== index) return item;
                            if (item.bullet_2 === undefined) return { ...item, bullet_2: "" };
                            if (item.bullet_3 === undefined) return { ...item, bullet_3: "" };
                            if (item.bullet_4 === undefined) return { ...item, bullet_4: "" };
                            if (item.bullet_5 === undefined) return { ...item, bullet_5: "" };
                            return item;
                          })
                        )
                      }
                    >
                      Stichpunkt hinzufügen
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-4 rounded-3xl border p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Freier Lebenslaufblock</h3>
              <p className="text-sm text-muted-foreground">
                Optionaler Zusatz am Ende des Lebenslaufs ohne automatische Abschnittsueberschrift.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setCustomCvEntries((current) => [emptyCustomCvEntry(), ...current])
              }
            >
              Eintrag hinzufuegen
            </Button>
          </div>

          <Field label="Haupttitel">
            <Input
              value={customCvBlockTitle}
              onChange={(event) => setCustomCvBlockTitle(event.target.value)}
              required={false}
            />
          </Field>

          <div className="space-y-4">
            {customCvEntries.map((entry, index) => (
              <div key={entry.id} className="space-y-4 rounded-2xl border bg-secondary/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">Eintrag {index + 1}</p>
                  {customCvEntries.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setCustomCvEntries((current) =>
                          current.filter((item) => item.id !== entry.id)
                        )
                      }
                    >
                      Entfernen
                    </Button>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Inhalt">
                    <Input
                      value={entry.content}
                      onChange={(event) =>
                        setCustomCvEntries((current) =>
                          current.map((item) =>
                            item.id === entry.id
                              ? { ...item, content: event.target.value }
                              : item
                          )
                        )
                      }
                      required={false}
                    />
                  </Field>
                  <Field label="Beschreibung">
                    <Input
                      value={entry.description}
                      onChange={(event) =>
                        setCustomCvEntries((current) =>
                          current.map((item) =>
                            item.id === entry.id
                              ? { ...item, description: event.target.value }
                              : item
                          )
                        )
                      }
                      required={false}
                    />
                  </Field>
                  <Field label="Von">
                    <Input
                      type="date"
                      value={entry.from_date}
                      onChange={(event) =>
                        setCustomCvEntries((current) =>
                          current.map((item) =>
                            item.id === entry.id
                              ? { ...item, from_date: event.target.value }
                              : item
                          )
                        )
                      }
                      required={false}
                    />
                  </Field>
                  <Field label="Bis">
                    <Input
                      type="date"
                      value={entry.to_date}
                      onChange={(event) =>
                        setCustomCvEntries((current) =>
                          current.map((item) =>
                            item.id === entry.id
                              ? { ...item, to_date: event.target.value }
                              : item
                          )
                        )
                      }
                      required={false}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <input type="hidden" name="experiences_json" value={serializedExperiences} />
      <input type="hidden" name="educations_json" value={serializedEducations} />
      <input type="hidden" name="trainings_json" value={serializedTrainings} />
      <input type="hidden" name="doctor_languages_json" value={serializedDoctorLanguages} />
      <input type="hidden" name="additional_sections_json" value={serializedAdditionalSections} />
      <input type="hidden" name="cv_custom_block_json" value={serializedCustomCvBlock} />

      <label className="flex items-center gap-3 rounded-2xl border bg-secondary/50 px-4 py-3 text-sm">
        <input name="is_public" type="checkbox" defaultChecked={profile?.is_public ?? true} className="h-4 w-4 rounded border" />
        Mein Profil im öffentlichen Ärzteverzeichnis anzeigen
      </label>
    </ServerForm>
  );
}



