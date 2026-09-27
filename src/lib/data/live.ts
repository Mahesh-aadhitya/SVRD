import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

export type LiveConfig = {
  platform: "youtube" | "instagram";
  youtubeVideoId: string | null;
  instagramUrl: string | null;
  isLive: boolean;
  scheduledAt: string | null;
};

export type LiveArchiveItem = {
  id: string;
  title: { en: string; kn: string };
  youtubeId: string;
};

export const getLiveConfig = unstable_cache(
  async (): Promise<LiveConfig> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("live_config")
      .select("platform, youtube_video_id, instagram_url, is_live, scheduled_at")
      .eq("id", true)
      .single();
    if (error) throw new Error(`getLiveConfig: ${error.message}`);
    return {
      platform: data.platform,
      youtubeVideoId: data.youtube_video_id,
      instagramUrl: data.instagram_url,
      isLive: data.is_live,
      scheduledAt: data.scheduled_at,
    };
  },
  ["live-config"],
  { tags: ["live-config"] },
);

export const getLiveArchive = unstable_cache(
  async (): Promise<LiveArchiveItem[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("live_archive")
      .select("id, title, youtube_id")
      .order("created_at", { ascending: false });
    if (error) throw new Error(`getLiveArchive: ${error.message}`);
    return (data ?? []).map((row) => ({ id: row.id, title: row.title, youtubeId: row.youtube_id }));
  },
  ["live-archive"],
  { tags: ["live-archive"] },
);
