import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { NO_UPLOADS, type AcharyaUploads } from "@/lib/panchang/acharyas";

// Pictures and recordings of the Alwars and Acharyas the temple has
// uploaded, by slug. Cached; refreshed when the admin saves one.
export const getAcharyaMedia = unstable_cache(
  async (): Promise<AcharyaUploads> => {
    const { data, error } = await createPublicClient().from("acharya_media").select("slug, image_url, audio_url");
    if (error) {
      console.error(`getAcharyaMedia: ${error.message}`);
      return NO_UPLOADS;
    }
    const pick = (key: "image_url" | "audio_url") =>
      Object.fromEntries((data ?? []).filter((row) => row[key]).map((row) => [row.slug, row[key] as string]));
    return { images: pick("image_url"), audio: pick("audio_url") };
  },
  ["acharya-media"],
  { tags: ["acharya-media"] },
);
