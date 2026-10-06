"use server";

import { z } from "zod";
import { updateTag } from "next/cache";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayInIndia } from "@/lib/dates";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const noticeSchema = z
  .object({
    kind: z.enum(["update", "ticket_release", "event_reminder", "alert"]),
    titleEn: z.string().trim().min(1).max(200),
    titleKn: z.string().trim().min(1).max(200),
    bodyEn: z.string().trim().min(1).max(3000),
    bodyKn: z.string().trim().min(1).max(3000),
    linkUrl: z
      .string()
      .trim()
      .max(500)
      .refine((v) => v === "" || v.startsWith("/") || /^https:\/\//.test(v), {
        message: "Link must be a site path like /booking or a full https:// address",
      }),
    isPinned: z.boolean(),
    publishOn: isoDate,
    expiresOn: z.union([z.literal(""), isoDate]),
  })
  .refine((v) => !v.expiresOn || v.expiresOn >= v.publishOn, {
    message: "The notice must expire on or after its publish date",
  });

export type NoticeFormState = { error?: string } | undefined;

function parseForm(formData: FormData) {
  return noticeSchema.safeParse({
    kind: formData.get("kind"),
    titleEn: formData.get("titleEn"),
    titleKn: formData.get("titleKn"),
    bodyEn: formData.get("bodyEn"),
    bodyKn: formData.get("bodyKn"),
    linkUrl: formData.get("linkUrl") ?? "",
    isPinned: formData.get("isPinned") === "on",
    publishOn: formData.get("publishOn") || todayInIndia(),
    expiresOn: formData.get("expiresOn") ?? "",
  });
}

function toRow(data: z.infer<typeof noticeSchema>) {
  return {
    kind: data.kind,
    title: { en: data.titleEn, kn: data.titleKn },
    body: { en: data.bodyEn, kn: data.bodyKn },
    link_url: data.linkUrl || null,
    is_pinned: data.isPinned,
    publish_on: data.publishOn,
    expires_on: data.expiresOn || null,
  };
}

export async function createNotice(
  locale: Locale,
  _prevState: NoticeFormState,
  formData: FormData,
): Promise<NoticeFormState> {
  await verifyAdminSession();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "invalid" };
  if (parsed.data.publishOn < todayInIndia()) return { error: "Publish date can't be in the past" };

  const supabase = createAdminClient();
  const { error } = await supabase.from("notices").insert(toRow(parsed.data));
  if (error) return { error: error.message };

  updateTag("notices");
  redirect({ href: "/admin/notices", locale });
}

export async function updateNotice(
  id: string,
  locale: Locale,
  _prevState: NoticeFormState,
  formData: FormData,
): Promise<NoticeFormState> {
  await verifyAdminSession();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "invalid" };

  const supabase = createAdminClient();
  const { error } = await supabase.from("notices").update(toRow(parsed.data)).eq("id", id);
  if (error) return { error: error.message };

  updateTag("notices");
  redirect({ href: "/admin/notices", locale });
}

export async function setNoticePinned(id: string, isPinned: boolean): Promise<void> {
  await verifyAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("notices").update({ is_pinned: isPinned }).eq("id", id);
  if (error) throw new Error(error.message);
  updateTag("notices");
}

export async function deleteNotice(id: string): Promise<void> {
  await verifyAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("notices").delete().eq("id", id);
  if (error) throw new Error(error.message);
  updateTag("notices");
}

// One-click festival reminder from the admin Events list: posts a notice
// that stays up until the event day.
export async function postEventReminder(eventId: string, locale: Locale): Promise<void> {
  await verifyAdminSession();
  const supabase = createAdminClient();
  const { data: event, error } = await supabase
    .from("events")
    .select("title, event_date, description")
    .eq("id", eventId)
    .single();
  if (error) throw new Error(error.message);
  if (event.event_date < todayInIndia()) throw new Error("This event has already passed");

  const fmt = (loc: string) =>
    new Date(`${event.event_date}T00:00:00`).toLocaleDateString(loc, { weekday: "long", day: "numeric", month: "long" });
  const { error: insertError } = await supabase.from("notices").insert({
    kind: "event_reminder",
    title: { en: `${event.title.en} — ${fmt("en-IN")}`, kn: `${event.title.kn} — ${fmt("kn-IN")}` },
    body: event.description,
    link_url: "/events",
    expires_on: event.event_date,
  });
  if (insertError) throw new Error(insertError.message);

  updateTag("notices");
  redirect({ href: "/admin/notices", locale });
}
