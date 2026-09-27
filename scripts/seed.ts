import { createClient } from "@supabase/supabase-js";
import {
  poojas,
  sevas,
  events,
  gallery,
  songs,
  bookings,
  liveConfig,
  adminComments,
} from "../src/lib/placeholder-data";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see .env.local)");
}

const supabase = createClient(url, serviceRoleKey);

async function upsert(table: string, rows: object[]) {
  const { error } = await supabase.from(table).upsert(rows);
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`seeded ${table}: ${rows.length} rows`);
}

async function main() {
  await upsert(
    "poojas",
    poojas.map((p, i) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      timing: p.timing,
      is_bookable: p.isBookable,
      image_url: p.image,
      sort_order: i,
    })),
  );

  await upsert(
    "sevas",
    sevas.map((s, i) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      price: s.price,
      capacity_per_slot: s.capacityPerSlot,
      is_active: true,
      sort_order: i,
    })),
  );

  await upsert(
    "events",
    events.map((e, i) => ({
      id: e.id,
      title: e.title,
      event_date: e.date,
      description: e.description,
      image_url: e.image,
      sort_order: i,
    })),
  );

  const galleryFolderNames = [...new Set(gallery.map((g) => g.album))];
  const { data: existingFolders, error: foldersError } = await supabase
    .from("gallery_folders")
    .select("id, name, parent_id");
  if (foldersError) throw new Error(`gallery_folders: ${foldersError.message}`);
  const folderIdByName = new Map<string, string>();
  for (const f of existingFolders ?? []) {
    if (f.parent_id === null) folderIdByName.set(f.name, f.id);
  }
  for (const name of galleryFolderNames) {
    if (folderIdByName.has(name)) continue;
    const { data, error } = await supabase
      .from("gallery_folders")
      .insert({ name })
      .select("id")
      .single();
    if (error) throw new Error(`gallery_folders: ${error.message}`);
    folderIdByName.set(name, data.id);
  }
  console.log(`ensured gallery folders: ${galleryFolderNames.length}`);

  await upsert(
    "gallery_items",
    gallery.map((g, i) => ({
      type: g.type,
      folder_id: folderIdByName.get(g.album)!,
      image_url: g.image,
      youtube_id: g.youtubeId ?? null,
      sort_order: i,
    })),
  );

  await upsert(
    "songs",
    songs.map((s, i) => ({
      title: s.title,
      category: s.category,
      duration: s.duration,
      audio_url: null,
      sort_order: i,
    })),
  );

  await upsert(
    "bookings",
    bookings.map((b) => ({
      seva_id: b.sevaId,
      booking_date: b.date,
      devotee_name: b.devoteeName,
      phone: b.phone,
      amount: b.amount,
      status: b.status,
      payment_status: b.amount > 0 && b.status === "confirmed" ? "paid" : "unpaid",
    })),
  );

  const { error: liveConfigError } = await supabase
    .from("live_config")
    .update({
      platform: "youtube",
      youtube_video_id: liveConfig.youtubeId || null,
      is_live: liveConfig.isLive,
      scheduled_at: liveConfig.scheduledAt,
    })
    .eq("id", true);
  if (liveConfigError) throw new Error(`live_config: ${liveConfigError.message}`);
  console.log("seeded live_config");

  await upsert(
    "live_archive",
    liveConfig.archive.map((a) => ({
      title: a.title,
      youtube_id: a.youtubeId,
    })),
  );

  await upsert(
    "comments",
    adminComments.map((c) => ({
      author_name: c.author,
      text: c.text,
      context: c.context,
      status: c.status === "hidden" ? "hidden" : "approved",
    })),
  );

  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
