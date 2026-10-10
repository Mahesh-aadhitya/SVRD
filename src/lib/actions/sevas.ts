"use server";

import { z } from "zod";
import { revalidateTag, updateTag } from "next/cache";
import { after } from "next/server";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { findDuplicateEntry } from "@/lib/admin/duplicates";
import { resolveFolderId } from "@/lib/admin/folder-field";
import { todayInIndia } from "@/lib/dates";
import { findFocalPoint } from "@/lib/ai/focal-point";
import { describeRelease, SEVA_FREQUENCIES } from "@/lib/seva-types";

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const hhmm = z.string().regex(/^\d{2}:\d{2}$/);

const slotSchema = z
  .object({
    id: z.string().uuid().optional(),
    startTime: hhmm,
    endTime: z.union([z.literal(""), hhmm]),
    capacity: z.coerce.number().int().min(1).max(100000),
  })
  .refine((s) => !s.endTime || s.endTime > s.startTime, { message: "Each time slot must end after it starts" });

const sevaSchema = z.object({
  nameEn: z.string().trim().min(1, "Enter the seva name in English"),
  nameKn: z.string().trim().min(1, "Enter the seva name in Kannada"),
  descriptionEn: z.string().trim().min(1, "Enter a short description in English"),
  descriptionKn: z.string().trim().min(1, "Enter a short description in Kannada"),
  price: z.coerce.number().int().min(0, "Price can't be negative"),
  dayCapacity: z.coerce.number().int().min(1, "Devotees per day must be at least 1"),
  slots: z.array(slotSchema).max(24),
  dates: z.array(isoDate).max(400),
  blocked: z.record(isoDate, z.string().trim().max(160)),
  openForBooking: z.boolean(),
  postNotice: z.boolean(),
  frequency: z.enum(SEVA_FREQUENCIES),
  timing: z.string().trim().max(120),
  scheduleEn: z.string().trim().max(200),
  scheduleKn: z.string().trim().max(200),
  image: z.string().trim().max(500),
  listed: z.boolean(),
  allowRequests: z.boolean(),
  requestWeekdays: z.array(z.number().int().min(0).max(6)).max(7),
  bookMinDays: z.coerce.number().int().min(0).max(365),
  bookMaxDays: z.coerce.number().int().min(1).max(730),
});

export type SevaFormState = { error?: string } | undefined;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseJson(value: FormDataEntryValue | null) {
  try {
    return JSON.parse(String(value ?? "[]"));
  } catch {
    return [];
  }
}

// One action saves everything about a seva — details, timings and booking
// dates — so the admin works on a single page with a single Save button.
export async function saveSeva(
  existingId: string | null,
  locale: Locale,
  _prevState: SevaFormState,
  formData: FormData,
): Promise<SevaFormState> {
  await verifyAdminSession();
  const parsed = sevaSchema.safeParse({
    nameEn: formData.get("nameEn"),
    nameKn: formData.get("nameKn"),
    descriptionEn: formData.get("descriptionEn"),
    descriptionKn: formData.get("descriptionKn"),
    price: formData.get("price") || 0,
    dayCapacity: formData.get("dayCapacity") || 1,
    slots: parseJson(formData.get("slots")),
    dates: parseJson(formData.get("dates")),
    blocked: parseJson(formData.get("blocked") ?? "{}"),
    openForBooking: formData.get("openForBooking") === "on",
    postNotice: formData.get("postNotice") === "on",
    frequency: formData.get("frequency") || "special",
    timing: formData.get("timing") ?? "",
    scheduleEn: formData.get("scheduleEn") ?? "",
    scheduleKn: formData.get("scheduleKn") ?? "",
    image: formData.get("image") ?? "",
    listed: formData.get("listed") === "on",
    allowRequests: formData.get("allowRequests") === "on",
    requestWeekdays: parseJson(formData.get("requestWeekdays") ?? "[]"),
    bookMinDays: formData.get("bookMinDays") || 7,
    bookMaxDays: formData.get("bookMaxDays") || 90,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form" };
  const input = parsed.data;

  const starts = input.slots.map((s) => s.startTime);
  if (new Set(starts).size !== starts.length) return { error: "Two time slots start at the same time" };
  if (input.slots.length > 0 && input.slots.reduce((sum, s) => sum + s.capacity, 0) !== input.dayCapacity) {
    return { error: "Time slot tickets must add up to the total tickets per day" };
  }

  // Past dates are dropped silently — they can't be booked anyway.
  const today = todayInIndia();
  // A seva on request has no booking dates; "open" means accepting requests.
  const onRequest = input.frequency === "request";
  const dates = onRequest ? [] : [...new Set(input.dates)].filter((d) => d >= today).sort();
  if (onRequest && input.bookMaxDays <= input.bookMinDays) {
    return { error: "“Up to … days ahead” must be more than “Book at least … days ahead”." };
  }
  if (input.openForBooking && dates.length === 0 && !onRequest) {
    return { error: "Select at least one booking date on the calendar, or switch off “Open for booking”." };
  }

  // Blocked days are the ones not open for booking; past ones are dropped.
  const open = new Set(dates);
  const blocked = Object.fromEntries(Object.entries(input.blocked).filter(([d]) => d >= today && !open.has(d)));

  const supabase = createAdminClient();
  const duplicate = await findDuplicateEntry(
    supabase,
    "sevas",
    { title: { en: input.nameEn, kn: input.nameKn }, body: { en: input.descriptionEn ?? "", kn: input.descriptionKn ?? "" } },
    { excludeId: existingId },
  );
  if (duplicate) return { error: duplicate };
  const folder = await resolveFolderId(supabase, "sevas", formData);
  if ("error" in folder) return folder;

  let id = existingId;
  let previousDates: string[] = [];
  let previous: { image_url: string | null; image_focus: string | null } | null = null;
  if (id) {
    const { data } = await supabase.from("sevas").select("release_dates, image_url, image_focus").eq("id", id).single();
    previousDates = data?.release_dates ?? [];
    previous = data;
  } else {
    id = slugify(input.nameEn);
    if (!id) return { error: "The English name needs at least one letter or number" };
    const { data: clash } = await supabase.from("sevas").select("id").eq("id", id).maybeSingle();
    if (clash) return { error: "A seva with this English name already exists" };
  }

  const row = {
    folder_id: folder.folderId,
    name: { en: input.nameEn, kn: input.nameKn },
    description: { en: input.descriptionEn, kn: input.descriptionKn },
    price: input.price,
    capacity_per_slot: input.dayCapacity,
    is_active: input.openForBooking,
    release_mode: "dates" as const,
    release_dates: dates.length ? dates : null,
    release_start_date: dates[0] ?? null,
    release_end_date: dates.at(-1) ?? null,
    // A seva on request keeps its bookable weekdays here (none = every day).
    release_weekdays: onRequest && input.requestWeekdays.length ? [...new Set(input.requestWeekdays)].sort() : null,
    book_min_days: input.bookMinDays,
    book_max_days: input.bookMaxDays,
    frequency: input.frequency,
    timing: input.timing,
    schedule: { en: input.scheduleEn, kn: input.scheduleKn },
    image_url: input.image || null,
    // A new photo's face position is found again after saving (below).
    ...(previous?.image_url === (input.image || null) ? {} : { image_focus: null }),
    is_listed: input.listed,
    allow_requests: input.allowRequests,
    blocked_dates: blocked,
  };
  const { error } = existingId
    ? await supabase.from("sevas").update(row).eq("id", id)
    : await supabase.from("sevas").insert({ id, ...row });
  if (error) return { error: error.message };

  const slotError = await syncSlots(supabase, id, input.slots);
  if (slotError) return { error: `Seva saved, but time slots failed: ${slotError}` };

  const datesChanged = dates.join() !== [...previousDates].filter((d) => d >= today).sort().join();
  const postNew = input.postNotice && input.openForBooking && datesChanged;
  if (existingId) {
    const syncError = await syncReleaseNotices(supabase, id, row.name, dates, today, postNew);
    if (syncError) return { error: `Seva saved, but its notices failed to update: ${syncError}` };
  }
  if (postNew) {
    const noticeError = await postTicketReleaseNotice(supabase, id, row.name, dates);
    if (noticeError) return { error: `Seva saved, but the notice failed: ${noticeError}` };
  }

  // Find where the deity's face is in a new photo, so cards crop around it.
  const photo = row.image_url;
  if (photo && (previous?.image_url !== photo || !previous?.image_focus)) {
    const sevaId = id;
    after(async () => {
      const focus = await findFocalPoint(photo).catch(() => null);
      if (!focus) return;
      await supabase.from("sevas").update({ image_focus: focus }).eq("id", sevaId).eq("image_url", photo);
      // updateTag only works in the action itself, not after it.
      revalidateTag("sevas", { expire: 0 });
    });
  }

  updateTag("notices");
  updateTag("sevas");
  redirect({ href: "/admin/sevas", locale });
}

// Makes the seva's active slots match the submitted list. A removed slot
// that already has bookings is hidden instead of deleted, so those bookings
// keep their time.
async function syncSlots(supabase: SupabaseAdmin, sevaId: string, slots: z.infer<typeof slotSchema>[]) {
  const { data: existing, error } = await supabase.from("seva_slots").select("id").eq("seva_id", sevaId);
  if (error) return error.message;
  const keep = new Set(slots.map((s) => s.id).filter(Boolean));

  for (const slot of slots) {
    const fields = {
      start_time: slot.startTime,
      end_time: slot.endTime || null,
      capacity: slot.capacity,
      is_active: true,
    };
    const result =
      slot.id && existing?.some((e) => e.id === slot.id)
        ? await supabase.from("seva_slots").update(fields).eq("id", slot.id)
        : await supabase.from("seva_slots").insert({ seva_id: sevaId, ...fields });
    if (result.error) return result.error.message;
  }

  for (const old of existing ?? []) {
    if (keep.has(old.id)) continue;
    const { count } = await supabase.from("bookings").select("id", { count: "exact", head: true }).eq("slot_id", old.id);
    const result = count
      ? await supabase.from("seva_slots").update({ is_active: false }).eq("id", old.id)
      : await supabase.from("seva_slots").delete().eq("id", old.id);
    if (result.error) return result.error.message;
  }
  return null;
}

type SevaName = { en: string; kn: string };

const releaseLink = (sevaId: string) => `/booking?seva=${sevaId}`;

// Title, body and expiry of a "tickets open" notice for these dates.
function releaseNoticeText(name: SevaName, dates: string[]) {
  const fields = {
    releaseStartDate: dates[0],
    releaseEndDate: dates.at(-1)!,
    releaseMode: "dates" as const,
    releaseWeekdays: null,
    releaseDates: dates,
  };
  return {
    title: { en: `${name.en} — tickets open`, kn: `${name.kn} — ಟಿಕೆಟ್‌ಗಳು ಲಭ್ಯ` },
    body: {
      en: `Bookings are open for: ${describeRelease(fields, "en")}.`,
      kn: `ಬುಕಿಂಗ್ ತೆರೆದಿದೆ: ${describeRelease(fields, "kn")}.`,
    },
    expires_on: dates.at(-1)!,
  };
}

async function postTicketReleaseNotice(supabase: SupabaseAdmin, sevaId: string, name: SevaName, dates: string[]) {
  const { error } = await supabase.from("notices").insert({
    kind: "ticket_release",
    ...releaseNoticeText(name, dates),
    link_url: releaseLink(sevaId),
  });
  return error?.message ?? null;
}

// A release notice is written once, with the seva's name and dates in its
// text, so editing the seva later left the old name/dates on the home page
// and notices page. On every save, rewrite this seva's still-running release
// notices from the current name and dates — or retire them when a fresh
// notice is about to be posted, or when no dates are left.
async function syncReleaseNotices(
  supabase: SupabaseAdmin,
  sevaId: string,
  name: SevaName,
  dates: string[],
  today: string,
  replacing: boolean,
) {
  const yesterday = new Date(Date.parse(`${today}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  const running = supabase
    .from("notices")
    .update(replacing || dates.length === 0 ? { expires_on: yesterday } : releaseNoticeText(name, dates))
    .eq("kind", "ticket_release")
    .eq("link_url", releaseLink(sevaId))
    .or(`expires_on.is.null,expires_on.gte.${today}`);
  const { error } = await running;
  return error?.message ?? null;
}

// Quick pause/resume from the Sevas list.
export async function setSevaBookingOpen(id: string, open: boolean): Promise<void> {
  await verifyAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("sevas").update({ is_active: open }).eq("id", id);
  if (error) throw new Error(error.message);
  updateTag("sevas");
}

export type DeleteSevaState = { error?: string } | undefined;

// A seva with booking history can't be deleted (bookings.seva_id FK) — the
// admin closes it instead, which hides it from devotees but keeps records.
export async function deleteSeva(id: string, locale: Locale): Promise<DeleteSevaState> {
  await verifyAdminSession();
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("seva_id", id);
  if (count) return { error: `This seva has ${count} booking(s) on record — stop bookings instead of deleting.` };

  const { error } = await supabase.from("sevas").delete().eq("id", id);
  if (error) return { error: error.message };

  updateTag("sevas");
  redirect({ href: "/admin/sevas", locale });
}
