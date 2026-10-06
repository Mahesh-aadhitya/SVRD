"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDevotee } from "@/lib/devotee/auth";
import { NAKSHATRA_KEYS } from "@/lib/nakshatras";

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null);

const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .pipe(z.union([z.literal(""), z.string().regex(/^\+?[0-9]{10,13}$/)])),
  gotram: optional(60),
  nakshatram: optional(40).refine((v) => v === null || NAKSHATRA_KEYS.includes(v)),
});

export type ProfileFormState = { error?: "invalid" | "login"; saved?: boolean } | undefined;

export async function updateProfile(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const devotee = await getDevotee();
  if (!devotee) return { error: "login" };
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName") ?? "",
    phone: formData.get("phone") ?? "",
    gotram: formData.get("gotram") ?? "",
    nakshatram: formData.get("nakshatram") ?? "",
  });
  if (!parsed.success) return { error: "invalid" };
  const { fullName, phone, gotram, nakshatram } = parsed.data;
  const { error } = await createAdminClient()
    .from("devotee_profiles")
    .upsert({ id: devotee.id, email: devotee.email, full_name: fullName, phone, gotram, nakshatram }, { onConflict: "id" });
  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/account", "page");
  return { saved: true };
}

export type ClaimState = { error?: "notFound" | "taken" | "login"; claimed?: string } | undefined;

// Adds a booking made before signing in (or before accounts existed) to
// this account. Same proof as "find my ticket": the reference plus the
// mobile number used to book. A booking already on another account stays
// there.
export async function claimBooking(_prev: ClaimState, formData: FormData): Promise<ClaimState> {
  const devotee = await getDevotee();
  if (!devotee) return { error: "login" };
  const reference = String(formData.get("reference") ?? "").trim().toUpperCase();
  const phone = String(formData.get("phone") ?? "");
  if (!/^[A-F0-9]{8}$/.test(reference)) return { error: "notFound" };

  const supabase = createAdminClient();
  const { data } = await supabase.from("bookings").select("id, phone, user_id").eq("reference", reference).maybeSingle();
  const digits = (v: string) => v.replace(/\D/g, "").slice(-10);
  if (!data || digits(data.phone) !== digits(phone)) return { error: "notFound" };
  if (data.user_id && data.user_id !== devotee.id) return { error: "taken" };
  if (!data.user_id) {
    const { error } = await supabase.from("bookings").update({ user_id: devotee.id }).eq("id", data.id).is("user_id", null);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/[locale]/account", "page");
  return { claimed: reference };
}

export async function signOutDevotee(locale: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect({ href: "/", locale });
}
