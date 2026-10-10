import "server-only";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RequestStatus, SevaRequest } from "@/lib/seva-requests/types";

type Row = {
  id: string;
  reference: string;
  seva_id: string | null;
  seva_name: string;
  requested_date: string;
  occasion: string;
  devotees: SevaRequest["devotees"] | null;
  phone: string;
  email: string;
  note: string;
  locale: string;
  status: RequestStatus;
  office_note: string;
  created_at: string;
  sevas?: { name: { en: string; kn: string } } | { name: { en: string; kn: string } }[] | null;
};

const COLUMNS =
  "id, reference, seva_id, seva_name, requested_date, occasion, devotees, phone, email, note, locale, status, office_note, created_at, sevas(name)";

export const mapRequest = (r: Row): SevaRequest => ({
  id: r.id,
  reference: r.reference,
  sevaId: r.seva_id,
  sevaName: r.seva_name,
  sevaTitle: (Array.isArray(r.sevas) ? r.sevas[0] : r.sevas)?.name ?? null,
  requestedDate: r.requested_date,
  occasion: r.occasion,
  devotees: r.devotees ?? [],
  phone: r.phone,
  email: r.email,
  note: r.note,
  locale: r.locale,
  status: r.status,
  officeNote: r.office_note,
  createdAt: r.created_at,
});

export async function getSevaRequestById(id: string): Promise<SevaRequest | null> {
  const { data, error } = await createAdminClient().from("seva_requests").select(COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`getSevaRequestById: ${error.message}`);
  return data ? mapRequest(data as unknown as Row) : null;
}

// Admin list: "open" = new, contacted or confirmed; soonest requested day first.
export async function getSevaRequestsForAdmin(show: "open" | RequestStatus | "all") {
  await verifyAdminSession();
  const supabase = createAdminClient();
  let query = supabase.from("seva_requests").select(COLUMNS).order("requested_date", { ascending: true }).order("created_at").limit(300);
  if (show === "open") query = query.in("status", ["new", "contacted", "confirmed"]);
  else if (show !== "all") query = query.eq("status", show);
  const [{ data, error }, counts] = await Promise.all([query, supabase.from("seva_requests").select("status")]);
  if (error) throw new Error(`getSevaRequestsForAdmin: ${error.message}`);
  const tally: Record<string, number> = { all: 0, open: 0, new: 0, contacted: 0, confirmed: 0, done: 0, declined: 0 };
  for (const r of counts.data ?? []) {
    tally.all++;
    tally[r.status]++;
    if (["new", "contacted", "confirmed"].includes(r.status)) tally.open++;
  }
  return { requests: (data ?? []).map((r) => mapRequest(r as unknown as Row)), counts: tally };
}

export async function countNewSevaRequests() {
  const { count } = await createAdminClient().from("seva_requests").select("id", { count: "exact", head: true }).eq("status", "new");
  return count ?? 0;
}
