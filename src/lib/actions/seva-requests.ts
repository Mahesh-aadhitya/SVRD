"use server";

import { z } from "zod";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDevotee } from "@/lib/devotee/auth";
import { todayInIndia } from "@/lib/dates";
import { NAKSHATRA_KEYS } from "@/lib/nakshatras";
import { getSevaRequestById } from "@/lib/data/seva-requests";
import { notifySevaRequest } from "@/lib/notify/seva-request-alert";
import { siteOrigin } from "@/lib/site-url";
import { REQUEST_OCCASIONS, REQUEST_STATUSES, type RequestStatus } from "@/lib/seva-requests/types";

// ── Devotee: ask for a seva on a day of their choosing ──────────────────

export type SevaRequestError = "invalid" | "pastDate" | "login" | "rateLimited" | "failed";
export type SevaRequestResult = { ok: true; reference: string; phone: string } | { ok: false; error: SevaRequestError };

const MAX_PER_DAY = 5;

const requestSchema = z.object({
  // A listed seva's id, or null with `otherSeva` describing it.
  sevaId: z.string().max(100).nullable(),
  otherSeva: z.string().trim().max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  occasion: z.enum(REQUEST_OCCASIONS).or(z.literal("")),
  devotees: z
    .array(
      z.object({
        name: z.string().trim().min(2).max(100),
        gotram: z.string().trim().max(60).nullable().optional(),
        nakshatram: z.enum(NAKSHATRA_KEYS).or(z.literal("")).nullable().optional(),
      }),
    )
    .min(1)
    .max(10),
  phone: z
    .string()
    .transform((v) => v.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, ""))
    .refine((v) => /^\d{10}$/.test(v)),
  note: z.string().trim().max(1000),
});

export async function createSevaRequest(locale: string, input: z.input<typeof requestSchema>): Promise<SevaRequestResult> {
  const devotee = await getDevotee();
  if (!devotee) return { ok: false, error: "login" };
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const r = parsed.data;
  if (r.date < todayInIndia()) return { ok: false, error: "pastDate" };

  const supabase = createAdminClient();
  let sevaName = r.otherSeva;
  if (r.sevaId) {
    const { data: seva } = await supabase.from("sevas").select("id, name, is_listed, allow_requests").eq("id", r.sevaId).maybeSingle();
    if (!seva || !seva.is_listed || !seva.allow_requests) return { ok: false, error: "invalid" };
    const name = seva.name as { en: string; kn: string };
    sevaName = (locale === "kn" ? name.kn : name.en) || name.en;
  }
  if (!sevaName) return { ok: false, error: "invalid" };

  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const { count } = await supabase
    .from("seva_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", devotee.id)
    .gte("created_at", dayAgo);
  if ((count ?? 0) >= MAX_PER_DAY) return { ok: false, error: "rateLimited" };

  const { data, error } = await supabase
    .from("seva_requests")
    .insert({
      user_id: devotee.id,
      seva_id: r.sevaId,
      seva_name: sevaName,
      requested_date: r.date,
      occasion: r.occasion,
      devotees: r.devotees.map((d) => ({ name: d.name, gotram: d.gotram || null, nakshatram: d.nakshatram || null })),
      phone: r.phone,
      email: devotee.email,
      note: r.note,
      locale: locale === "kn" ? "kn" : "en",
    })
    .select("id, reference")
    .single();
  if (error || !data) {
    console.error("createSevaRequest:", error?.message);
    return { ok: false, error: "failed" };
  }
  await supabase.from("devotee_profiles").update({ phone: r.phone }).eq("id", devotee.id).eq("phone", "");
  revalidatePath("/[locale]/admin", "layout");

  // The priest (WhatsApp + email) and the devotee (email) are told after
  // the response.
  const origin = await siteOrigin();
  after(async () => {
    const saved = await getSevaRequestById(data.id).catch(() => null);
    if (saved) await notifySevaRequest(saved, `${origin}/admin/seva-requests`);
  });

  return { ok: true, reference: data.reference, phone: r.phone };
}

// ── Admin: follow each request up ────────────────────────────────────────

export async function updateSevaRequest(id: string, patch: { status?: RequestStatus; officeNote?: string }) {
  await verifyAdminSession();
  const update: Record<string, string> = {};
  if (patch.status) {
    if (!REQUEST_STATUSES.includes(patch.status)) throw new Error("invalid status");
    update.status = patch.status;
  }
  if (patch.officeNote !== undefined) update.office_note = patch.officeNote.slice(0, 1000);
  const { error } = await createAdminClient().from("seva_requests").update(update).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/admin", "layout");
}
