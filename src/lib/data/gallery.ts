import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { fetchFolders } from "@/lib/data/folders";
import type { Folder } from "@/lib/folders";
import type { GalleryItem } from "@/lib/gallery-types";

export const getGalleryFolders = unstable_cache(
  (): Promise<Folder[]> => fetchFolders("gallery"),
  ["content_folders", "gallery"],
  { tags: ["content-folders-gallery"] },
);

export const getGalleryItems = unstable_cache(
  async (): Promise<GalleryItem[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("gallery_items")
      .select("id, type, folder_id, image_url, youtube_id, sort_order")
      .order("sort_order")
      .order("created_at", { ascending: false });
    if (error) throw new Error(`getGalleryItems: ${error.message}`);
    return (data ?? []).map((row) => ({
      id: row.id,
      type: row.type,
      folderId: row.folder_id,
      image: row.image_url,
      youtubeId: row.youtube_id ?? undefined,
    }));
  },
  ["gallery_items"],
  { tags: ["gallery"] },
);
