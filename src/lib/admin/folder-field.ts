import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FolderSection } from "@/lib/folders";

// Reads the optional "folderId" field submitted by CategorySelect and makes
// sure it's a folder of the same section (so a seva can't be filed under a
// gallery folder). Empty means "uncategorized".
export async function resolveFolderId(
  supabase: SupabaseClient,
  section: FolderSection,
  formData: FormData,
): Promise<{ folderId: string | null } | { error: string }> {
  const raw = String(formData.get("folderId") ?? "").trim();
  if (!raw) return { folderId: null };
  const { data } = await supabase
    .from("content_folders")
    .select("id")
    .eq("id", raw)
    .eq("section", section)
    .maybeSingle();
  return data ? { folderId: raw } : { error: "That category no longer exists — pick another." };
}
