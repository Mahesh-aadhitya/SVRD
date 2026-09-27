"use server";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string } | undefined;

export async function login(
  locale: Locale,
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "invalidCredentials" };
  }

  redirect({ href: "/admin", locale });
}

export async function logout(locale: Locale) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect({ href: "/admin/login", locale });
}
