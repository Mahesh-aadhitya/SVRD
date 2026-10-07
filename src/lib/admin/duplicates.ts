import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Duplicate checks for admin uploads: by what an item *is* (its file's
// bytes, a photo's pixels, a YouTube video id), not just what it's called.

// Photos whose difference hashes differ in at most this many of 64 bits
// are the same picture (resized, re-saved or lightly cropped).
const SAME_PICTURE_BITS = 5;

function hammingHex(a: string, b: string) {
  let bits = 0;
  for (let i = 0; i < a.length; i += 2) {
    let x = parseInt(a.slice(i, i + 2), 16) ^ parseInt(b.slice(i, i + 2), 16);
    while (x) {
      bits += x & 1;
      x >>= 1;
    }
  }
  return bits;
}

export const isHex = (s: string | undefined, length: number) => !!s && new RegExp(`^[0-9a-f]{${length}}$`).test(s);

export type PhotoMatch = { id: string; folderId: string; image: string; exact: boolean };

export async function findDuplicatePhotos(
  supabase: SupabaseClient,
  photos: { contentHash?: string; imageHash?: string }[],
  excludeId?: string,
): Promise<(PhotoMatch | null)[]> {
  const { data } = await supabase
    .from("gallery_items")
    .select("id, folder_id, image_url, content_hash, image_hash")
    .eq("type", "photo")
    .or("content_hash.not.is.null,image_hash.not.is.null");
  const rows = (data ?? []).filter((r) => r.id !== excludeId);
  return photos.map(({ contentHash, imageHash }) => {
    const exact = contentHash ? rows.find((r) => r.content_hash === contentHash) : undefined;
    const similar =
      exact ??
      (imageHash ? rows.find((r) => r.image_hash && hammingHex(r.image_hash, imageHash) <= SAME_PICTURE_BITS) : undefined);
    return similar ? { id: similar.id, folderId: similar.folder_id, image: similar.image_url, exact: !!exact } : null;
  });
}

export async function findDuplicateVideo(supabase: SupabaseClient, youtubeId: string, excludeId?: string) {
  let query = supabase.from("gallery_items").select("id").eq("type", "video").eq("youtube_id", youtubeId);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query.limit(1);
  return data?.[0]?.id ?? null;
}

export async function findDuplicateArchive(supabase: SupabaseClient, youtubeId: string, excludeId?: string) {
  let query = supabase.from("live_archive").select("id, title").eq("youtube_id", youtubeId);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query.limit(1);
  return (data?.[0]?.title as { en: string } | undefined)?.en ?? null;
}

const sameTitle = (a: string, b: string) => a.trim().toLowerCase().replace(/\s+/g, " ") === b.trim().toLowerCase().replace(/\s+/g, " ");

// Why a song would be a duplicate, as an admin-facing message, or null.
export async function findDuplicateSongs(
  supabase: SupabaseClient,
  songs: { contentHash?: string; titleEn?: string; titleKn?: string }[],
  excludeId?: string,
): Promise<(string | null)[]> {
  const { data } = await supabase.from("songs").select("id, title, content_hash");
  const rows = (data ?? []).filter((r) => r.id !== excludeId) as { title: { en: string; kn: string }; content_hash: string | null }[];
  return songs.map(({ contentHash, titleEn, titleKn }) => {
    const byFile = contentHash ? rows.find((r) => r.content_hash === contentHash) : undefined;
    if (byFile) return `This audio file is already uploaded as "${byFile.title.en}"`;
    const byTitle = rows.find(
      (r) => (titleEn && sameTitle(r.title.en, titleEn)) || (titleKn && sameTitle(r.title.kn, titleKn)),
    );
    return byTitle ? `A song titled "${byTitle.title.en}" already exists` : null;
  });
}

export async function findDuplicateFolder(
  supabase: SupabaseClient,
  section: string,
  name: string,
  parentId: string | null,
  excludeId?: string,
) {
  let query = supabase.from("content_folders").select("id, name").eq("section", section).ilike("name", name.trim().replace(/[%_\\]/g, "\\$&"));
  query = parentId ? query.eq("parent_id", parentId) : query.is("parent_id", null);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query.limit(1);
  return data?.[0]?.name ?? null;
}

type Bilingual = { en: string; kn: string };

// Letters and digits only, lower-cased — so "Temple closed!" and
// "temple  closed" count as the same words.
const normalize = (s: string | undefined) => (s ?? "").toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, "");

// Text entries (events, notices, sevas) whose title or wording repeats an
// existing one. `sameDate` limits events to the same day; `activeOnly`
// limits notices to those still showing (an expired one may be posted
// again). Returns an admin-facing message, or null.
export async function findDuplicateEntry(
  supabase: SupabaseClient,
  table: "events" | "notices" | "sevas",
  entry: { title: Bilingual; body: Bilingual },
  { excludeId, sameDate, activeOnly }: { excludeId?: string | null; sameDate?: string; activeOnly?: string } = {},
): Promise<string | null> {
  const [titleCol, bodyCol] = table === "sevas" ? ["name", "description"] : table === "events" ? ["title", "description"] : ["title", "body"];
  let query = supabase.from(table as string).select("*");
  if (sameDate) query = query.eq("event_date", sameDate);
  if (activeOnly) query = query.or(`expires_on.is.null,expires_on.gte.${activeOnly}`);
  const { data } = await query;
  const rows = ((data ?? []) as unknown as Record<string, unknown>[]).filter((r) => r.id !== excludeId);
  const noun = table === "sevas" ? "seva" : table === "events" ? "event" : "notice";

  for (const row of rows) {
    const title = row[titleCol] as Bilingual;
    const body = (row[bodyCol] ?? { en: "", kn: "" }) as Bilingual;
    for (const lang of ["en", "kn"] as const) {
      const t = normalize(entry.title[lang]);
      if (t && t === normalize(title?.[lang])) return `A ${noun} with this title already exists: "${title.en}"`;
      // Short bodies ("See you there") may repeat honestly; long ones don't.
      const b = normalize(entry.body[lang]);
      if (b.length >= 20 && b === normalize(body?.[lang])) return `This text is the same as the existing ${noun} "${title.en}"`;
    }
  }
  return null;
}
