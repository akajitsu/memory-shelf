import { z } from "zod";

const email = z.email("Enter a valid email address.").trim().toLowerCase().max(254);

// Supabase (bcrypt) ignores bytes beyond 72, so cap there.
const newPassword = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use 72 characters or fewer.")
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/[0-9]/, "Include at least one number.");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(72),
  remember: z.boolean(),
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(1, "Enter your name.").max(120, "Use 120 characters or fewer."),
    email,
    password: newPassword,
    confirmPassword: z.string(),
    terms: z.literal(true, { error: "Please accept the terms to continue." }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password: newPassword, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const resendSchema = z.object({ email });

/** Flatten zod issues to { field: firstMessage }. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
