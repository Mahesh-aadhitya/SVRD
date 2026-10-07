"use server";

import { z } from "zod";
import { randomUUID } from "crypto";
import { updateTag } from "next/cache";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractYoutubeId, youtubeThumbnail } from "@/lib/youtube";
import { findDuplicatePhotos, findDuplicateVideo, isHex, type PhotoMatch } from "@/lib/admin/duplicates";

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
  contentHash: z.string().optional(),
  imageHash: z.string().optional(),
});

type Fingerprint = { contentHash?: string; imageHash?: string };

const cleanFingerprint = ({ contentHash, imageHash }: Fingerprint) => ({
  contentHash: isHex(contentHash, 64) ? contentHash : undefined,
  imageHash: isHex(imageHash, 16) ? imageHash : undefined,
});

// Checked before any bytes are uploaded, so a duplicate costs nothing.
export async function checkPhotoDuplicates(photos: Fingerprint[]): Promise<(PhotoMatch | null)[]> {
  await verifyAdminSession();
  return findDuplicatePhotos(createAdminClient(), photos.slice(0, 500).map(cleanFingerprint));
}

const DUPLICATE_PHOTO = "This photo is already in the gallery";
const DUPLICATE_VIDEO = "This YouTube video is already in the gallery";

// Videos may skip the thumbnail upload — YouTube's own thumbnail is used.
export async function createGalleryItem(
  input: {
    type: "photo" | "video";
    folderId: string;
    imagePath?: string;
    youtubeId?: string;
    contentHash?: string;
    imageHash?: string;
  },
): Promise<{ error?: string } | undefined> {
  await verifyAdminSession();
  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) return { error: "invalid" };
  const { type, folderId, imagePath } = parsed.data;
  const { contentHash, imageHash } = type === "photo" ? cleanFingerprint(parsed.data) : {};
  const supabase = createAdminClient();

  let youtubeId: string | null = null;
  if (type === "video") {
    youtubeId = extractYoutubeId(parsed.data.youtubeId ?? "");
    if (!youtubeId) return { error: "Paste a YouTube video ID or link" };
    if (await findDuplicateVideo(supabase, youtubeId)) return { error: DUPLICATE_VIDEO };
  } else if (!imagePath) {
    return { error: "Choose an image" };
  } else {
    if (!contentHash) return { error: "Couldn't read the photo — try again" };
    const [match] = await findDuplicatePhotos(supabase, [{ contentHash, imageHash }]);
    if (match) return { error: DUPLICATE_PHOTO };
  }

  const imageUrl = imagePath
    ? supabase.storage.from("gallery").getPublicUrl(imagePath).data.publicUrl
    : youtubeThumbnail(youtubeId!);

  const { error } = await supabase.from("gallery_items").insert({
    type,
    folder_id: folderId,
    image_url: imageUrl,
    youtube_id: youtubeId,
    content_hash: contentHash ?? null,
    image_hash: imageHash ?? null,
  });
  // 23505: the same file raced in from another upload.
  if (error) return { error: error.code === "23505" ? DUPLICATE_PHOTO : error.message };

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

const updateSchema = z.object({
  id: z.string().uuid(),
  folderId: z.string().uuid(),
  imagePath: z.string().trim().optional(),
  youtubeId: z.string().trim().optional(),
  contentHash: z.string().optional(),
  imageHash: z.string().optional(),
});

// Edit one item: move it to another folder, swap its picture, or (for a
// video) point it at a different YouTube video.
export async function updateGalleryItem(
  input: { id: string; folderId: string; imagePath?: string; youtubeId?: string; contentHash?: string; imageHash?: string },
): Promise<{ error?: string }> {
  await verifyAdminSession();
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { error: "Choose a folder" };
  const { id, folderId, imagePath } = parsed.data;

  const supabase = createAdminClient();
  const { data: item } = await supabase.from("gallery_items").select("type, image_url, youtube_id").eq("id", id).maybeSingle();
  if (!item) return { error: "This item no longer exists" };

  const patch: Record<string, unknown> = { folder_id: folderId };
  if (item.type === "video" && parsed.data.youtubeId !== undefined) {
    const youtubeId = extractYoutubeId(parsed.data.youtubeId);
    if (!youtubeId) return { error: "Paste a YouTube video ID or link" };
    if (await findDuplicateVideo(supabase, youtubeId, id)) return { error: DUPLICATE_VIDEO };
    patch.youtube_id = youtubeId;
    // Keep a custom thumbnail; follow YouTube's when it was YouTube's.
    if (!imagePath && item.youtube_id && item.image_url === youtubeThumbnail(item.youtube_id)) {
      patch.image_url = youtubeThumbnail(youtubeId);
    }
  }
  if (imagePath) {
    patch.image_url = supabase.storage.from("gallery").getPublicUrl(imagePath).data.publicUrl;
    // A replaced photo takes on the new file's fingerprint (a video's
    // custom thumbnail isn't fingerprinted — the video id identifies it).
    if (item.type === "photo") {
      const { contentHash, imageHash } = cleanFingerprint(parsed.data);
      if (!contentHash) return { error: "Couldn't read the photo — try again" };
      const [match] = await findDuplicatePhotos(supabase, [{ contentHash, imageHash }], id);
      if (match) return { error: DUPLICATE_PHOTO };
      patch.content_hash = contentHash;
      patch.image_hash = imageHash ?? null;
    }
  }

  const { error } = await supabase.from("gallery_items").update(patch).eq("id", id);
  if (error) return { error: error.code === "23505" ? DUPLICATE_PHOTO : error.message };
  updateTag("gallery");
  return {};
}

const idsSchema = z.array(z.string().uuid()).min(1).max(500);

export async function moveGalleryItems(ids: string[], folderId: string): Promise<{ error?: string }> {
  await verifyAdminSession();
  if (!idsSchema.safeParse(ids).success || !z.string().uuid().safeParse(folderId).success) return { error: "invalid" };
  const supabase = createAdminClient();
  const { error } = await supabase.from("gallery_items").update({ folder_id: folderId }).in("id", ids);
  if (error) return { error: error.message };
  updateTag("gallery");
  return {};
}

export async function deleteGalleryItems(ids: string[]): Promise<{ error?: string }> {
  await verifyAdminSession();
  if (!idsSchema.safeParse(ids).success) return { error: "invalid" };
  const supabase = createAdminClient();
  const { error } = await supabase.from("gallery_items").delete().in("id", ids);
  if (error) return { error: error.message };
  updateTag("gallery");
  return {};
}
