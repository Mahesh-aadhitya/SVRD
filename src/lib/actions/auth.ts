"use server";

import { z } from "zod";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile, getDevotee } from "@/lib/devotee/auth";

// Email + password accounts for devotees who don't use Google. New
// accounts (and password resets) are confirmed with a 6-digit code emailed
// by Supabase Auth — the "Confirm signup" and "Reset password" email
// templates must include {{ .Token }}.

export type AuthStep = "signin" | "signup" | "verify" | "forgot" | "reset";
export type AuthResult =
  | { ok: true; step?: AuthStep; email?: string; purpose?: "signup" | "recovery"; message?: AuthMessage }
  | { ok: false; error: AuthError };
export type AuthError =
  | "invalid"
  | "weakPassword"
  | "badCredentials"
  | "exists"
  | "badCode"
  | "rateLimited"
  | "failed";
export type AuthMessage = "codeSent" | "codeResent";

const email = z.string().trim().toLowerCase().email().max(200);
const password = z.string().min(8).max(72);

function mapError(message: string): AuthError {
  const m = message.toLowerCase();
  if (m.includes("rate limit") || m.includes("security purposes") || m.includes("too many")) return "rateLimited";
  if (m.includes("invalid login") || m.includes("invalid credentials")) return "badCredentials";
  if (m.includes("already registered") || m.includes("already exists")) return "exists";
  if (m.includes("expired") || m.includes("invalid") || m.includes("otp")) return "badCode";
  if (m.includes("password")) return "weakPassword";
  console.error("auth:", message);
  return "failed";
}

// Only same-site paths, localized for the redirect helper.
function safeNext(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

async function finish(locale: string, next: string): Promise<never> {
  const devotee = await getDevotee();
  if (devotee) await ensureProfile(devotee).catch((e) => console.error("ensureProfile:", e));
  redirect({ href: safeNext(next), locale });
  throw new Error("unreachable");
}

export async function signUpWithEmail(input: { name: string; email: string; password: string }): Promise<AuthResult> {
  const parsed = z.object({ name: z.string().trim().min(2).max(100), email, password }).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.some((i) => i.path[0] === "password") ? "weakPassword" : "invalid" };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.name } },
  });
  if (error) return { ok: false, error: mapError(error.message) };
  // Supabase hides whether an address exists: an existing, confirmed
  // account comes back with no identities and no email is sent.
  if (data.user && data.user.identities?.length === 0) return { ok: false, error: "exists" };
  return { ok: true, step: "verify", email: parsed.data.email, purpose: "signup", message: "codeSent" };
}

export async function signInWithEmail(locale: string, next: string, input: { email: string; password: string }): Promise<AuthResult> {
  const parsed = z.object({ email, password: z.string().min(1).max(72) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // Signed up but never entered the code: send a fresh one.
    if (error.message.toLowerCase().includes("not confirmed")) {
      await supabase.auth.resend({ type: "signup", email: parsed.data.email });
      return { ok: true, step: "verify", email: parsed.data.email, purpose: "signup", message: "codeSent" };
    }
    return { ok: false, error: mapError(error.message) };
  }
  return finish(locale, next);
}

export async function verifyEmailCode(
  locale: string,
  next: string,
  input: { email: string; code: string; purpose: "signup" | "recovery" },
): Promise<AuthResult> {
  const parsed = z.object({ email, code: z.string().trim().regex(/^\d{6,10}$/) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "badCode" };
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.code,
    type: input.purpose === "recovery" ? "recovery" : "signup",
  });
  if (error) return { ok: false, error: mapError(error.message) };
  // A reset code signs them in; now they choose the new password.
  if (input.purpose === "recovery") return { ok: true, step: "reset" };
  return finish(locale, next);
}

export async function resendEmailCode(input: { email: string; purpose: "signup" | "recovery" }): Promise<AuthResult> {
  const parsed = email.safeParse(input.email);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const supabase = await createClient();
  const { error } =
    input.purpose === "recovery"
      ? await supabase.auth.resetPasswordForEmail(parsed.data)
      : await supabase.auth.resend({ type: "signup", email: parsed.data });
  if (error) return { ok: false, error: mapError(error.message) };
  return { ok: true, message: "codeResent" };
}

export async function requestPasswordReset(input: { email: string }): Promise<AuthResult> {
  const parsed = email.safeParse(input.email);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data);
  if (error) return { ok: false, error: mapError(error.message) };
  // Same answer whether or not the address has an account.
  return { ok: true, step: "verify", email: parsed.data, purpose: "recovery", message: "codeSent" };
}

export async function setNewPassword(locale: string, next: string, input: { password: string }): Promise<AuthResult> {
  const parsed = password.safeParse(input.password);
  if (!parsed.success) return { ok: false, error: "weakPassword" };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { ok: false, error: mapError(error.message) };
  return finish(locale, next);
}
