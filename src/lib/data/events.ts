import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { TempleEvent } from "@/lib/content-types";

type EventRow = {
  id: string;
  title: { en: string; kn: string };
  event_date: string;
  description: { en: string; kn: string };
  image_url: string | null;
  folder_id: string | null;
  sort_order: number;
};

function mapRow(row: EventRow): TempleEvent {
  return {
    id: row.id,
    title: row.title,
    date: row.event_date,
    description: row.description,
    image: row.image_url,
    folderId: row.folder_id,
  };
}

export const getEvents = unstable_cache(
  async (): Promise<TempleEvent[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("events")
      .select("id, title, event_date, description, image_url, folder_id, sort_order")
      .order("event_date");
    if (error) throw new Error(`getEvents: ${error.message}`);
    return (data ?? []).map(mapRow);
  },
  ["events"],
  { tags: ["events"] },
);

export async function getEventById(id: string): Promise<TempleEvent | null> {
  const events = await getEvents();
  return events.find((e) => e.id === id) ?? null;
}
