"use server";

import { z } from "zod";
import { updateTag } from "next/cache";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveMapLocation, type MapLocation } from "@/lib/admin/maps";
import { formatClockTime } from "@/lib/temple-timings";

const templeInfoSchema = z.object({
  addressLine1: z.string().trim().max(200),
  addressLine2: z.string().trim().max(200),
  phone: z.string().trim().max(50),
  email: z.union([z.literal(""), z.email()]),
  mapsInput: z.string().trim().max(2000),
  mapsPlace: z.string().trim().max(300),
  lat: z.string().trim(),
  lon: z.string().trim(),
  aboutEn: z.string().trim().max(5000),
  aboutKn: z.string().trim().max(5000),
  timings: z.string().max(20_000),
});

const timingsSchema = z
  .array(
    z.object({
      day: z.string().trim().min(1).max(80),
      dayKn: z.string().trim().max(80).optional(),
      sessions: z
        .array(z.object({ open: z.string().regex(/^\d{2}:\d{2}$/), close: z.string().regex(/^\d{2}:\d{2}$/) }))
        .min(1)
        .max(4),
    }),
  )
  .max(20);

// Preview for the admin form: where would this link/address put the pin?
export async function locateTemple(input: string): Promise<MapLocation | null> {
  await verifyAdminSession();
  return resolveMapLocation(input.slice(0, 2000));
}

export type TempleInfoFormState = { error?: string; success?: boolean } | undefined;

export async function updateTempleInfo(
  _prevState: TempleInfoFormState,
  formData: FormData,
): Promise<TempleInfoFormState> {
  await verifyAdminSession();
  const parsed = templeInfoSchema.safeParse({
    addressLine1: formData.get("addressLine1") ?? "",
    addressLine2: formData.get("addressLine2") ?? "",
    phone: formData.get("phone") ?? "",
    email: String(formData.get("email") ?? "").trim(),
    mapsInput: formData.get("mapsInput") ?? "",
    mapsPlace: formData.get("mapsPlace") ?? "",
    lat: formData.get("lat") ?? "",
    lon: formData.get("lon") ?? "",
    aboutEn: formData.get("aboutEn") ?? "",
    aboutKn: formData.get("aboutKn") ?? "",
    timings: formData.get("timings") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "invalid" };

  let rows: z.infer<typeof timingsSchema>;
  try {
    const result = timingsSchema.safeParse(JSON.parse(parsed.data.timings || "[]"));
    if (!result.success) return { error: "Each timing needs a day and open/close times." };
    rows = result.data;
  } catch {
    return { error: "Couldn't read the timings — try again." };
  }
  const timings = rows.map((r) => ({
    ...r,
    hours: r.sessions.map((x) => `${formatClockTime(x.open, "en")} – ${formatClockTime(x.close, "en")}`).join(", "),
  }));

  // The pin: fine-tuned coordinates win; otherwise read from the link/address.
  const { mapsInput } = parsed.data;
  let lat = Number(parsed.data.lat);
  let lon = Number(parsed.data.lon);
  let place = parsed.data.mapsPlace;
  let placeId: string | undefined;
  if (!parsed.data.lat || !parsed.data.lon || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    const found = mapsInput ? await resolveMapLocation(mapsInput) : null;
    if (mapsInput && !found) return { error: "Couldn't find that place — paste the Google Maps share link, or enter the latitude and longitude." };
    lat = found?.lat ?? NaN;
    lon = found?.lon ?? NaN;
    place = place || found?.label || "";
    // A bare name would match every temple of that name: add the town.
    if (place && !place.includes(",") && parsed.data.addressLine2) {
      place = `${place}, ${parsed.data.addressLine2.split(",").map((p) => p.trim()).filter(Boolean).join(", ")}`;
    }
    placeId = found?.placeId;
  } else if (/^https?:\/\//i.test(mapsInput)) {
    // Pin typed or kept as-is: still read the place ID from the link.
    placeId = (await resolveMapLocation(mapsInput))?.placeId;
  }
  const hasPin = Number.isFinite(lat) && Number.isFinite(lon);

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("temple_info")
    .update({
      address_line1: parsed.data.addressLine1,
      address_line2: parsed.data.addressLine2,
      phone: parsed.data.phone,
      email: parsed.data.email,
      // Embeds and directions use the pin; the pasted text is kept as-is.
      maps_query: hasPin ? `${lat},${lon}` : mapsInput,
      maps_url: /^https?:\/\//i.test(mapsInput) ? mapsInput : "",
      maps_place: place,
      ...(placeId !== undefined || !mapsInput ? { maps_place_id: placeId ?? "" } : {}),
      lat: hasPin ? lat : null,
      lon: hasPin ? lon : null,
      about: { en: parsed.data.aboutEn, kn: parsed.data.aboutKn },
      timings,
    })
    .eq("id", true);
  if (error) return { error: error.message };

  updateTag("temple-info");
  return { success: true };
}
