import { z } from "zod";
import { jobOfferContractTypes } from "@/lib/job-offers";

const optionalText = z.string().trim().optional().transform((value) => value ?? "");
const optionalDate = z.string().optional().transform((value) => value || "");
const optionalYear = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? null : value),
  z.coerce.number().int().min(1900).max(2100).nullable()
);
const currentPositionSchema = z
  .enum(["Assistenzarzt", "Facharzt", "Oberarzt", "Leitender Oberarzt", "Chefarzt"])
  .or(z.literal(""));
const licenseTypeSchema = z
  .enum(["approbation", "berufserlaubnis", "none"])
  .or(z.literal(""));

export const doctorProfileSchema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  date_of_birth: optionalDate,
  nationality: optionalText,
  phone: optionalText,
  street: optionalText,
  postal_code: optionalText,
  profile_photo_path: optionalText,
  headline: optionalText,
  specialty: z.string().min(2),
  city: z.string().min(2),
  country: z.string().min(2),
  professional_summary: optionalText,
  languages: optionalText,
  years_experience: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? 0 : value),
    z.coerce.number().min(0).max(60)
  ),
  availability: optionalText,
  desired_contract_type: optionalText,
  bio: optionalText,
  license_type: licenseTypeSchema.default("none"),
  license_since: optionalDate,
  license_issuer: optionalText,
  current_position: currentPositionSchema.default(""),
  degree_name: optionalText,
  graduation_year: optionalYear,
  education_university: optionalText,
  education_country: optionalText,
  education_from_date: optionalDate,
  education_to_date: optionalDate,
  is_public: z.boolean().default(true)
});

export const facilityProfileSchema = z.object({
  facility_name: z.string().min(2),
  facility_type: z.string().min(2),
  city: z.string().min(2),
  country: z.string().min(2),
  website: z.string().url().or(z.literal("")).default(""),
  description: z.string().min(30).max(700),
  contact_person_name: z.string().min(2)
});

export const jobOfferSchema = z.object({
  title: z.string().min(2),
  specialty: z.string().min(2),
  city: z.string().min(2),
  country: z.string().min(2),
  contract_type: z.enum(jobOfferContractTypes),
  description: z.string().min(30).max(1000),
  requirements: z.string().min(20).max(800),
  salary_range_optional: z.string().optional().default(""),
  status: z.enum(["draft", "published", "paused"]).default("draft")
});

export const contactRequestSchema = z.object({
  receiver_user_id: z.string().min(1),
  related_offer_id: z.string().optional(),
  message: z.string().min(20).max(1000)
});

export type DoctorProfileValues = z.infer<typeof doctorProfileSchema>;
export type FacilityProfileValues = z.infer<typeof facilityProfileSchema>;
export type JobOfferValues = z.infer<typeof jobOfferSchema>;
export type ContactRequestValues = z.infer<typeof contactRequestSchema>;
