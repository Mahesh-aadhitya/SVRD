"use server";

import { z } from "zod";
import { randomUUID } from "crypto";
import { updateTag } from "next/cache";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";

const EXT_BY_MIME: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/wav": "wav",
  "audio/ogg": "ogg",
};

export async function requestSongUpload(contentType: string) {
  await verifyAdminSession();
  const ext = EXT_BY_MIME[contentType];
  if (!ext) return { error: "Unsupported audio type" };

  const path = `${randomUUID()}.${ext}`;
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from("songs").createSignedUploadUrl(path);
  if (error || !data) return { error: error?.message ?? "Could not start upload" };

  return { path: data.path, token: data.token };
}

const songSchema = z.object({
  titleEn: z.string().trim().min(1),
  titleKn: z.string().trim().min(1),
  folderId: z.string().uuid(),
  duration: z.string().trim().min(1),
  audioPath: z.string().trim().min(1),
});

// Called directly (await'd) from SongUploadForm's own try/catch, as the
// last step of a manual upload flow — see the matching note in
// src/lib/actions/gallery.ts for why this can't call redirect().
export async function createSong(
  input: { titleEn: string; titleKn: string; folderId: string; duration: string; audioPath: string },
): Promise<{ error?: string } | undefined> {
  await verifyAdminSession();
  const parsed = songSchema.safeParse(input);
  if (!parsed.success) return { error: "invalid" };
  const { titleEn, titleKn, folderId, duration, audioPath } = parsed.data;

  const supabase = createAdminClient();
  const { data: pub } = supabase.storage.from("songs").getPublicUrl(audioPath);

  const { error } = await supabase.from("songs").insert({
    title: { en: titleEn, kn: titleKn },
    folder_id: folderId,
    duration,
    audio_url: pub.publicUrl,
  });
  if (error) return { error: error.message };

  updateTag("songs");
  return undefined;
}

export async function deleteSong(id: string, locale: Locale): Promise<void> {
  await verifyAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("songs").delete().eq("id", id);
  if (error) throw new Error(error.message);

  updateTag("songs");
  redirect({ href: "/admin/songs", locale });
}
