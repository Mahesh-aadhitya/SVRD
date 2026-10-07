"use server";

import { z } from "zod";
import { updateTag } from "next/cache";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { FolderSection } from "@/lib/folders";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { findDuplicateFolder } from "@/lib/admin/duplicates";

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
  if (await findDuplicateFolder(supabase, section, parsed.data.name, parsed.data.parentId ?? null)) {
    return { error: `There's already a folder named "${parsed.data.name}" here.` };
  }
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

const renameSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  parentId: z.string().uuid().nullable(),
});

// Rename a folder, or move a subfolder under another category (or make it
// top-level). A category that still has subfolders stays top-level, since
// the admin UI only nests one level deep.
export async function updateFolder(
  section: FolderSection,
  input: { id: string; name: string; parentId: string | null },
): Promise<{ error?: string }> {
  await verifyAdminSession();
  const parsed = renameSchema.safeParse(input);
  if (!parsed.success) return { error: "Enter a folder name" };
  const { id, name, parentId } = parsed.data;
  if (parentId === id) return { error: "A folder can't sit inside itself" };

  const supabase = createAdminClient();
  if (parentId) {
    const [{ data: parent }, { count }] = await Promise.all([
      supabase.from("content_folders").select("id, parent_id").eq("id", parentId).eq("section", section).maybeSingle(),
      supabase.from("content_folders").select("id", { count: "exact", head: true }).eq("parent_id", id),
    ]);
    if (!parent || parent.parent_id) return { error: "Pick a top-level category" };
    if (count) return { error: "This category has subfolders — it must stay top-level" };
  }
  if (await findDuplicateFolder(supabase, section, name, parentId, id)) {
    return { error: `There's already a folder named "${name}" here.` };
  }
  const { error } = await supabase
    .from("content_folders")
    .update({ name, parent_id: parentId })
    .eq("id", id)
    .eq("section", section);
  if (error) return { error: error.message };

  updateTag(`content-folders-${section}`);
  return {};
}
