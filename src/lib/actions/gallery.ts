"use server";

import { z } from "zod";
import { randomUUID } from "crypto";
import { updateTag } from "next/cache";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractYoutubeId, youtubeThumbnail } from "@/lib/youtube";

// createGalleryItem is called directly (await'd) from GalleryUploadForm's own
// try/catch, as the last step of a manual upload flow — not via a <form
// action>/useActionState. redirect() throws a special signal that a plain
// try/catch would swallow and mis-report as a failure even though the
// upload succeeded, so this action returns a plain result instead and the
// client calls router.refresh() itself.

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function requestGalleryUpload(contentType: string) {
  await verifyAdminSession();
  const ext = EXT_BY_MIME[contentType];
  if (!ext) return { error: "Unsupported image type" };

  const path = `${randomUUID()}.${ext}`;
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from("gallery").createSignedUploadUrl(path);
  if (error || !data) return { error: error?.message ?? "Could not start upload" };

  return { path: data.path, token: data.token };
}

const itemSchema = z.object({
  type: z.enum(["photo", "video"]),
  folderId: z.string().uuid(),
  imagePath: z.string().trim().optional(),
  youtubeId: z.string().trim().optional(),
});

// Videos may skip the thumbnail upload — YouTube's own thumbnail is used.
export async function createGalleryItem(
  input: { type: "photo" | "video"; folderId: string; imagePath?: string; youtubeId?: string },
): Promise<{ error?: string } | undefined> {
  await verifyAdminSession();
  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) return { error: "invalid" };
  const { type, folderId, imagePath } = parsed.data;

  let youtubeId: string | null = null;
  if (type === "video") {
    youtubeId = extractYoutubeId(parsed.data.youtubeId ?? "");
    if (!youtubeId) return { error: "Paste a YouTube video ID or link" };
  } else if (!imagePath) {
    return { error: "Choose an image" };
  }

  const supabase = createAdminClient();
  const imageUrl = imagePath
    ? supabase.storage.from("gallery").getPublicUrl(imagePath).data.publicUrl
    : youtubeThumbnail(youtubeId!);

  const { error } = await supabase.from("gallery_items").insert({
    type,
    folder_id: folderId,
    image_url: imageUrl,
    youtube_id: youtubeId,
  });
  if (error) return { error: error.message };

  updateTag("gallery");
  return undefined;
}

export async function deleteGalleryItem(id: string, locale: Locale): Promise<void> {
  await verifyAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("gallery_items").delete().eq("id", id);
  if (error) throw new Error(error.message);

  updateTag("gallery");
  redirect({ href: "/admin/gallery", locale });
}
