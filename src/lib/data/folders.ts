import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Folder, FolderSection } from "@/lib/folders";

// Not cached itself — src/lib/data/gallery.ts and src/lib/data/songs.ts each
// wrap this in their own unstable_cache with a section-scoped tag, so
// editing one section's folders never invalidates the other's.
export async function fetchFolders(section: FolderSection): Promise<Folder[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("content_folders")
    .select("id, name, parent_id, sort_order")
    .eq("section", section)
    .order("sort_order")
    .order("name");
  if (error) throw new Error(`fetchFolders(${section}): ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    sortOrder: row.sort_order,
  }));
}

// Cached per section, tagged so createFolder/deleteFolder's
// updateTag(`content-folders-${section}`) refreshes exactly that section.
export function getFolders(section: FolderSection): Promise<Folder[]> {
  return unstable_cache(() => fetchFolders(section), ["content_folders", section], {
    tags: [`content-folders-${section}`],
  })();
}
