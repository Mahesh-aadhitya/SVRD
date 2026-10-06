import "server-only";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayInIndia } from "@/lib/dates";
import type { BookedCounts, Booking, BookingStatus } from "@/lib/content-types";

type SlotEmbed = { start_time: string; end_time: string | null };

type BookingRow = {
  id: string;
  reference: string | null;
  seva_id: string;
  booking_date: string;
  // Many-to-one embed: an object at runtime, typed as an array by the
  // untyped client — accept both.
  seva_slots: SlotEmbed | SlotEmbed[] | null;
  devotee_name: string;
  phone: string;
  quantity: number;
  devotees: Booking["devotees"] | null;
  amount: number;
  status: Booking["status"];
  payment_status: Booking["paymentStatus"];
  created_at: string;
  checked_in_at: string | null;
  prasadam_claimed_at: string | null;
};

const BOOKING_COLUMNS =
  "id, reference, seva_id, booking_date, seva_slots(start_time, end_time), devotee_name, phone, quantity, devotees, amount, status, payment_status, created_at, checked_in_at, prasadam_claimed_at";

function mapRow(row: BookingRow): Booking {
  const slot = Array.isArray(row.seva_slots) ? (row.seva_slots[0] ?? null) : row.seva_slots;
  return {
    id: row.id,
    reference: row.reference,
    sevaId: row.seva_id,
    date: row.booking_date,
    slot: slot ? { startTime: slot.start_time.slice(0, 5), endTime: slot.end_time?.slice(0, 5) ?? null } : null,
    devoteeName: row.devotee_name,
    phone: row.phone,
    quantity: row.quantity ?? 1,
    // Bookings made before per-devotee details only have the contact name.
    devotees: row.devotees?.length ? row.devotees : [{ name: row.devotee_name, gotram: null, nakshatram: null }],
    amount: row.amount,
    status: row.status,
    paymentStatus: row.payment_status,
    createdAt: row.created_at,
    checkedInAt: row.checked_in_at,
    prasadamClaimedAt: row.prasadam_claimed_at,
  };
}

export type BookingFilters = {
  status?: BookingStatus;
  sevaId?: string;
  date?: string;
  q?: string;
};

// Bookings hold devotee names/phones, so they're never cached or publicly
// readable — always read fresh through the service-role client after
// verifyAdminSession().
export async function getBookingsForAdmin(filters: BookingFilters = {}): Promise<Booking[]> {
  await verifyAdminSession();
  const supabase = createAdminClient();
  let query = supabase
    .from("bookings")
    .select(BOOKING_COLUMNS)
    .order("booking_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.sevaId) query = query.eq("seva_id", filters.sevaId);
  if (filters.date) query = query.eq("booking_date", filters.date);
  if (filters.q) {
    const q = filters.q.replace(/[%,()]/g, "");
    query = query.or(`devotee_name.ilike.%${q}%,phone.ilike.%${q}%,reference.ilike.%${q}%`);
  }
  const { data, error } = await query;
  if (error) throw new Error(`getBookingsForAdmin: ${error.message}`);
  return (data ?? []).map(mapRow);
}

// The day's darshan list: bookings checked in on `date` (IST), in scan
// order, plus how many prasadam handovers happened that day (which can be
// for darshans on earlier days).
export async function getDarshanLogForAdmin(date: string): Promise<{ bookings: Booking[]; prasadamGiven: number }> {
  await verifyAdminSession();
  const supabase = createAdminClient();
  const start = `${date}T00:00:00+05:30`;
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const end = `${next.toISOString().slice(0, 10)}T00:00:00+05:30`;
  const [darshan, prasadam] = await Promise.all([
    supabase
      .from("bookings")
      .select(BOOKING_COLUMNS)
      .gte("checked_in_at", start)
      .lt("checked_in_at", end)
      .order("checked_in_at", { ascending: true }),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .gte("prasadam_claimed_at", start)
      .lt("prasadam_claimed_at", end),
  ]);
  if (darshan.error) throw new Error(`getDarshanLogForAdmin: ${darshan.error.message}`);
  if (prasadam.error) throw new Error(`getDarshanLogForAdmin: ${prasadam.error.message}`);
  return { bookings: (darshan.data ?? []).map(mapRow), prasadamGiven: prasadam.count ?? 0 };
}

export type BookingStats = { total: number; today: number; pending: number; upcoming: number };

export async function getBookingStatsForAdmin(): Promise<BookingStats> {
  await verifyAdminSession();
  const supabase = createAdminClient();
  const today = todayInIndia();
  const count = async (build: (q: ReturnType<typeof base>) => ReturnType<typeof base>) => {
    const { count, error } = await build(base());
    if (error) throw new Error(`getBookingStatsForAdmin: ${error.message}`);
    return count ?? 0;
  };
  function base() {
    return supabase.from("bookings").select("id", { count: "exact", head: true });
  }
  const [total, todayCount, pending, upcoming] = await Promise.all([
    count((q) => q),
    count((q) => q.eq("booking_date", today).neq("status", "cancelled")),
    count((q) => q.eq("status", "pending")),
    count((q) => q.gte("booking_date", today).neq("status", "cancelled")),
  ]);
  return { total, today: todayCount, pending, upcoming };
}

// Public: non-cancelled booking counts for each upcoming date of a seva,
// split by time slot ("_" = whole-day booking). Counts only — never names
// or phones.
export async function getBookedCounts(sevaId: string): Promise<BookedCounts> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("booking_date, slot_id, quantity")
    .eq("seva_id", sevaId)
    .neq("status", "cancelled")
    .gte("booking_date", todayInIndia());
  if (error) throw new Error(`getBookedCounts: ${error.message}`);
  const counts: BookedCounts = {};
  for (const row of data ?? []) {
    const day = (counts[row.booking_date] ??= {});
    const key = row.slot_id ?? "_";
    day[key] = (day[key] ?? 0) + (row.quantity ?? 1);
  }
  return counts;
}

// Upcoming (today onwards), non-cancelled tickets per seva.
export async function getUpcomingBookingCountsForAdmin(): Promise<Record<string, number>> {
  await verifyAdminSession();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("seva_id, quantity")
    .neq("status", "cancelled")
    .gte("booking_date", todayInIndia());
  if (error) throw new Error(`getUpcomingBookingCountsForAdmin: ${error.message}`);
  const counts: Record<string, number> = {};
  for (const row of data ?? []) counts[row.seva_id] = (counts[row.seva_id] ?? 0) + (row.quantity ?? 1);
  return counts;
}

export type Ticket = Booking & { sevaName: { en: string; kn: string } };

// For the devotee's own ticket page. Not admin-gated: callers must first
// check the signed ticket token (see lib/ticket-token.ts).
export async function getBookingForTicket(reference: string): Promise<Ticket | null> {
  if (!/^[A-F0-9]{8}$/.test(reference)) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(`${BOOKING_COLUMNS}, sevas(name)`)
    .eq("reference", reference)
    .maybeSingle();
  if (error) throw new Error(`getBookingForTicket: ${error.message}`);
  if (!data) return null;
  const row = data as unknown as BookingRow & { sevas: { name: Ticket["sevaName"] } | { name: Ticket["sevaName"] }[] | null };
  const seva = Array.isArray(row.sevas) ? row.sevas[0] : row.sevas;
  return { ...mapRow(row), sevaName: seva?.name ?? { en: row.seva_id, kn: row.seva_id } };
}

// A devotee's own bookings, newest seva date first. Callers pass the id
// of the signed-in user from getDevotee() — never one from the client.
export async function getBookingsForUser(userId: string): Promise<Ticket[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(`${BOOKING_COLUMNS}, sevas(name)`)
    .eq("user_id", userId)
    .order("booking_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(`getBookingsForUser: ${error.message}`);
  return (data ?? []).map((raw) => {
    const row = raw as unknown as BookingRow & { sevas: { name: Ticket["sevaName"] } | { name: Ticket["sevaName"] }[] | null };
    const seva = Array.isArray(row.sevas) ? row.sevas[0] : row.sevas;
    return { ...mapRow(row), sevaName: seva?.name ?? { en: row.seva_id, kn: row.seva_id } };
  });
}

// Phone check for "find my ticket": the reference plus the phone used to book.
export async function findBookingReference(reference: string, phone: string): Promise<string | null> {
  if (!/^[A-F0-9]{8}$/.test(reference)) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("bookings").select("reference, phone").eq("reference", reference).maybeSingle();
  if (error) throw new Error(`findBookingReference: ${error.message}`);
  const digits = (v: string) => v.replace(/\D/g, "").slice(-10);
  return data && digits(data.phone) === digits(phone) ? data.reference : null;
}
