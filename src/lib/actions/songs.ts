"use server";

import { z } from "zod";
import { randomUUID } from "crypto";
import { updateTag } from "next/cache";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { findDuplicateSongs, isHex } from "@/lib/admin/duplicates";

const EXT_BY_MIME: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
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

// Checked before any bytes are uploaded, so a duplicate costs nothing.
// Returns, per song, why it's a duplicate (or null).
export async function checkSongDuplicates(
  songs: { contentHash?: string; titleEn?: string; titleKn?: string }[],
): Promise<(string | null)[]> {
  await verifyAdminSession();
  return findDuplicateSongs(
    createAdminClient(),
    songs.slice(0, 500).map((s) => ({ ...s, contentHash: isHex(s.contentHash, 64) ? s.contentHash : undefined })),
  );
}

const DUPLICATE_FILE = "This audio file is already uploaded";

const songSchema = z.object({
  titleEn: z.string().trim().min(1),
  titleKn: z.string().trim().min(1),
  folderId: z.string().uuid(),
  duration: z.string().trim().min(1),
  audioPath: z.string().trim().min(1),
  contentHash: z.string().regex(/^[0-9a-f]{64}$/),
});

// Called directly (await'd) from SongUploadForm's own try/catch, as the
// last step of a manual upload flow — see the matching note in
// src/lib/actions/gallery.ts for why this can't call redirect().
export async function createSong(
  input: { titleEn: string; titleKn: string; folderId: string; duration: string; audioPath: string; contentHash: string },
): Promise<{ error?: string } | undefined> {
  await verifyAdminSession();
  const parsed = songSchema.safeParse(input);
  if (!parsed.success) return { error: "invalid" };
  const { titleEn, titleKn, folderId, duration, audioPath, contentHash } = parsed.data;

  const supabase = createAdminClient();
  const [duplicate] = await findDuplicateSongs(supabase, [{ contentHash, titleEn, titleKn }]);
  if (duplicate) return { error: duplicate };
  const { data: pub } = supabase.storage.from("songs").getPublicUrl(audioPath);

  const { error } = await supabase.from("songs").insert({
    title: { en: titleEn, kn: titleKn },
    folder_id: folderId,
    duration,
    audio_url: pub.publicUrl,
    content_hash: contentHash,
  });
  if (error) return { error: error.code === "23505" ? DUPLICATE_FILE : error.message };

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

const updateSchema = z.object({
  id: z.string().uuid(),
  titleEn: z.string().trim().min(1),
  titleKn: z.string().trim().min(1),
  folderId: z.string().uuid(),
  duration: z.string().trim().min(1),
  audioPath: z.string().trim().optional(),
  contentHash: z.string().regex(/^[0-9a-f]{64}$/).optional(),
});

// Edit a track's titles, folder or duration, or replace its audio file.
export async function updateSong(
  input: { id: string; titleEn: string; titleKn: string; folderId: string; duration: string; audioPath?: string; contentHash?: string },
): Promise<{ error?: string }> {
  await verifyAdminSession();
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { error: "Fill in every field" };
  const { id, titleEn, titleKn, folderId, duration, audioPath, contentHash } = parsed.data;
  if (audioPath && !contentHash) return { error: "Couldn't read the audio file — try again" };

  const supabase = createAdminClient();
  const [duplicate] = await findDuplicateSongs(supabase, [{ contentHash, titleEn, titleKn }], id);
  if (duplicate) return { error: duplicate };
  const patch: Record<string, unknown> = { title: { en: titleEn, kn: titleKn }, folder_id: folderId, duration };
  if (audioPath) {
    patch.audio_url = supabase.storage.from("songs").getPublicUrl(audioPath).data.publicUrl;
    patch.content_hash = contentHash;
  }
  const { error } = await supabase.from("songs").update(patch).eq("id", id);
  if (error) return { error: error.code === "23505" ? DUPLICATE_FILE : error.message };
  updateTag("songs");
  return {};
}

const idsSchema = z.array(z.string().uuid()).min(1).max(500);

export async function moveSongs(ids: string[], folderId: string): Promise<{ error?: string }> {
  await verifyAdminSession();
  if (!idsSchema.safeParse(ids).success || !z.string().uuid().safeParse(folderId).success) return { error: "invalid" };
  const supabase = createAdminClient();
  const { error } = await supabase.from("songs").update({ folder_id: folderId }).in("id", ids);
  if (error) return { error: error.message };
  updateTag("songs");
  return {};
}

export async function deleteSongs(ids: string[]): Promise<{ error?: string }> {
  await verifyAdminSession();
  if (!idsSchema.safeParse(ids).success) return { error: "invalid" };
  const supabase = createAdminClient();
  const { error } = await supabase.from("songs").delete().in("id", ids);
  if (error) return { error: error.message };
  updateTag("songs");
  return {};
}
