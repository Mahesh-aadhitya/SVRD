import "server-only";
import { tidyTitle } from "@/lib/tidy";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { fetchFolders } from "@/lib/data/folders";
import type { Folder } from "@/lib/folders";
import type { Song } from "@/lib/song-types";

export const getSongFolders = unstable_cache(
  (): Promise<Folder[]> => fetchFolders("songs"),
  ["content_folders", "songs"],
  { tags: ["content-folders-songs"] },
);

export const getSongs = unstable_cache(
  async (): Promise<Song[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("songs")
      .select("id, title, folder_id, duration, audio_url, sort_order")
      .order("sort_order")
      .order("created_at", { ascending: false });
    if (error) throw new Error(`getSongs: ${error.message}`);
    return (data ?? []).map((row) => ({
      id: row.id,
      title: { en: tidyTitle(row.title.en), kn: tidyTitle(row.title.kn) },
      folderId: row.folder_id,
      duration: row.duration,
      audioUrl: row.audio_url,
    }));
  },
  ["songs"],
  { tags: ["songs"] },
);
