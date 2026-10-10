import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { withRequestWindow, type Seva } from "@/lib/seva-types";
import { todayInIndia } from "@/lib/dates";

type SevaRow = {
  id: string;
  name: { en: string; kn: string };
  description: { en: string; kn: string };
  price: number;
  capacity_per_slot: number;
  is_active: boolean;
  release_start_date: string | null;
  release_end_date: string | null;
  release_mode: Seva["releaseMode"];
  release_weekdays: number[] | null;
  release_dates: string[] | null;
  folder_id: string | null;
  frequency: Seva["frequency"];
  timing: string;
  schedule: { en: string; kn: string } | null;
  image_url: string | null;
  is_listed: boolean;
  image_focus: string | null;
  book_min_days: number | null;
  book_max_days: number | null;
  allow_requests: boolean | null;
  blocked_dates: Record<string, string> | null;
  seva_slots: { id: string; start_time: string; end_time: string | null; capacity: number; is_active: boolean }[] | null;
};

const SEVA_COLUMNS =
  "id, name, description, price, capacity_per_slot, is_active, release_start_date, release_end_date, release_mode, release_weekdays, release_dates, folder_id, frequency, timing, schedule, image_url, image_focus, book_min_days, book_max_days, allow_requests, is_listed, blocked_dates, seva_slots(id, start_time, end_time, capacity, is_active)";

function mapRow(row: SevaRow): Seva {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    capacityPerSlot: row.capacity_per_slot,
    isActive: row.is_active,
    releaseStartDate: row.release_start_date,
    releaseEndDate: row.release_end_date,
    releaseMode: row.release_mode,
    releaseWeekdays: row.release_weekdays,
    releaseDates: row.release_dates,
    folderId: row.folder_id,
    frequency: row.frequency ?? "special",
    timing: row.timing ?? "",
    schedule: row.schedule ?? { en: "", kn: "" },
    imageUrl: row.image_url,
    imageFocus: row.image_focus ?? null,
    bookMinDays: row.book_min_days ?? 7,
    bookMaxDays: row.book_max_days ?? 90,
    allowRequests: row.allow_requests ?? true,
    isListed: row.is_listed ?? true,
    blockedDates: row.blocked_dates ?? {},
    slots: (row.seva_slots ?? [])
      .map((slot) => ({
        id: slot.id,
        startTime: slot.start_time.slice(0, 5),
        endTime: slot.end_time?.slice(0, 5) ?? null,
        capacity: slot.capacity,
        isActive: slot.is_active,
      }))
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  };
}

// Every seva the public may see — listed ones and ones open for booking
// (the sevas_public_read RLS policy). Cached; refreshed when admins save.
const getPublicSevas = unstable_cache(
  async (): Promise<Seva[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase.from("sevas").select(SEVA_COLUMNS).order("sort_order");
    if (error) throw new Error(`getPublicSevas: ${error.message}`);
    // RLS already hides inactive slots from the anon client; filter anyway.
    return (data ?? []).map(mapRow).map((s) => ({ ...s, slots: s.slots.filter((slot) => slot.isActive) }));
  },
  // Bump the key when the row shape changes (v2: image_focus, v3: book
  // window, v4: allow_requests), so copies
  // cached before then aren't served without the new field.
  ["sevas-public-v4"],
  { tags: ["sevas"] },
);

// The cached list, with each seva on request given today's booking window
// (worked out after the cache, so it moves on every day).
async function publicSevasToday() {
  const today = todayInIndia();
  return (await getPublicSevas()).map((s) => withRequestWindow(s, today));
}

// Booking: only sevas open for booking.
export async function getActiveSevas(): Promise<Seva[]> {
  return (await publicSevasToday()).filter((s) => s.isActive);
}

// The public Sevas page: sevas the temple chose to list, open or not.
export async function getListedSevas(): Promise<Seva[]> {
  return (await publicSevasToday()).filter((s) => s.isListed);
}

// Admin-facing: every seva including inactive ones, so the admin can
// reactivate a closed seva. Bypasses RLS via the service-role client, so it
// must never be exposed to a non-admin caller — always call after (or via a
// function that itself calls) verifyAdminSession().
export async function getAllSevasForAdmin(): Promise<Seva[]> {
  await verifyAdminSession();
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("sevas").select(SEVA_COLUMNS).order("sort_order");
  if (error) throw new Error(`getAllSevasForAdmin: ${error.message}`);
  const today = todayInIndia();
  return (data ?? []).map(mapRow).map((s) => withRequestWindow(s, today));
}

export async function getSevaByIdForAdmin(id: string): Promise<Seva | null> {
  const sevas = await getAllSevasForAdmin();
  return sevas.find((s) => s.id === id) ?? null;
}
