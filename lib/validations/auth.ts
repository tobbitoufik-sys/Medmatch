import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Bitte geben Sie eine gültige E-Mail-Adresse ein."),
  password: z.string().min(8, "Das Passwort muss mindestens 8 Zeichen lang sein.")
});

export const signUpSchema = signInSchema.extend({
  fullName: z.string().min(2, "Bitte geben Sie Ihren vollständigen Namen ein."),
  role: z.enum(["doctor", "facility"], {
    required_error: "Bitte wählen Sie Ihren Kontotyp aus."
  })
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
