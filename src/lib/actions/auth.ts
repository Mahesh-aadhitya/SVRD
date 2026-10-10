"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "@/i18n/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailCode, mayEmailCode, type CodePurpose } from "@/lib/email/auth-code";
import { ensureProfile, getDevotee } from "@/lib/devotee/auth";
import { welcomeCookie } from "@/lib/welcome";

// Email + password accounts for devotees who don't use Google. New
// accounts (and password resets) are confirmed with a code that Supabase
// makes and the site emails from the temple's Gmail (lib/email/auth-code) —
// Supabase's own emails and templates aren't used.

export type AuthStep = "signin" | "signup" | "verify" | "forgot";
export type AuthResult =
  | { ok: true; step?: AuthStep; email?: string; purpose?: "signup" | "recovery"; message?: AuthMessage }
  | { ok: false; error: AuthError };
export type AuthError =
  | "invalid"
  | "weakPassword"
  | "badCredentials"
  | "exists"
  | "badCode"
  | "samePassword"
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
  if (m.includes("different from the old")) return "samePassword";
  if (m.includes("password")) return "weakPassword";
  console.error("auth:", message);
  return "failed";
}

// Only same-site paths, localized for the redirect helper.
function safeNext(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

// Makes a code for `address` and emails it; null when done (or when there
// is no account to send a reset code to).
async function sendCode(
  locale: string,
  address: string,
  purpose: CodePurpose,
  signup?: { password: string; name: string },
): Promise<AuthResult | null> {
  try {
    if (!(await mayEmailCode(address))) return { ok: false, error: "rateLimited" };
    const admin = createAdminClient();
    if (signup) {
      // Creates the unconfirmed account, or finds one from an earlier try —
      // which keeps that try's password, so set this one. Changing the
      // password voids the code just made, so the code sent is made after.
      const created = await admin.auth.admin.generateLink({
        type: "signup",
        email: address,
        password: signup.password,
        options: { data: { full_name: signup.name } },
      });
      if (created.error) {
        return { ok: false, error: created.error.code === "email_exists" ? "exists" : mapError(created.error.message) };
      }
      const updated = await admin.auth.admin.updateUserById(created.data.user.id, {
        password: signup.password,
        user_metadata: { full_name: signup.name },
      });
      if (updated.error) return { ok: false, error: mapError(updated.error.message) };
    } else if (purpose === "signup") {
      // A resent sign-up code. Supabase would make a new, password-less
      // account for an unknown address, so only send to one awaiting its code.
      const status = await admin.rpc("auth_email_status", { p_email: address });
      if (status.error) throw new Error(status.error.message);
      if (status.data !== "unconfirmed") return null;
    }
    const { data, error } = await admin.auth.admin.generateLink({
      type: purpose === "recovery" ? "recovery" : "magiclink",
      email: address,
    });
    if (error) {
      // No account here: answer as if a code went out, so the form can't
      // be used to find out who has an account.
      if (error.code === "user_not_found") return null;
      return { ok: false, error: mapError(error.message) };
    }
    await emailCode(address, data.properties.email_otp, purpose, locale);
    return null;
  } catch (e) {
    console.error("sendCode:", e);
    return { ok: false, error: "failed" };
  }
}

async function finish(locale: string, next: string): Promise<never> {
  const devotee = await getDevotee();
  if (devotee) {
    const profile = await ensureProfile(devotee).catch((e) => (console.error("ensureProfile:", e), null));
    const welcome = welcomeCookie(profile?.fullName || devotee.name);
    (await cookies()).set(welcome.name, welcome.value, welcome.options);
  }
  redirect({ href: safeNext(next), locale });
  throw new Error("unreachable");
}

// After Google sign-in on the page itself (the session cookies are already
// set): make the profile, leave the welcome greeting and go on to `next`.
export async function finishSignIn(locale: string, next: string): Promise<AuthResult> {
  return finish(locale, next);
}

export async function signUpWithEmail(locale: string, input: { name: string; email: string; password: string }): Promise<AuthResult> {
  const parsed = z.object({ name: z.string().trim().min(2).max(100), email, password }).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.some((i) => i.path[0] === "password") ? "weakPassword" : "invalid" };
  }
  const failed = await sendCode(locale, parsed.data.email, "signup", parsed.data);
  if (failed) return failed;
  return { ok: true, step: "verify", email: parsed.data.email, purpose: "signup", message: "codeSent" };
}

export async function signInWithEmail(locale: string, next: string, input: { email: string; password: string }): Promise<AuthResult> {
  const parsed = z.object({ email, password: z.string().min(1).max(72) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // Signed up but never entered the code: send a fresh one.
    // (If one went out under a minute ago, that one still works.)
    if (error.message.toLowerCase().includes("not confirmed")) {
      const failed = await sendCode(locale, parsed.data.email, "signup");
      if (failed && failed.ok === false && failed.error !== "rateLimited") return failed;
      return { ok: true, step: "verify", email: parsed.data.email, purpose: "signup", message: failed ? undefined : "codeSent" };
    }
    return { ok: false, error: mapError(error.message) };
  }
  return finish(locale, next);
}

export async function verifyEmailCode(locale: string, next: string, input: { email: string; code: string }): Promise<AuthResult> {
  const parsed = z.object({ email, code: z.string().trim().regex(/^\d{6,10}$/) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "badCode" };
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.code,
    // "email" covers both the sign-up code and a resent one.
    type: "email",
  });
  if (error) return { ok: false, error: mapError(error.message) };
  return finish(locale, next);
}

export async function resendEmailCode(locale: string, input: { email: string; purpose: "signup" | "recovery" }): Promise<AuthResult> {
  const parsed = email.safeParse(input.email);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const failed = await sendCode(locale, parsed.data, input.purpose === "recovery" ? "recovery" : "signup");
  if (failed) return failed;
  return { ok: true, message: "codeResent" };
}

export async function requestPasswordReset(locale: string, input: { email: string }): Promise<AuthResult> {
  const parsed = email.safeParse(input.email);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const failed = await sendCode(locale, parsed.data, "recovery");
  if (failed) return failed;
  // Same answer whether or not the address has an account.
  return { ok: true, step: "verify", email: parsed.data, purpose: "recovery", message: "codeSent" };
}

// A forgotten password: the emailed code and the new password arrive
// together. The code is checked on a throwaway client, so it signs nobody in
// by itself — a session before the password is saved would let the login
// page send them off without one (Google accounts included, which have none).
export async function resetPasswordWithCode(
  locale: string,
  next: string,
  input: { email: string; code: string; password: string },
): Promise<AuthResult> {
  const parsed = z.object({ email, code: z.string().trim().regex(/^\d{6,10}$/), password }).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.some((i) => i.path[0] === "password") ? "weakPassword" : "badCode" };
  }
  const temp = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const verified = await temp.auth.verifyOtp({ email: parsed.data.email, token: parsed.data.code, type: "recovery" });
  if (verified.error) return { ok: false, error: mapError(verified.error.message) };
  const updated = await temp.auth.updateUser({ password: parsed.data.password });
  await temp.auth.signOut({ scope: "local" });
  if (updated.error) return { ok: false, error: mapError(updated.error.message) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error) return { ok: false, error: mapError(error.message) };
  return finish(locale, next);
}
