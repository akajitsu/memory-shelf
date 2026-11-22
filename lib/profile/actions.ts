"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/dal";
import type { AuthFormState } from "@/lib/auth/types";
import { fieldErrors } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your name.").max(120, "Use 120 characters or fewer."),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password.").max(72),
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(72, "Use 72 characters or fewer.")
      .regex(/[A-Za-z]/, "Include at least one letter.")
      .regex(/[0-9]/, "Include at least one number."),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." })
  .refine((d) => d.password !== d.currentPassword, {
    path: ["password"],
    message: "Choose a password different from your current one.",
  });

const str = (fd: FormData, k: string) => (typeof fd.get(k) === "string" ? (fd.get(k) as string) : "");

export async function updateProfile(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const user = await getSessionUser();
  if (!user) return { status: "error", message: "Your session has ended. Please sign in again." };

  const parsed = profileSchema.safeParse({ fullName: str(formData, "fullName") });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", user.id);
  if (error) {
    console.error("[profile] update", error.message);
    return { status: "error", message: "We couldn’t save your profile. Please try again." };
  }
  // Keep auth metadata in sync (used as a fallback for display).
  await supabase.auth.updateUser({ data: { full_name: parsed.data.fullName } });

  revalidatePath("/", "layout");
  return { status: "success", message: "Profile saved.", values: { fullName: parsed.data.fullName } };
}

export async function changePassword(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const user = await getSessionUser();
  if (!user?.email) return { status: "error", message: "Your session has ended. Please sign in again." };

  const parsed = passwordSchema.safeParse({
    currentPassword: str(formData, "currentPassword"),
    password: str(formData, "password"),
    confirmPassword: str(formData, "confirmPassword"),
  });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  // Re-verify the current password so a borrowed, unlocked session can't change it.
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });
  if (verifyError) {
    return { status: "error", fieldErrors: { currentPassword: "That isn’t your current password." } };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    const message =
      error.code === "weak_password"
        ? "That password is too weak. Try a longer, less common one."
        : error.code === "reauthentication_needed"
          ? "For security, please sign out and use “Forgot password” to set a new password."
          : "We couldn’t change your password. Please try again.";
    if (!["weak_password", "reauthentication_needed"].includes(error.code ?? "")) {
      console.error("[profile] password", error.code, error.message);
    }
    return { status: "error", message };
  }
  return { status: "success", message: "Password changed." };
}
