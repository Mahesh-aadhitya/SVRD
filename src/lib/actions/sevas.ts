"use server";

import { z } from "zod";
import { updateTag } from "next/cache";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";

const sevaSchema = z.object({
  nameEn: z.string().trim().min(1),
  nameKn: z.string().trim().min(1),
  descriptionEn: z.string().trim().min(1),
  descriptionKn: z.string().trim().min(1),
  price: z.coerce.number().int().min(0),
  capacityPerSlot: z.coerce.number().int().min(1),
});

export type SevaFormState = { error?: string } | undefined;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseForm(formData: FormData) {
  return sevaSchema.safeParse({
    nameEn: formData.get("nameEn"),
    nameKn: formData.get("nameKn"),
    descriptionEn: formData.get("descriptionEn"),
    descriptionKn: formData.get("descriptionKn"),
    price: formData.get("price"),
    capacityPerSlot: formData.get("capacityPerSlot"),
  });
}

export async function createSeva(
  locale: Locale,
  _prevState: SevaFormState,
  formData: FormData,
): Promise<SevaFormState> {
  await verifyAdminSession();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: "invalid" };
  const { nameEn, nameKn, descriptionEn, descriptionKn, price, capacityPerSlot } = parsed.data;

  const supabase = createAdminClient();
  const { error } = await supabase.from("sevas").insert({
    id: slugify(nameEn),
    name: { en: nameEn, kn: nameKn },
    description: { en: descriptionEn, kn: descriptionKn },
    price,
    capacity_per_slot: capacityPerSlot,
  });
  if (error) return { error: error.message };

  updateTag("sevas");
  redirect({ href: "/admin/sevas", locale });
}

export async function updateSeva(
  id: string,
  locale: Locale,
  _prevState: SevaFormState,
  formData: FormData,
): Promise<SevaFormState> {
  await verifyAdminSession();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: "invalid" };
  const { nameEn, nameKn, descriptionEn, descriptionKn, price, capacityPerSlot } = parsed.data;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("sevas")
    .update({
      name: { en: nameEn, kn: nameKn },
      description: { en: descriptionEn, kn: descriptionKn },
      price,
      capacity_per_slot: capacityPerSlot,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  updateTag("sevas");
  redirect({ href: "/admin/sevas", locale });
}

const releaseWindowSchema = z
  .object({
    startDate: z.string().trim().min(1),
    endDate: z.string().trim().min(1),
  })
  .refine((v) => v.endDate >= v.startDate, { message: "End date must be on or after the start date" });

export type ReleaseSevaState = { error?: string } | undefined;

export async function releaseSeva(
  id: string,
  _prevState: ReleaseSevaState,
  formData: FormData,
): Promise<ReleaseSevaState> {
  await verifyAdminSession();
  const parsed = releaseWindowSchema.safeParse({
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "invalid" };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("sevas")
    .update({
      is_active: true,
      release_start_date: parsed.data.startDate,
      release_end_date: parsed.data.endDate,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  updateTag("sevas");
  return undefined;
}

export async function closeSeva(id: string): Promise<void> {
  await verifyAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("sevas").update({ is_active: false }).eq("id", id);
  if (error) throw new Error(error.message);

  updateTag("sevas");
}
