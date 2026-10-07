"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";

const verseSchema = z.object({
  id: z.string().min(1).max(80),
  textKn: z.string().trim().min(1).max(2000),
  roman: z.string().trim().min(1).max(2000),
  meaningEn: z.string().trim().min(1).max(3000),
  meaningKn: z.string().trim().min(1).max(3000),
  reviewed: z.boolean(),
});

// Saves an admin's corrections to a verse; "Approve" also marks it reviewed.
export async function saveVerse(formData: FormData): Promise<void> {
  await verifyAdminSession();
  const parsed = verseSchema.safeParse({
    id: formData.get("id"),
    textKn: formData.get("textKn"),
    roman: formData.get("roman"),
    meaningEn: formData.get("meaningEn"),
    meaningKn: formData.get("meaningKn"),
    reviewed: formData.get("intent") === "approve" || formData.get("wasReviewed") === "true",
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "invalid");
  const v = parsed.data;
  const { error } = await createAdminClient()
    .from("verses")
    .update({
      text_kn: v.textKn,
      roman: v.roman,
      meaning: { en: v.meaningEn, kn: v.meaningKn },
      reviewed: v.reviewed,
      // An edit not yet approved is checked again on the next `npm run verses:check`.
      ...(v.reviewed ? {} : { check_status: "unchecked" }),
    })
    .eq("id", v.id);
  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/admin/verses", "page");
}

export async function setVerseReviewed(id: string, reviewed: boolean): Promise<void> {
  await verifyAdminSession();
  const { error } = await createAdminClient().from("verses").update({ reviewed }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/admin/verses", "page");
}
