"use server";

import { z } from "zod";
import { updateTag } from "next/cache";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";

const poojaSchema = z.object({
  nameEn: z.string().trim().min(1),
  nameKn: z.string().trim().min(1),
  descriptionEn: z.string().trim().min(1),
  descriptionKn: z.string().trim().min(1),
  timing: z.string().trim().min(1),
  isBookable: z.boolean(),
  image: z.string().trim().optional(),
});

export type PoojaFormState = { error?: string } | undefined;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseForm(formData: FormData) {
  return poojaSchema.safeParse({
    nameEn: formData.get("nameEn"),
    nameKn: formData.get("nameKn"),
    descriptionEn: formData.get("descriptionEn"),
    descriptionKn: formData.get("descriptionKn"),
    timing: formData.get("timing"),
    isBookable: formData.get("isBookable") === "on",
    image: formData.get("image") ?? undefined,
  });
}

export async function createPooja(
  locale: Locale,
  _prevState: PoojaFormState,
  formData: FormData,
): Promise<PoojaFormState> {
  await verifyAdminSession();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: "invalid" };
  const { nameEn, nameKn, descriptionEn, descriptionKn, timing, isBookable, image } = parsed.data;

  const supabase = createAdminClient();
  const { error } = await supabase.from("poojas").insert({
    id: slugify(nameEn),
    name: { en: nameEn, kn: nameKn },
    description: { en: descriptionEn, kn: descriptionKn },
    timing,
    is_bookable: isBookable,
    image_url: image || null,
  });
  if (error) return { error: error.message };

  updateTag("poojas");
  redirect({ href: "/admin/poojas", locale });
}

export async function updatePooja(
  id: string,
  locale: Locale,
  _prevState: PoojaFormState,
  formData: FormData,
): Promise<PoojaFormState> {
  await verifyAdminSession();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: "invalid" };
  const { nameEn, nameKn, descriptionEn, descriptionKn, timing, isBookable, image } = parsed.data;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("poojas")
    .update({
      name: { en: nameEn, kn: nameKn },
      description: { en: descriptionEn, kn: descriptionKn },
      timing,
      is_bookable: isBookable,
      image_url: image || null,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  updateTag("poojas");
  redirect({ href: "/admin/poojas", locale });
}
