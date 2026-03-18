import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

export const signUpSchema = signInSchema.extend({
  fullName: z.string().min(2, "Please enter your full name."),
  role: z.enum(["doctor", "facility"], {
    required_error: "Please choose your account type."
  })
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
