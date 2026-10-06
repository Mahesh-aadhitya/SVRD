"use server";

import { z } from "zod";
import { randomUUID } from "crypto";
import { updateTag } from "next/cache";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveFolderId } from "@/lib/admin/folder-field";
import { todayInIndia } from "@/lib/dates";

const eventSchema = z.object({
  titleEn: z.string().trim().min(1),
  titleKn: z.string().trim().min(1),
  descriptionEn: z.string().trim().min(1),
  descriptionKn: z.string().trim().min(1),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick the event date"),
  image: z.string().trim().optional(),
});

export type EventFormState = { error?: string } | undefined;

function parseForm(formData: FormData) {
  return eventSchema.safeParse({
    titleEn: formData.get("titleEn"),
    titleKn: formData.get("titleKn"),
    descriptionEn: formData.get("descriptionEn"),
    descriptionKn: formData.get("descriptionKn"),
    eventDate: formData.get("eventDate"),
    image: formData.get("image") ?? undefined,
  });
}

export async function createEvent(
  locale: Locale,
  _prevState: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await verifyAdminSession();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "invalid" };
  const { titleEn, titleKn, descriptionEn, descriptionKn, eventDate, image } = parsed.data;
  if (eventDate < todayInIndia()) return { error: "Event date can't be in the past" };

  const supabase = createAdminClient();
  const folder = await resolveFolderId(supabase, "events", formData);
  if ("error" in folder) return folder;
  const { error } = await supabase.from("events").insert({
    folder_id: folder.folderId,
    id: randomUUID(),
    title: { en: titleEn, kn: titleKn },
    description: { en: descriptionEn, kn: descriptionKn },
    event_date: eventDate,
    image_url: image || null,
  });
  if (error) return { error: error.message };

  updateTag("events");
  redirect({ href: "/admin/events", locale });
}

export async function updateEvent(
  id: string,
  locale: Locale,
  _prevState: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await verifyAdminSession();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: "invalid" };
  const { titleEn, titleKn, descriptionEn, descriptionKn, eventDate, image } = parsed.data;

  const supabase = createAdminClient();
  const folder = await resolveFolderId(supabase, "events", formData);
  if ("error" in folder) return folder;
  const { error } = await supabase
    .from("events")
    .update({
      folder_id: folder.folderId,
      title: { en: titleEn, kn: titleKn },
      description: { en: descriptionEn, kn: descriptionKn },
      event_date: eventDate,
      image_url: image || null,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  updateTag("events");
  redirect({ href: "/admin/events", locale });
}

export async function deleteEvent(id: string, locale: Locale): Promise<void> {
  await verifyAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw new Error(error.message);

  updateTag("events");
  redirect({ href: "/admin/events", locale });
}
