"use server";

import { z } from "zod";
import { updateTag } from "next/cache";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveFolderId } from "@/lib/admin/folder-field";
import { extractYoutubeId } from "@/lib/youtube";

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

const archiveSchema = z.object({
  titleEn: z.string().trim().min(1).max(200),
  titleKn: z.string().trim().min(1).max(200),
  youtube: z.string().trim().min(1),
});

export type ArchiveFormState = { error?: string; success?: boolean } | undefined;

export async function addLiveArchiveItem(
  _prevState: ArchiveFormState,
  formData: FormData,
): Promise<ArchiveFormState> {
  await verifyAdminSession();
  const parsed = archiveSchema.safeParse({
    titleEn: formData.get("titleEn"),
    titleKn: formData.get("titleKn"),
    youtube: formData.get("youtube"),
  });
  if (!parsed.success) return { error: "Fill in both titles and the YouTube link." };
  const youtubeId = extractYoutubeId(parsed.data.youtube);
  if (!youtubeId) return { error: "Couldn't read a video ID from that YouTube link." };

  const supabase = createAdminClient();
  const folder = await resolveFolderId(supabase, "live", formData);
  if ("error" in folder) return folder;
  const { error } = await supabase.from("live_archive").insert({
    folder_id: folder.folderId,
    title: { en: parsed.data.titleEn, kn: parsed.data.titleKn },
    youtube_id: youtubeId,
  });
  if (error) return { error: error.message };

  updateTag("live-archive");
  return { success: true };
}

export async function deleteLiveArchiveItem(id: string): Promise<void> {
  await verifyAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("live_archive").delete().eq("id", id);
  if (error) throw new Error(error.message);
  updateTag("live-archive");
}
