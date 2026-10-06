import "server-only";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DevoteeProfile, Donation, DonationPurpose, DonationStatus } from "@/lib/devotee/types";

type DonationRow = {
  id: string;
  receipt_no: string;
  purpose: DonationPurpose;
  amount: number;
  donor_name: string;
  phone: string;
  email: string;
  note: string | null;
  status: DonationStatus;
  razorpay_payment_id: string | null;
  paid_at: string | null;
  created_at: string;
};

const COLUMNS = "id, receipt_no, purpose, amount, donor_name, phone, email, note, status, razorpay_payment_id, paid_at, created_at";

const mapRow = (row: DonationRow): Donation => ({
  id: row.id,
  receiptNo: row.receipt_no,
  purpose: row.purpose,
  amount: row.amount,
  donorName: row.donor_name,
  phone: row.phone,
  email: row.email,
  note: row.note,
  status: row.status,
  paymentId: row.razorpay_payment_id,
  paidAt: row.paid_at,
  createdAt: row.created_at,
});

// A devotee's completed donations. `userId` must come from getDevotee().
export async function getDonationsForUser(userId: string): Promise<Donation[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("donations")
    .select(COLUMNS)
    .eq("user_id", userId)
    .eq("status", "paid")
    .order("paid_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(`getDonationsForUser: ${error.message}`);
  return (data ?? []).map(mapRow);
}

// One receipt, only if it belongs to this devotee and is paid.
export async function getDonationReceipt(userId: string, receiptNo: string): Promise<Donation | null> {
  if (!/^D[A-F0-9]{9}$/.test(receiptNo)) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("donations")
    .select(COLUMNS)
    .eq("receipt_no", receiptNo)
    .eq("user_id", userId)
    .eq("status", "paid")
    .maybeSingle();
  if (error) throw new Error(`getDonationReceipt: ${error.message}`);
  return data ? mapRow(data) : null;
}

export async function getProfile(userId: string): Promise<DevoteeProfile | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("devotee_profiles")
    .select("full_name, email, phone, gotram, nakshatram")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(`getProfile: ${error.message}`);
  return data
    ? { fullName: data.full_name, email: data.email, phone: data.phone, gotram: data.gotram, nakshatram: data.nakshatram }
    : null;
}

export type DonationFilters = { purpose?: DonationPurpose; from?: string; to?: string; q?: string };

// Admin: paid donations, newest first, with the total for the filter.
export async function getDonationsForAdmin(filters: DonationFilters = {}): Promise<{ donations: Donation[]; total: number }> {
  await verifyAdminSession();
  const supabase = createAdminClient();
  let query = supabase.from("donations").select(COLUMNS).eq("status", "paid").order("paid_at", { ascending: false }).limit(1000);
  if (filters.purpose) query = query.eq("purpose", filters.purpose);
  if (filters.from) query = query.gte("paid_at", `${filters.from}T00:00:00+05:30`);
  if (filters.to) {
    const end = new Date(`${filters.to}T00:00:00Z`);
    end.setUTCDate(end.getUTCDate() + 1);
    query = query.lt("paid_at", `${end.toISOString().slice(0, 10)}T00:00:00+05:30`);
  }
  if (filters.q) {
    const q = filters.q.replace(/[%,()]/g, "");
    query = query.or(`donor_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%,receipt_no.ilike.%${q}%`);
  }
  const { data, error } = await query;
  if (error) throw new Error(`getDonationsForAdmin: ${error.message}`);
  const donations = (data ?? []).map(mapRow);
  return { donations, total: donations.reduce((n, d) => n + d.amount, 0) };
}
