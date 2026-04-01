"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  applicationStatusActionLabels,
  applicationStatusLabels,
  applicationStatusTransitions,
  getFacilityWorkflowStatus
} from "@/lib/applications";
import {
  doctorLanguageCefrOptions,
  doctorLanguageLabelOptions,
  doctorLanguageOptions
} from "@/lib/constants/doctor-languages";
import { DEFAULT_CV_SECTION_ORDER } from "@/lib/cv/constants";
import {
  normalizeCvPhotoPresentation,
  type CvPhotoPresentation
} from "@/components/cv/v2/cv-photo-state";
import {
  contactRequestSchema,
  doctorProfileSchema,
  facilityProfileSchema,
  jobOfferSchema
} from "@/lib/validations/profiles";
import { signInSchema, signUpSchema } from "@/lib/validations/auth";
import { renderCanonicalCvPhoto } from "@/lib/photo/render-canonical-cv-photo";

type ActionState = {
  success: boolean;
  message: string;
};

type DoctorExperienceInput = {
  title: string;
  institution: string;
  from_date: string | null;
  to_date: string | null;
  description: string;
  sort_order: number;
};

type DoctorEducationInput = {
  education_university: string;
  degree_name: string;
  from_date: string | null;
  to_date: string | null;
  sort_order: number;
};

type DoctorTrainingInput = {
  training_name: string;
  institution: string;
  from_date: string | null;
  to_date: string | null;
  certificate_name: string;
  sort_order: number;
};

type DoctorAdditionalSectionInput = {
  section_title: string;
  bullet_1: string;
  bullet_2: string;
  bullet_3: string;
  bullet_4: string;
  bullet_5: string;
  sort_order: number;
};

type DoctorLanguageInput = {
  language_name: string;
  level_cefr: string;
  level_label: string;
  sort_order: number;
};

type DoctorCvCustomBlockInput = {
  title: string;
  entries: Array<{
    id: string;
    content: string;
    description: string | null;
    from_date: string | null;
    to_date: string | null;
  }>;
} | null;

const mockSuccess = (message: string): ActionState => ({ success: true, message });
const doctorProfilePhotoBucket = "doctor-profile-photos";
const doctorPreparedCvPhotoPrefix = "prepared-cv-photos";

function buildPreparedCvPhotoStoragePath(userId: string) {
  return `${userId}/${doctorPreparedCvPhotoPrefix}/${crypto.randomUUID()}.png`;
}

function canManageDoctorPhotoStoragePath(path: string | null | undefined, userId: string) {
  if (!path) {
    return false;
  }

  return path === userId || path.startsWith(`${userId}/`);
}

function getFileExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName) return fromName;

  switch (file.type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

function parseCvPhotoPresentationFromFormData(formData: FormData, fallbackShape: CvPhotoPresentation["shape"] = "circle") {
  const raw = formData.get("cv_photo_presentation_json")?.toString().trim();

  if (!raw) {
    return normalizeCvPhotoPresentation(undefined, fallbackShape);
  }

  try {
    return normalizeCvPhotoPresentation(JSON.parse(raw), fallbackShape);
  } catch {
    return normalizeCvPhotoPresentation(undefined, fallbackShape);
  }
}

async function uploadPreparedCvPhoto(params: {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  userId: string;
  sourceBuffer: Buffer;
  photoPresentation: CvPhotoPresentation;
}) {
  const preparedBuffer = await renderCanonicalCvPhoto({
    sourceBuffer: params.sourceBuffer,
    photoPresentation: params.photoPresentation
  });
  const storagePath = buildPreparedCvPhotoStoragePath(params.userId);
  const { error } = await params.supabase.storage
    .from(doctorProfilePhotoBucket)
    .upload(storagePath, preparedBuffer, {
      contentType: "image/png",
      upsert: false
    });

  if (error) {
    throw new Error(error.message || "Unable to upload the prepared CV photo.");
  }

  return storagePath;
}

async function performApplicationStatusUpdate(formData: FormData): Promise<ActionState & { detailPath?: string }> {
  const applicationId = formData.get("application_id")?.toString().trim();
  const targetStatus = formData.get("next_status")?.toString().trim();
  const detailPath = formData.get("detail_path")?.toString().trim();

  if (!applicationId || !targetStatus) {
    return { success: false, message: "Application update is missing required information." };
  }

  if (!hasSupabaseEnv()) {
    return { success: true, message: "Application status updated successfully.", detailPath };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "You need to be logged in." };

  const { data: facility } = await supabase
    .from("facility_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!facility) {
    return { success: false, message: "Only facility users can manage application statuses." };
  }

  const { data: application } = await supabase
    .from("applications")
    .select("id, status, facility_id")
    .eq("id", applicationId)
    .eq("facility_id", facility.id)
    .maybeSingle();

  if (!application) {
    return { success: false, message: "Application not found for this facility." };
  }

  const currentWorkflowStatus = getFacilityWorkflowStatus(application.status);

  const allowedTransitions =
    applicationStatusTransitions[currentWorkflowStatus as keyof typeof applicationStatusTransitions] ?? [];
  if (!allowedTransitions.includes(targetStatus as never)) {
    return {
      success: false,
      message: `Invalid status change. ${applicationStatusLabels[currentWorkflowStatus as keyof typeof applicationStatusLabels]} can only move to the next allowed step.`
    };
  }

  const { data, error } = await supabase
    .from("applications")
    .update({ status: targetStatus })
    .eq("id", application.id)
    .eq("facility_id", application.facility_id)
    .select("id, status")
    .limit(1);

  const updatedApplication = data?.[0] ?? null;

  if (error || !updatedApplication) {
    return {
      success: false,
      message: error?.message || "Update failed - no rows updated"
    };
  }

  const { data: reloadedApplication } = await supabase
    .from("applications")
    .select("id, status")
    .eq("id", application.id)
    .eq("facility_id", facility.id)
    .maybeSingle();

  if (!reloadedApplication || reloadedApplication.status !== targetStatus) {
    return {
      success: false,
      message: "Unable to confirm the application status update."
    };
  }

  revalidatePath("/dashboard/facility/applications");
  revalidatePath(`/dashboard/facility/applications/${application.id}`);
  revalidatePath("/dashboard/facility");

  return {
    success: true,
    message: `${applicationStatusActionLabels[targetStatus as keyof typeof applicationStatusActionLabels]} complete.`,
    detailPath
  };
}

function parseDoctorExperiences(formData: FormData): DoctorExperienceInput[] {
  const raw = formData.get("experiences_json")?.toString() ?? "[]";

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item, index) => {
        if (!item || typeof item !== "object") return null;

        const record = item as Record<string, unknown>;
        const title = typeof record.title === "string" ? record.title.trim() : "";
        const institution = typeof record.institution === "string" ? record.institution.trim() : "";
        const fromDate = typeof record.from_date === "string" && record.from_date ? record.from_date : null;
        const toDate = typeof record.to_date === "string" && record.to_date ? record.to_date : null;
        const bullets = ["bullet_1", "bullet_2", "bullet_3"]
          .map((key) => (typeof record[key] === "string" ? record[key].trim() : ""))
          .filter(Boolean)
          .slice(0, 3);
        const description = bullets.map((bullet) => `• ${bullet}`).join("\n");

        if (!title && !institution && !fromDate && !toDate && !description) {
          return null;
        }

        return {
          title,
          institution,
          from_date: fromDate,
          to_date: toDate,
          description,
          sort_order: index
        };
      })
      .filter((item): item is DoctorExperienceInput => item !== null);
  } catch {
    return [];
  }
}

function parseDoctorEducations(formData: FormData): DoctorEducationInput[] {
  const raw = formData.get("educations_json")?.toString() ?? "[]";

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item, index) => {
        if (!item || typeof item !== "object") return null;

        const record = item as Record<string, unknown>;
        const educationUniversity =
          typeof record.education_university === "string" ? record.education_university.trim() : "";
        const degreeName = typeof record.degree_name === "string" ? record.degree_name.trim() : "";
        const fromDate = typeof record.from_date === "string" && record.from_date ? record.from_date : null;
        const toDate = typeof record.to_date === "string" && record.to_date ? record.to_date : null;
        if (!educationUniversity && !degreeName && !fromDate && !toDate) {
          return null;
        }

        return {
          education_university: educationUniversity,
          degree_name: degreeName,
          from_date: fromDate,
          to_date: toDate,
          sort_order: index
        };
      })
      .filter((item): item is DoctorEducationInput => item !== null);
  } catch {
    return [];
  }
}

function parseDoctorTrainings(formData: FormData): DoctorTrainingInput[] {
  const raw = formData.get("trainings_json")?.toString() ?? "[]";

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item, index) => {
        if (!item || typeof item !== "object") return null;

        const record = item as Record<string, unknown>;
        const trainingName = typeof record.training_name === "string" ? record.training_name.trim() : "";
        const institution = typeof record.institution === "string" ? record.institution.trim() : "";
        const fromDate = typeof record.from_date === "string" && record.from_date ? record.from_date : null;
        const toDate = typeof record.to_date === "string" && record.to_date ? record.to_date : null;
        const certificateName =
          typeof record.certificate_name === "string" ? record.certificate_name.trim() : "";
        if (!trainingName && !institution && !fromDate && !toDate && !certificateName) {
          return null;
        }

        return {
          training_name: trainingName,
          institution,
          from_date: fromDate,
          to_date: toDate,
          certificate_name: certificateName,
          sort_order: index
        };
      })
      .filter((item): item is DoctorTrainingInput => item !== null);
  } catch {
    return [];
  }
}

function parseDoctorAdditionalSections(formData: FormData): DoctorAdditionalSectionInput[] {
  const raw = formData.get("additional_sections_json")?.toString() ?? "[]";

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item, index) => {
        if (!item || typeof item !== "object") return null;

        const record = item as Record<string, unknown>;
        const sectionTitle = typeof record.section_title === "string" ? record.section_title.trim() : "";
        const bullets = ["bullet_1", "bullet_2", "bullet_3", "bullet_4", "bullet_5"].map((key) =>
          typeof record[key] === "string" ? record[key].trim() : ""
        );

        if (!sectionTitle && bullets.every((bullet) => !bullet)) {
          return null;
        }

        return {
          section_title: sectionTitle,
          bullet_1: bullets[0] ?? "",
          bullet_2: bullets[1] ?? "",
          bullet_3: bullets[2] ?? "",
          bullet_4: bullets[3] ?? "",
          bullet_5: bullets[4] ?? "",
          sort_order: index
        };
      })
      .filter((item): item is DoctorAdditionalSectionInput => item !== null);
  } catch {
    return [];
  }
}

function parseDoctorLanguages(formData: FormData): { items: DoctorLanguageInput[]; error?: string } {
  const raw = formData.get("doctor_languages_json")?.toString() ?? "[]";
  const validLanguages = new Set<string>(doctorLanguageOptions);
  const validCefrLevels = new Set<string>(doctorLanguageCefrOptions);
  const validLabelLevels = new Set<string>(doctorLanguageLabelOptions);

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { items: [] };

    const items: DoctorLanguageInput[] = [];
    const seenLanguages = new Set<string>();

    for (const [index, item] of parsed.entries()) {
      if (!item || typeof item !== "object") continue;

      const record = item as Record<string, unknown>;
      const languageName = typeof record.language_name === "string" ? record.language_name.trim() : "";
      const levelCefr = typeof record.level_cefr === "string" ? record.level_cefr.trim().toUpperCase() : "";
      const levelLabel = typeof record.level_label === "string" ? record.level_label.trim() : "";
      const hasAnyValue = Boolean(languageName || levelCefr || levelLabel);

      if (!hasAnyValue) continue;

      if (!languageName || !levelCefr || !levelLabel) {
        return { items: [], error: "Please complete language, CEFR level, and display label for each language row." };
      }

      if (
        !validLanguages.has(languageName) ||
        !validCefrLevels.has(levelCefr) ||
        !validLabelLevels.has(levelLabel)
      ) {
        return { items: [], error: "Please choose languages and proficiency levels from the provided lists." };
      }

      if (seenLanguages.has(languageName)) {
        return { items: [], error: "Each language can only be added once." };
      }

      seenLanguages.add(languageName);
      items.push({
        language_name: languageName,
        level_cefr: levelCefr,
        level_label: levelLabel,
        sort_order: index
      });
    }

    return { items };
  } catch {
    return { items: [], error: "Unable to read the language entries from the form." };
  }
}

function parseDoctorCvCustomBlock(formData: FormData): DoctorCvCustomBlockInput {
  const raw = formData.get("cv_custom_block_json")?.toString() ?? "";

  if (!raw.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as {
      title?: unknown;
      entries?: unknown;
    };

    const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
    const entries = Array.isArray(parsed.entries)
      ? parsed.entries
          .map((item) => {
            if (!item || typeof item !== "object") return null;

            const record = item as Record<string, unknown>;
            const id = typeof record.id === "string" && record.id.trim()
              ? record.id.trim()
              : crypto.randomUUID();
            const content =
              typeof record.content === "string" ? record.content.trim() : "";
            const description =
              typeof record.description === "string" ? record.description.trim() : "";
            const fromDate =
              typeof record.from_date === "string" && record.from_date
                ? record.from_date
                : null;
            const toDate =
              typeof record.to_date === "string" && record.to_date
                ? record.to_date
                : null;

            if (!content && !description && !fromDate && !toDate) {
              return null;
            }

            return {
              id,
              content,
              description: description || null,
              from_date: fromDate,
              to_date: toDate
            };
          })
          .filter(
            (
              item
            ): item is {
              id: string;
              content: string;
              description: string | null;
              from_date: string | null;
              to_date: string | null;
            } => item !== null
          )
      : [];

    if (!title && entries.length === 0) {
      return null;
    }

    return {
      title,
      entries
    };
  } catch {
    return null;
  }
}

export async function signInAction(_: ActionState, formData: FormData) {
  const values = signInSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!values.success) return { success: false, message: values.error.issues[0]?.message || "Invalid credentials." };
  if (!hasSupabaseEnv()) return mockSuccess("Demo mode: sign-in is ready once Supabase is connected.");

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword(values.data);
  if (error) {
    return { success: false, message: error.message };
  }

  redirect("/dashboard");
}

export async function signUpAction(_: ActionState, formData: FormData) {
  const values = signUpSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!values.success) return { success: false, message: values.error.issues[0]?.message || "Invalid registration details." };
  if (!hasSupabaseEnv()) return mockSuccess("Demo mode: registration flow is scaffolded and will work after Supabase setup.");

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email: values.data.email,
    password: values.data.password,
    options: {
      data: {
        full_name: values.data.fullName,
        role: values.data.role
      }
    }
  });
  if (error) return { success: false, message: error.message };

  if (data.user) {
    await supabase.from("users").insert({
      id: data.user.id,
      email: values.data.email,
      full_name: values.data.fullName,
      role: values.data.role,
      is_active: true
    });
  }

  return { success: true, message: "Account created. Check your email to confirm your registration." };
}

export async function signOutAction() {
  if (!hasSupabaseEnv()) redirect("/");
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function updateDoctorProfileAction(_: ActionState, formData: FormData) {
  const parsed = doctorProfileSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    years_experience: formData.get("years_experience"),
    is_public: formData.get("is_public") === "on"
  });
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message || "Please review your profile information." };
  if (!hasSupabaseEnv()) return mockSuccess("Demo mode: doctor profile form is ready. Connect Supabase to persist changes.");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "You need to be logged in." };

  const currentProfilePhotoPath = formData.get("current_profile_photo_path")?.toString().trim() ?? "";
  const currentCvPhotoPath = formData.get("current_cv_photo_path")?.toString().trim() ?? "";
  const removeProfilePhoto = formData.get("remove_profile_photo")?.toString() === "true";
  const uploadedProfilePhoto = formData.get("profile_photo");
  const cvPhotoPresentation = parseCvPhotoPresentationFromFormData(formData);
  let nextProfilePhotoPath = currentProfilePhotoPath;
  let nextCvPhotoPath = currentCvPhotoPath;
  let sourcePhotoBuffer: Buffer | null = null;

  if (removeProfilePhoto) {
    nextProfilePhotoPath = "";
    nextCvPhotoPath = "";
  }

  if (uploadedProfilePhoto instanceof File && uploadedProfilePhoto.size > 0) {
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

    if (!allowedTypes.has(uploadedProfilePhoto.type)) {
      return { success: false, message: "Profile photo must be a JPG, PNG, or WEBP image." };
    }

    const fileExtension = getFileExtension(uploadedProfilePhoto);
    const storagePath = `${user.id}/${crypto.randomUUID()}.${fileExtension}`;
    const fileBuffer = Buffer.from(await uploadedProfilePhoto.arrayBuffer());
    sourcePhotoBuffer = fileBuffer;

    const { error: uploadError } = await supabase.storage
      .from(doctorProfilePhotoBucket)
      .upload(storagePath, fileBuffer, {
        contentType: uploadedProfilePhoto.type,
        upsert: false
      });

    if (uploadError) {
      return { success: false, message: uploadError.message || "Unable to upload the profile photo." };
    }

    nextProfilePhotoPath = storagePath;
  }

  if (!removeProfilePhoto && !sourcePhotoBuffer && nextProfilePhotoPath) {
    const { data: existingRawPhoto, error: downloadPhotoError } = await supabase.storage
      .from(doctorProfilePhotoBucket)
      .download(nextProfilePhotoPath);

    if (downloadPhotoError) {
      return {
        success: false,
        message: downloadPhotoError.message || "Unable to load the profile photo for cropping."
      };
    }

    sourcePhotoBuffer = Buffer.from(await existingRawPhoto.arrayBuffer());
  }

  if (!removeProfilePhoto && sourcePhotoBuffer) {
    try {
      nextCvPhotoPath = await uploadPreparedCvPhoto({
        supabase,
        userId: user.id,
        sourceBuffer: sourcePhotoBuffer,
        photoPresentation: cvPhotoPresentation
      });
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to prepare the CV photo."
      };
    }
  }

  if (currentProfilePhotoPath && currentProfilePhotoPath !== nextProfilePhotoPath) {
    const { error: removeOldPhotoError } = await supabase.storage
      .from(doctorProfilePhotoBucket)
      .remove([currentProfilePhotoPath]);

    if (removeOldPhotoError) {
      return { success: false, message: removeOldPhotoError.message || "Unable to update the profile photo." };
    }
  }

  if (currentCvPhotoPath && currentCvPhotoPath !== nextCvPhotoPath) {
    if (canManageDoctorPhotoStoragePath(currentCvPhotoPath, user.id)) {
      const { error: removeOldPreparedPhotoError } = await supabase.storage
        .from(doctorProfilePhotoBucket)
        .remove([currentCvPhotoPath]);

      if (removeOldPreparedPhotoError) {
        return {
          success: false,
          message:
            removeOldPreparedPhotoError.message || "Unable to update the prepared CV photo."
        };
      }
    }
  }

  const parsedDoctorLanguages = parseDoctorLanguages(formData);
  if (parsedDoctorLanguages.error) {
    return { success: false, message: parsedDoctorLanguages.error };
  }

  const doctorLanguages = parsedDoctorLanguages.items;
  const languages = doctorLanguages.map((item) => item.language_name);
  const experiences = parseDoctorExperiences(formData);
  const educations = parseDoctorEducations(formData);
  const trainings = parseDoctorTrainings(formData);
  const additionalSections = parseDoctorAdditionalSections(formData);
  const cvCustomBlock = parseDoctorCvCustomBlock(formData);
  const primaryEducation = educations[0] ?? null;
  const graduationYear = primaryEducation?.to_date
    ? Number.parseInt(primaryEducation.to_date.slice(0, 4), 10)
    : parsed.data.graduation_year;
  const payload = {
    ...parsed.data,
    languages,
    date_of_birth: parsed.data.date_of_birth || null,
    profile_photo_path: nextProfilePhotoPath,
    cv_photo_path: nextCvPhotoPath || null,
    cv_photo_presentation: nextProfilePhotoPath ? cvPhotoPresentation : null,
    degree_name: primaryEducation?.degree_name ?? parsed.data.degree_name,
    graduation_year: Number.isNaN(graduationYear ?? NaN) ? null : graduationYear,
    education_university: primaryEducation?.education_university ?? parsed.data.education_university,
    education_from_date: (primaryEducation?.from_date ?? parsed.data.education_from_date) || null,
    education_to_date: (primaryEducation?.to_date ?? parsed.data.education_to_date) || null,
    license_type: parsed.data.license_type || "none",
    license_since:
      parsed.data.license_type !== "none" && parsed.data.license_since
        ? parsed.data.license_since
        : null,
    license_issuer:
      parsed.data.license_type !== "none" && parsed.data.license_issuer?.trim()
        ? parsed.data.license_issuer.trim()
        : null,
    cv_custom_block: cvCustomBlock,
    education_country: parsed.data.education_country || "Germany",
    user_id: user.id
  };

  const { data: savedProfile, error: profileError } = await supabase
    .from("doctor_profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select("id")
    .single();

  if (profileError || !savedProfile) {
    return { success: false, message: profileError?.message || "Unable to save your doctor profile." };
  }

  const { error: deleteLanguageError } = await supabase
    .from("doctor_languages")
    .delete()
    .eq("doctor_profile_id", savedProfile.id);

  if (deleteLanguageError) {
    return { success: false, message: deleteLanguageError.message };
  }

  if (doctorLanguages.length > 0) {
    const { error: doctorLanguagesError } = await supabase.from("doctor_languages").insert(
      doctorLanguages.map((language) => ({
        doctor_profile_id: savedProfile.id,
        ...language
      }))
    );

    if (doctorLanguagesError) {
      return { success: false, message: doctorLanguagesError.message };
    }
  }

  const { error: deleteError } = await supabase
    .from("doctor_experiences")
    .delete()
    .eq("doctor_profile_id", savedProfile.id);

  if (deleteError) {
    return { success: false, message: deleteError.message };
  }

  if (experiences.length > 0) {
    const { error: experiencesError } = await supabase.from("doctor_experiences").insert(
      experiences.map((experience) => ({
        doctor_profile_id: savedProfile.id,
        ...experience
      }))
    );

    if (experiencesError) {
      return { success: false, message: experiencesError.message };
    }
  }

  const { error: deleteEducationError } = await supabase
    .from("doctor_educations")
    .delete()
    .eq("doctor_profile_id", savedProfile.id);

  if (deleteEducationError) {
    return { success: false, message: deleteEducationError.message };
  }

  if (educations.length > 0) {
    const { error: educationsError } = await supabase.from("doctor_educations").insert(
      educations.map((education) => ({
        doctor_profile_id: savedProfile.id,
        ...education
      }))
    );

    if (educationsError) {
      return { success: false, message: educationsError.message };
    }
  }

  const { error: deleteTrainingError } = await supabase
    .from("doctor_trainings")
    .delete()
    .eq("doctor_profile_id", savedProfile.id);

  if (deleteTrainingError) {
    return { success: false, message: deleteTrainingError.message };
  }

  if (trainings.length > 0) {
    const { error: trainingsError } = await supabase.from("doctor_trainings").insert(
      trainings.map((training) => ({
        doctor_profile_id: savedProfile.id,
        ...training
      }))
    );

    if (trainingsError) {
      return { success: false, message: trainingsError.message };
    }
  }

  const { error: deleteAdditionalSectionsError } = await supabase
    .from("doctor_additional_sections")
    .delete()
    .eq("doctor_profile_id", savedProfile.id);

  if (deleteAdditionalSectionsError) {
    return { success: false, message: deleteAdditionalSectionsError.message };
  }

  if (additionalSections.length > 0) {
    const { error: additionalSectionsError } = await supabase.from("doctor_additional_sections").insert(
      additionalSections.map((section) => ({
        doctor_profile_id: savedProfile.id,
        ...section
      }))
    );

    if (additionalSectionsError) {
      return { success: false, message: additionalSectionsError.message };
    }
  }

  revalidatePath("/dashboard/doctor");
  revalidatePath("/dashboard/doctor/cv");
  revalidatePath("/dashboard/doctor/cv/pdf-preview");
  revalidatePath("/dashboard/doctor/cv/export");
  revalidatePath("/dashboard/doctor/cv/export/pdf");
  revalidatePath("/dashboard/doctor/profile");
  revalidatePath("/doctors");
  return { success: true, message: "Doctor profile saved successfully." };
}

export async function reorderDoctorExperiencesAction(experienceIds: string[]) {
  if (!hasSupabaseEnv()) return;
  if (!Array.isArray(experienceIds) || experienceIds.length === 0) return;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You need to be logged in.");
  }

  const { data: profile } = await supabase
    .from("doctor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    throw new Error("Doctor profile not found.");
  }

  const { data: existingExperiences } = await supabase
    .from("doctor_experiences")
    .select("id")
    .eq("doctor_profile_id", profile.id);

  const validIds = new Set(((existingExperiences as { id: string }[] | null) ?? []).map((item) => item.id));
  const nextIds = experienceIds.filter((id) => validIds.has(id));

  if (nextIds.length === 0) return;

  const updates = nextIds.map((id, index) =>
    supabase
      .from("doctor_experiences")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("doctor_profile_id", profile.id)
  );

  const results = await Promise.all(updates);
  const failedUpdate = results.find((result) => result.error);

  if (failedUpdate?.error) {
    throw new Error(failedUpdate.error.message || "Unable to save work experience order.");
  }

  revalidatePath("/dashboard/doctor/cv");
  revalidatePath("/dashboard/doctor/profile");
}

export async function saveDoctorCvLayoutAction(input: {
  sectionOrder: string[];
  itemVisibility?: Record<string, boolean>;
  templateKey?: string;
  photoPresentation?: CvPhotoPresentation;
}) {
  if (!hasSupabaseEnv()) {
    return { success: true, message: "Demo mode: CV layout saved locally." };
  }

  const templateKey = input.templateKey?.trim() || "modern";
  const persistedSectionKeys = [...DEFAULT_CV_SECTION_ORDER, "custom_block"];
  const sectionOrder = Array.from(
    new Set(
      (input.sectionOrder ?? []).filter((key) => persistedSectionKeys.includes(key as never))
    )
  );

  for (const key of persistedSectionKeys) {
    if (!sectionOrder.includes(key)) {
      sectionOrder.push(key);
    }
  }
  const itemVisibility =
    input.itemVisibility && typeof input.itemVisibility === "object" ? input.itemVisibility : {};

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "You need to be logged in." };
  }

  const { data: profile } = await supabase
    .from("doctor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    return { success: false, message: "Doctor profile not found." };
  }

  const { error } = await supabase.from("doctor_cv_layouts").upsert(
    {
      doctor_profile_id: profile.id,
      template_key: templateKey,
      section_order: sectionOrder,
      item_visibility: itemVisibility
    },
    { onConflict: "doctor_profile_id,template_key" }
  );

  if (error) {
    return { success: false, message: error.message || "Unable to save your CV layout." };
  }

  revalidatePath("/dashboard/doctor/cv");
  return { success: true, message: "CV layout saved." };
}

export async function saveDoctorCvPhotoPresentationAction(input: {
  templateKey?: string;
  photoPresentation: CvPhotoPresentation;
}) {
  if (!hasSupabaseEnv()) {
    return {
      success: true,
      message: "Demo mode: Fotoausschnitt lokal gespeichert.",
      photoPresentation: normalizeCvPhotoPresentation(
        input.photoPresentation,
        input.photoPresentation.shape
      )
    };
  }

  const photoPresentation = normalizeCvPhotoPresentation(
    input.photoPresentation,
    input.photoPresentation.shape
  );

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "You need to be logged in." };
  }

  const { data: profile } = await supabase
    .from("doctor_profiles")
    .select("id, profile_photo_path, cv_photo_path")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    return { success: false, message: "Doctor profile not found." };
  }
  if (!(profile as { profile_photo_path?: string | null }).profile_photo_path) {
    return { success: false, message: "No profile photo is available for cropping." };
  }

  const { data: sourcePhoto, error: sourcePhotoError } = await supabase.storage
    .from(doctorProfilePhotoBucket)
    .download((profile as { profile_photo_path: string }).profile_photo_path);

  if (sourcePhotoError) {
    return {
      success: false,
      message: sourcePhotoError.message || "Unable to load the profile photo for cropping."
    };
  }

  let nextCvPhotoPath = (profile as { cv_photo_path?: string | null }).cv_photo_path ?? "";

  try {
    nextCvPhotoPath = await uploadPreparedCvPhoto({
      supabase,
      userId: user.id,
      sourceBuffer: Buffer.from(await sourcePhoto.arrayBuffer()),
      photoPresentation
    });
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unable to save photo framing."
    };
  }

  if ((profile as { cv_photo_path?: string | null }).cv_photo_path && (profile as { cv_photo_path?: string | null }).cv_photo_path !== nextCvPhotoPath) {
    const previousCvPhotoPath = (profile as { cv_photo_path?: string | null }).cv_photo_path as string;

    if (canManageDoctorPhotoStoragePath(previousCvPhotoPath, user.id)) {
      await supabase.storage
        .from(doctorProfilePhotoBucket)
        .remove([previousCvPhotoPath]);
    }
  }

  const { data: persistedProfile, error: persistedProfileError } = await supabase
    .from("doctor_profiles")
    .update({
      cv_photo_path: nextCvPhotoPath,
      cv_photo_presentation: photoPresentation
    })
    .eq("id", profile.id)
    .select("cv_photo_presentation")
    .single();

  if (persistedProfileError || !persistedProfile) {
    return {
      success: false,
      message:
        persistedProfileError?.message || "Saved photo framing could not be verified."
    };
  }

  const persistedPhotoPresentation = normalizeCvPhotoPresentation(
    (persistedProfile as { cv_photo_presentation?: unknown }).cv_photo_presentation,
    photoPresentation.shape
  );

  revalidatePath("/dashboard/doctor/cv");
  revalidatePath("/dashboard/doctor/profile");
  revalidatePath("/dashboard/doctor/cv/pdf-preview");
  revalidatePath("/dashboard/doctor/cv/export");
  revalidatePath("/dashboard/doctor/cv/export/pdf");

  return {
    success: true,
    message: "Fotoausschnitt gespeichert.",
    photoPresentation: persistedPhotoPresentation
  };
}

export async function updateFacilityProfileAction(_: ActionState, formData: FormData) {
  const parsed = facilityProfileSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message || "Please review the facility profile." };
  if (!hasSupabaseEnv()) return mockSuccess("Demo mode: facility profile form is ready. Connect Supabase to persist changes.");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "You need to be logged in." };

  const payload = { ...parsed.data, user_id: user.id };
  const { data, error } = await supabase
    .from("facility_profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select("id, user_id")
    .single();

  if (error || !data) {
    return {
      success: false,
      message: error?.message || "Unable to save the facility profile. Please check RLS insert/select policies."
    };
  }

  revalidatePath("/dashboard/facility");
  revalidatePath("/dashboard/facility/profile");
  return { success: true, message: "Facility profile saved successfully." };
}

export async function createOrUpdateOfferAction(_: ActionState, formData: FormData) {
  const parsed = jobOfferSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message || "Please review the offer details." };
  if (!hasSupabaseEnv()) return mockSuccess("Demo mode: offer form is wired and ready once Supabase is connected.");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "You need to be logged in." };

  const { data: facility } = await supabase
    .from("facility_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!facility) return { success: false, message: "Please complete the facility profile first." };

  const offerId = formData.get("offer_id")?.toString();
  const payload = {
    ...parsed.data,
    facility_id: facility.id,
    published_at: parsed.data.status === "published" ? new Date().toISOString() : null
  };

  if (offerId) {
    const { data, error } = await supabase
      .from("job_offers")
      .update(payload)
      .eq("id", offerId)
      .select("id, facility_id, status")
      .maybeSingle();

    if (error || !data) {
      return {
        success: false,
        message: error?.message || "Unable to update the offer."
      };
    }
  } else {
    const { data, error } = await supabase
      .from("job_offers")
      .insert(payload)
      .select("id, facility_id, status")
      .single();

    if (error || !data) {
      return {
        success: false,
        message: error?.message || "Unable to create the offer."
      };
    }
  }

  revalidatePath("/dashboard/facility/offers");
  revalidatePath("/opportunities");
  return { success: true, message: "Offer saved successfully." };
}

export async function createContactRequestAction(_: ActionState, formData: FormData) {
  const parsed = contactRequestSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message || "Please enter a clear message." };
  if (!hasSupabaseEnv()) return mockSuccess("Demo mode: contact request flow is ready and will save after Supabase setup.");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "You need to be logged in." };

  const { data, error } = await supabase
    .from("contact_requests")
    .insert({
      sender_user_id: user.id,
      receiver_user_id: parsed.data.receiver_user_id,
      related_offer_id: parsed.data.related_offer_id || null,
      message: parsed.data.message,
      status: "new"
    })
    .select("id")
    .limit(1);

  if (error || !data?.[0]) {
    return { success: false, message: error?.message || "Unable to send the contact request." };
  }

  revalidatePath("/dashboard/doctor/contacts");
  revalidatePath("/dashboard/facility/contacts");
  return { success: true, message: "Contact request sent successfully." };
}

export async function applyToOfferAction(_: ActionState, formData: FormData) {
  const offerId = formData.get("offer_id")?.toString().trim();
  if (!offerId) return { success: false, message: "Offer not found." };
  if (!hasSupabaseEnv()) return mockSuccess("Demo mode: application generated successfully.");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user: authUser }
  } = await supabase.auth.getUser();

  if (!authUser) return { success: false, message: "You need to be logged in." };

  const { data: user } = await supabase
    .from("users")
    .select("id, full_name, role")
    .eq("id", authUser.id)
    .maybeSingle();

  if (!user || user.role !== "doctor") {
    return { success: false, message: "Only doctor accounts can apply to opportunities." };
  }

  const { data: profile } = await supabase
    .from("doctor_profiles")
    .select("headline, specialty, city, country, years_experience, license_type, languages, bio, desired_contract_type, current_position")
    .eq("user_id", authUser.id)
    .maybeSingle();

  if (!profile) {
    return { success: false, message: "Please complete your doctor profile before applying." };
  }

  const { data: offer } = await supabase
    .from("job_offers")
    .select("id, facility_id, title, specialty, city, country, contract_type, status")
    .eq("id", offerId)
    .eq("status", "published")
    .maybeSingle();

  if (!offer) {
    return { success: false, message: "This published opportunity is no longer available." };
  }

  const { data: existingApplication } = await supabase
    .from("applications")
    .select("id")
    .eq("doctor_user_id", authUser.id)
    .eq("offer_id", offer.id)
    .maybeSingle();

  if (existingApplication) {
    return { success: true, message: "Application already submitted for this opportunity." };
  }

  const languages = Array.isArray(profile.languages) && profile.languages.length > 0
    ? profile.languages.join(", ")
    : "Not specified";
  const desiredContractType = profile.desired_contract_type?.trim()
    ? profile.desired_contract_type
    : "Flexible on contract type";
  const motivationSentence =
    `I am motivated to apply for the ${offer.title} opportunity in ${offer.city} because my ${profile.specialty} background and ${profile.years_experience} years of experience align well with the role's focus in ${offer.specialty}.`;

  const message = [
    `Doctor: ${user.full_name}`,
    `Current position: ${profile.current_position || "Not specified"}`,
    `Specialty: ${profile.specialty}`,
    `Location: ${profile.city}, ${profile.country}`,
    `Years of experience: ${profile.years_experience}`,
    `License type: ${profile.license_type || "Not specified"}`,
    `Languages: ${languages}`,
    `Summary: ${profile.bio || profile.headline || "No summary available."}`,
    `Desired contract type: ${desiredContractType}`,
    `Motivation: ${motivationSentence}`
  ].join("\n");

  const { data: insertedApplications, error } = await supabase
    .from("applications")
    .insert({
      doctor_user_id: authUser.id,
      offer_id: offer.id,
      facility_id: offer.facility_id,
      message,
      status: "submitted"
    })
    .select("id")
    .limit(1);

  if (error || !insertedApplications?.[0]) {
    return { success: false, message: error?.message || "Unable to submit your application." };
  }

  revalidatePath("/dashboard/doctor/opportunities");
  revalidatePath(`/dashboard/doctor/opportunities/${offer.id}`);
  revalidatePath("/dashboard/doctor");
  return { success: true, message: "Application submitted successfully." };
}

export async function updateApplicationStatusAction(_: ActionState, formData: FormData) {
  const result = await performApplicationStatusUpdate(formData);
  return { success: result.success, message: result.message };
}

export async function submitApplicationStatusTransitionAction(formData: FormData) {
  const result = await performApplicationStatusUpdate(formData);
  if (!result.success) {
    throw new Error(result.message);
  }

  redirect((result.detailPath || "/dashboard/facility/applications") as Route);
}

export async function sendApplicationMessageAction(formData: FormData) {
  const conversationId = formData.get("conversation_id")?.toString().trim();
  const redirectPath = formData.get("redirect_path")?.toString().trim();
  const content = formData.get("content")?.toString().trim();

  if (!conversationId || !redirectPath || !content) {
    throw new Error("Conversation id, redirect path, and message content are required.");
  }

  if (!hasSupabaseEnv()) {
    redirect(redirectPath as Route);
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You need to be logged in.");
  }

  const { data: conversation } = await supabase
    .from("application_conversations")
    .select("id, doctor_user_id, facility_user_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation || (conversation.doctor_user_id !== user.id && conversation.facility_user_id !== user.id)) {
    throw new Error("Conversation not available for this user.");
  }

  const { data: insertedMessages, error } = await supabase
    .from("application_messages")
    .insert({
      conversation_id: conversation.id,
      sender_user_id: user.id,
      content
    })
    .select("id")
    .limit(1);

  if (error || !insertedMessages?.[0]) {
    throw new Error(error?.message || "Unable to send message.");
  }

  revalidatePath(redirectPath);
  redirect(redirectPath as Route);
}

export async function insertContactEvent(formData: FormData) {
  const applicationId = formData.get("application_id")?.toString().trim();
  const contactPath = formData.get("contact_path")?.toString().trim();
  const contractType = formData.get("contract_type")?.toString().trim() ?? "";

  if (!contactPath) {
    throw new Error("Contact path is required.");
  }

  if (!hasSupabaseEnv() || !applicationId) {
    redirect(contactPath as Route);
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  try {
    if (user) {
      const { data: facility } = await supabase
        .from("facility_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (facility) {
        const { data: application } = await supabase
          .from("applications")
          .select("id, doctor_user_id, facility_id")
          .eq("id", applicationId)
          .eq("facility_id", facility.id)
          .maybeSingle();

        if (application) {
          const { error } = await supabase.from("contact_events").insert({
            application_id: application.id,
            facility_user_id: user.id,
            doctor_user_id: application.doctor_user_id,
            contract_type: contractType
          });

          if (error) {
            console.error("[insertContactEvent] failed to track contact event", {
              applicationId: application.id,
              facilityUserId: user.id,
              error: error.message
            });
          } else {
            revalidatePath("/dashboard/facility/applications");
            revalidatePath(`/dashboard/facility/applications/${application.id}`);
            revalidatePath(contactPath);
          }
        }
      }
    }
  } catch (error) {
    console.error("[insertContactEvent] unexpected failure", {
      applicationId,
      error
    });
  }

  redirect(contactPath as Route);
}

export async function markApplicationHiredAction(formData: FormData) {
  const applicationId = formData.get("application_id")?.toString().trim();
  const detailPath = formData.get("detail_path")?.toString().trim();

  if (!applicationId) {
    throw new Error("Application id is required.");
  }

  if (!hasSupabaseEnv()) {
    redirect((detailPath || "/dashboard/facility/applications") as Route);
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You need to be logged in.");
  }

  const { data: facility } = await supabase
    .from("facility_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!facility) {
    throw new Error("Only facility users can mark applications as hired.");
  }

  const { data: updatedApplication, error } = await supabase
    .from("applications")
    .select("id, hired, facility_id")
    .eq("id", applicationId)
    .eq("facility_id", facility.id)
    .maybeSingle();

  if (error || !updatedApplication) {
    throw new Error(error?.message || "Unable to load this application.");
  }

  const { count: contactEventsCount } = await supabase
    .from("contact_events")
    .select("id", { count: "exact", head: true })
    .eq("application_id", applicationId);

  const commissionDue = (contactEventsCount ?? 0) > 0;

  const { data: savedApplication, error: updateError } = await supabase
    .from("applications")
    .update({ hired: true, commission_due: commissionDue })
    .eq("id", applicationId)
    .eq("facility_id", facility.id)
    .select("id, hired, commission_due")
    .maybeSingle();

  if (updateError || !savedApplication || !savedApplication.hired) {
    throw new Error(updateError?.message || "Unable to mark this application as hired.");
  }

  revalidatePath("/dashboard/facility");
  revalidatePath("/dashboard/facility/applications");
  revalidatePath(`/dashboard/facility/applications/${applicationId}`);
  redirect((detailPath || `/dashboard/facility/applications/${applicationId}`) as Route);
}
