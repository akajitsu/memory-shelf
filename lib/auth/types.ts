export type AuthFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  /** Machine-readable reason, e.g. "email_not_confirmed". */
  code?: string;
  fieldErrors?: Record<string, string>;
  /** Echoed non-secret values so the form can repopulate after a server error. */
  values?: { email?: string; fullName?: string };
};

export const initialAuthState: AuthFormState = { status: "idle" };
