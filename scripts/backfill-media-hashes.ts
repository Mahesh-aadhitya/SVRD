// Fills in content fingerprints (migration 0014) for gallery photos and
// songs uploaded before duplicate detection existed. Safe to re-run: only
// rows without a fingerprint are touched. Rows whose file repeats an
// earlier one are reported and left unfingerprinted for the admin to
// remove.
//
//   npm run media:backfill
//
// Must match src/components/admin/fingerprint.ts.

import { createHash } from "crypto";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

async function download(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} for ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function imageHash(buf: Buffer) {
  const { data } = await sharp(buf).resize(9, 8, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const grey = (x: number, y: number) => {
    const i = (y * 9 + x) * 3;
    return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  };
  let hex = "";
  for (let y = 0; y < 8; y++) {
    let byte = 0;
    for (let x = 0; x < 8; x++) byte = (byte << 1) | (grey(x, y) > grey(x + 1, y) ? 1 : 0);
    hex += byte.toString(16).padStart(2, "0");
  }
  return hex;
}

async function backfill(table: "gallery_items" | "songs") {
  const urlCol = table === "songs" ? "audio_url" : "image_url";
  const { data: known } = await supabase.from(table).select("content_hash").not("content_hash", "is", null);
  const seen = new Set((known ?? []).map((r) => r.content_hash as string));
  let query = supabase.from(table).select(`id, ${urlCol}`).is("content_hash", null).order("created_at");
  if (table === "gallery_items") query = query.eq("type", "photo");
  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as unknown as Record<string, string | null>[];

  let done = 0;
  for (const row of rows) {
    const url = row[urlCol];
    if (!url) continue;
    try {
      const buf = await download(url);
      const contentHash = createHash("sha256").update(buf).digest("hex");
      if (seen.has(contentHash)) {
        console.warn(`  duplicate ${table} row ${row.id} (${url}) — same file as an earlier item; remove it in the admin`);
        continue;
      }
      seen.add(contentHash);
      const patch: Record<string, string> = { content_hash: contentHash };
      if (table === "gallery_items") patch.image_hash = await imageHash(buf);
      const { error: updateError } = await supabase.from(table).update(patch).eq("id", row.id!);
      if (updateError) throw updateError;
      done++;
    } catch (err) {
      console.warn(`  skipped ${table} row ${row.id}: ${err instanceof Error ? err.message : err}`);
    }
  }
  console.log(`${table}: fingerprinted ${done} of ${rows.length}`);
}

async function main() {
  await backfill("gallery_items");
  await backfill("songs");
  const { data } = await supabase.from("gallery_items").select("id, youtube_id").eq("type", "video");
  const counts = new Map<string, number>();
  for (const v of data ?? []) counts.set(v.youtube_id, (counts.get(v.youtube_id) ?? 0) + 1);
  for (const [id, n] of counts) if (n > 1) console.warn(`  YouTube video ${id} is in the gallery ${n} times — remove the extras in the admin`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
