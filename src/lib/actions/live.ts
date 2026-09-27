"use server";

import { z } from "zod";
import { updateTag } from "next/cache";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";

const liveConfigSchema = z
  .object({
    platform: z.enum(["youtube", "instagram"]),
    youtubeVideoId: z.string().trim().optional(),
    instagramUrl: z.string().trim().optional(),
    isLive: z.boolean(),
    scheduledAt: z.string().trim().optional(),
  })
  .refine((v) => v.platform !== "youtube" || !!v.youtubeVideoId, {
    message: "YouTube video ID is required for the YouTube platform",
  })
  .refine((v) => v.platform !== "instagram" || !!v.instagramUrl, {
    message: "Instagram URL is required for the Instagram platform",
  });

export type LiveConfigFormState = { error?: string; success?: boolean } | undefined;

// Admins may paste a bare video ID or any full YouTube link (watch, youtu.be, /live, /embed, /shorts).
function extractYoutubeId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const v = url.searchParams.get("v");
      if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;
      const match = url.pathname.match(/\/(live|embed|shorts)\/([A-Za-z0-9_-]{11})/);
      if (match) return match[2];
    }
  } catch {
    // not a URL - fall through
  }
  return null;
}

export async function updateLiveConfig(
  _prevState: LiveConfigFormState,
  formData: FormData,
): Promise<LiveConfigFormState> {
  const admin = await verifyAdminSession();
  const parsed = liveConfigSchema.safeParse({
    platform: formData.get("platform"),
    youtubeVideoId: formData.get("youtubeVideoId") ?? undefined,
    instagramUrl: formData.get("instagramUrl") ?? undefined,
    isLive: formData.get("isLive") === "on",
    scheduledAt: formData.get("scheduledAt") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "invalid" };
  const { platform, youtubeVideoId, instagramUrl, isLive, scheduledAt } = parsed.data;

  let resolvedYoutubeId: string | null = null;
  if (platform === "youtube") {
    resolvedYoutubeId = extractYoutubeId(youtubeVideoId!);
    if (!resolvedYoutubeId) {
      return {
        error:
          "Couldn't read a video ID from that. Paste just the video ID, or a full YouTube link (watch/live/youtu.be).",
      };
    }
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("live_config")
    .update({
      platform,
      youtube_video_id: platform === "youtube" ? resolvedYoutubeId : null,
      instagram_url: platform === "instagram" ? instagramUrl : null,
      is_live: isLive,
      scheduled_at: scheduledAt || null,
      updated_by: admin.id,
    })
    .eq("id", true);
  if (error) return { error: error.message };

  updateTag("live-config");
  return { success: true };
}
