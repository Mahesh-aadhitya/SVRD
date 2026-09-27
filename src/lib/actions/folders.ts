"use server";

import { z } from "zod";
import { updateTag } from "next/cache";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { FolderSection } from "@/lib/folders";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";

const folderSchema = z.object({
  name: z.string().trim().min(1),
  parentId: z.string().uuid().optional(),
});

export type FolderFormState = { error?: string } | undefined;

export async function createFolder(
  section: FolderSection,
  redirectPath: string,
  locale: Locale,
  _prevState: FolderFormState,
  formData: FormData,
): Promise<FolderFormState> {
  await verifyAdminSession();
  const parsed = folderSchema.safeParse({
    name: formData.get("name"),
    parentId: formData.get("parentId") || undefined,
  });
  if (!parsed.success) return { error: "invalid" };

  const supabase = createAdminClient();
  const { error } = await supabase.from("content_folders").insert({
    section,
    name: parsed.data.name,
    parent_id: parsed.data.parentId ?? null,
  });
  if (error) return { error: error.message };

  updateTag(`content-folders-${section}`);
  redirect({ href: redirectPath, locale });
}

export async function deleteFolder(
  section: FolderSection,
  redirectPath: string,
  id: string,
  locale: Locale,
): Promise<void> {
  await verifyAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("content_folders").delete().eq("id", id);
  if (error) {
    throw new Error(
      error.code === "23503" ? "Folder is not empty — remove its contents first." : error.message,
    );
  }

  updateTag(`content-folders-${section}`);
  redirect({ href: redirectPath, locale });
}
