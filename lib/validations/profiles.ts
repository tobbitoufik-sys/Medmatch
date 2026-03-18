import { z } from "zod";

export const doctorProfileSchema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  title: z.string().min(2),
  specialty: z.string().min(2),
  sub_specialty: z.string().optional().default(""),
  city: z.string().min(2),
  country: z.string().min(2),
  languages: z.string().min(2),
  years_experience: z.coerce.number().min(0).max(60),
  availability: z.string().min(2),
  contract_type: z.string().min(2),
  bio: z.string().min(30).max(600),
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
  contract_type: z.string().min(2),
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
