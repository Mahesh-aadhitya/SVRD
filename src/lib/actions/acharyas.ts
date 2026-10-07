"use server";

import { randomUUID } from "crypto";
import { updateTag } from "next/cache";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { acharyaBySlug } from "@/lib/panchang/acharyas";

export type AcharyaMediaState = { error?: string; saved?: boolean } | undefined;

const AUDIO_EXT: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
};

const ownStorage = (url: string) => !url || url.startsWith(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`);

// A signed upload for a recording of an Alwar's/Acharya's composition.
export async function requestAcharyaAudioUpload(contentType: string) {
  await verifyAdminSession();
  const ext = AUDIO_EXT[contentType];
  if (!ext) return { error: "Use an MP3, M4A or WAV file" };
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from("songs").createSignedUploadUrl(`acharyas/${randomUUID()}.${ext}`);
  if (error || !data) return { error: error?.message ?? "Could not start upload" };
  const { data: pub } = supabase.storage.from("songs").getPublicUrl(data.path);
  return { path: data.path, token: data.token, publicUrl: pub.publicUrl };
}

// Saves the temple's picture and recording for an Alwar/Acharya. An empty
// field falls back to the picture/recording that ships with the site.
export async function saveAcharyaMedia(slug: string, _prev: AcharyaMediaState, formData: FormData): Promise<AcharyaMediaState> {
  await verifyAdminSession();
  if (!acharyaBySlug(slug)) return { error: "Unknown Alwar / Acharya" };
  const image = String(formData.get("image") ?? "").trim();
  const audio = String(formData.get("audio") ?? "").trim();
  if (!ownStorage(image) || !ownStorage(audio)) return { error: "Upload the files here" };

  const supabase = createAdminClient();
  const { error } =
    image || audio
      ? await supabase.from("acharya_media").upsert({ slug, image_url: image || null, audio_url: audio || null })
      : await supabase.from("acharya_media").delete().eq("slug", slug);
  if (error) return { error: error.message };
  updateTag("acharya-media");
  return { saved: true };
}
