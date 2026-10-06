"use server";

import { z } from "zod";
import { updateTag } from "next/cache";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";

const templeInfoSchema = z.object({
  addressLine1: z.string().trim().max(200),
  addressLine2: z.string().trim().max(200),
  phone: z.string().trim().max(50),
  email: z.union([z.literal(""), z.email()]),
  mapsQuery: z.string().trim().max(300),
  aboutEn: z.string().trim().max(5000),
  aboutKn: z.string().trim().max(5000),
  timings: z.string().max(2000),
});

export type TempleInfoFormState = { error?: string; success?: boolean } | undefined;

// Timings are edited as one "Day | Hours" pair per line — simpler for the
// temple office than a dynamic repeater, and trivially reorderable.
function parseTimings(raw: string) {
  const rows = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [day, ...rest] = line.split("|");
      return { day: day.trim(), hours: rest.join("|").trim() };
    });
  const bad = rows.find((row) => !row.day || !row.hours);
  return bad ? null : rows;
}

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
    mapsQuery: formData.get("mapsQuery") ?? "",
    aboutEn: formData.get("aboutEn") ?? "",
    aboutKn: formData.get("aboutKn") ?? "",
    timings: formData.get("timings") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "invalid" };

  const timings = parseTimings(parsed.data.timings);
  if (!timings) return { error: 'Each timing line must look like "Mon – Fri | 5:30 AM – 9:00 PM".' };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("temple_info")
    .update({
      address_line1: parsed.data.addressLine1,
      address_line2: parsed.data.addressLine2,
      phone: parsed.data.phone,
      email: parsed.data.email,
      maps_query: parsed.data.mapsQuery,
      about: { en: parsed.data.aboutEn, kn: parsed.data.aboutKn },
      timings,
    })
    .eq("id", true);
  if (error) return { error: error.message };

  updateTag("temple-info");
  return { success: true };
}
