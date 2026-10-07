"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { findBookingReference, getBookedCounts } from "@/lib/data/bookings";
import { signTicket } from "@/lib/ticket-token";
import { todayInIndia } from "@/lib/dates";
import { getDevotee } from "@/lib/devotee/auth";
import { redirect } from "@/i18n/navigation";
import { MAX_TICKETS_PER_BOOKING, type BookedCounts } from "@/lib/content-types";
import { NAKSHATRA_KEYS } from "@/lib/nakshatras";
import type { BookingStatus, PaymentStatus } from "@/lib/content-types";

// ── Devotee-facing ───────────────────────────────────────────────────────

export async function getSevaAvailability(sevaId: string): Promise<BookedCounts> {
  if (!/^[a-z0-9-]{1,100}$/.test(sevaId)) return {};
  return getBookedCounts(sevaId);
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => v || null);

const devoteeSchema = z.object({
  name: z.string().trim().min(2).max(100),
  gotram: optionalText(60),
  nakshatram: optionalText(40).refine((v) => v === null || NAKSHATRA_KEYS.includes(v)),
});

const bookingSchema = z.object({
  sevaId: z.string().regex(/^[a-z0-9-]{1,100}$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotId: z.string().uuid().nullable(),
  // One devotee per ticket.
  devotees: z.array(devoteeSchema).min(1).max(MAX_TICKETS_PER_BOOKING),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^\+?[0-9]{10,13}$/)),
});

export type BookingErrorCode =
  | "login"
  | "invalid"
  | "seva_unavailable"
  | "date_unavailable"
  | "slot_required"
  | "slot_unavailable"
  | "slot_full"
  | "failed";

export type CreateBookingResult =
  | { ok: true; reference: string; ticketToken: string; status: BookingStatus; amount: number }
  | { ok: false; error: BookingErrorCode };

export async function createBooking(input: {
  sevaId: string;
  date: string;
  slotId: string | null;
  devotees: { name: string; gotram?: string | null; nakshatram?: string | null }[];
  phone: string;
}): Promise<CreateBookingResult> {
  // Booking requires a devotee account; the booking is saved to it.
  const devotee = await getDevotee();
  if (!devotee) return { ok: false, error: "login" };
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { sevaId, date, slotId, devotees, phone } = parsed.data;

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("create_booking", {
    p_seva_id: sevaId,
    p_date: date,
    p_phone: phone,
    p_devotees: devotees,
    p_slot_id: slotId,
  });
  if (error) {
    if (error.message.includes("invalid_devotees")) return { ok: false, error: "invalid" };
    const known = (
      ["seva_unavailable", "date_unavailable", "slot_required", "slot_unavailable", "slot_full"] as const
    ).find((code) =>
      error.message.includes(code),
    );
    if (!known) console.error("createBooking:", error.message);
    return { ok: false, error: known ?? "failed" };
  }

  const row = Array.isArray(data) ? data[0] : data;
  await Promise.all([
    supabase.from("bookings").update({ user_id: devotee.id }).eq("id", row.booking_id),
    // Remember the mobile number for next time if the profile has none.
    supabase.from("devotee_profiles").update({ phone }).eq("id", devotee.id).eq("phone", ""),
  ]);
  revalidatePath("/[locale]/admin", "layout");
  return {
    ok: true,
    reference: row.booking_reference,
    ticketToken: signTicket(row.booking_reference),
    status: row.booking_status,
    amount: row.booking_amount,
  };
}

export type FindTicketState = { error?: "notFound" } | undefined;

// "Find my ticket": booking reference + the phone number used to book.
export async function findTicket(locale: string, _prev: FindTicketState, formData: FormData): Promise<FindTicketState> {
  const reference = String(formData.get("reference") ?? "")
    .trim()
    .toUpperCase();
  const phone = String(formData.get("phone") ?? "");
  const found = await findBookingReference(reference, phone);
  if (!found) return { error: "notFound" };
  redirect({ href: { pathname: `/ticket/${found}`, query: { t: signTicket(found) } }, locale });
}

// ── Admin ────────────────────────────────────────────────────────────────

const STATUSES: BookingStatus[] = ["pending", "confirmed", "cancelled"];
const PAYMENT_STATUSES: PaymentStatus[] = ["unpaid", "submitted", "paid", "refunded"];

export async function setBookingStatus(id: string, status: BookingStatus): Promise<void> {
  await verifyAdminSession();
  if (!STATUSES.includes(status)) throw new Error("invalid status");
  const supabase = createAdminClient();
  const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/admin", "layout");
}

export async function setBookingPaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<void> {
  await verifyAdminSession();
  if (!PAYMENT_STATUSES.includes(paymentStatus)) throw new Error("invalid payment status");
  const supabase = createAdminClient();
  // Recording a payment also confirms the booking — that's the counter flow.
  const update =
    paymentStatus === "paid" ? { payment_status: paymentStatus, status: "confirmed" } : { payment_status: paymentStatus };
  const { error } = await supabase.from("bookings").update(update).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/admin", "layout");
}

// ── Darshan check-in & prasadam (admin scans the ticket QR) ──────────────

export type ScanState = { checkedInAt: string | null; prasadamClaimedAt: string | null };

export type CheckInResult =
  | { ok: true; checkedInAt: string }
  | ({ ok: false; error: "not_found" | "already_used" | "cancelled" | "refunded" | "unpaid" | "wrong_date" } & Partial<ScanState>)
  // The devotee uploaded a UPI screenshot the office hasn't verified yet.
  | { ok: false; error: "upi_unverified"; utr: string | null };

const refPattern = /^[A-F0-9]{8}$/;

async function readForScan(reference: string) {
  const ref = reference.trim().toUpperCase();
  if (!refPattern.test(ref)) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, booking_date, amount, status, payment_status, payment_utr, checked_in_at, prasadam_claimed_at")
    .eq("reference", ref)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

// Marks darshan done. The update only matches a booking that hasn't been
// checked in yet, so two staff scanning the same QR can't both admit it —
// the second gets "already_used". Unpaid tickets need `collectPayment` (the
// counter took the money) and tickets for another day need `anyDate`.
export async function checkInBooking(
  reference: string,
  opts: { collectPayment?: boolean; anyDate?: boolean } = {},
): Promise<CheckInResult> {
  const admin = await verifyAdminSession();
  const booking = await readForScan(reference);
  if (!booking) return { ok: false, error: "not_found" };
  if (booking.checked_in_at) {
    return { ok: false, error: "already_used", checkedInAt: booking.checked_in_at, prasadamClaimedAt: booking.prasadam_claimed_at };
  }
  if (booking.status === "cancelled") return { ok: false, error: "cancelled" };
  if (booking.payment_status === "refunded") return { ok: false, error: "refunded" };
  const unpaid = booking.amount > 0 && booking.payment_status !== "paid";
  if (unpaid && !opts.collectPayment) {
    return booking.payment_status === "submitted"
      ? { ok: false, error: "upi_unverified", utr: booking.payment_utr }
      : { ok: false, error: "unpaid" };
  }
  if (booking.booking_date !== todayInIndia() && !opts.anyDate) return { ok: false, error: "wrong_date" };

  const supabase = createAdminClient();
  const { data: updated, error } = await supabase
    .from("bookings")
    .update({
      checked_in_at: new Date().toISOString(),
      checked_in_by: admin.id,
      status: "confirmed",
      ...(unpaid
        ? {
            payment_status: "paid",
            ...(booking.payment_status === "submitted"
              ? { payment_reviewed_at: new Date().toISOString(), payment_reviewed_by: admin.id }
              : { payment_method: "counter" }),
          }
        : {}),
    })
    .eq("id", booking.id)
    .is("checked_in_at", null)
    .neq("status", "cancelled")
    .select("checked_in_at");
  if (error) throw new Error(error.message);
  if (!updated?.length) {
    // Lost a race with another scan.
    const now = await readForScan(reference);
    return {
      ok: false,
      error: "already_used",
      checkedInAt: now?.checked_in_at ?? undefined,
      prasadamClaimedAt: now?.prasadam_claimed_at ?? undefined,
    };
  }
  revalidatePath("/[locale]/admin", "layout");
  return { ok: true, checkedInAt: updated[0].checked_in_at };
}

export type CollectPaymentResult = { ok: true } | { ok: false; error: "not_found" | "cancelled" | "refunded" | "already_paid" };

// Counter took the money but the devotee will go for darshan later: record
// the payment and leave the QR valid. The next scan checks it in as usual.
export async function collectPaymentHoldDarshan(reference: string): Promise<CollectPaymentResult> {
  await verifyAdminSession();
  const booking = await readForScan(reference);
  if (!booking) return { ok: false, error: "not_found" };
  if (booking.status === "cancelled") return { ok: false, error: "cancelled" };
  if (booking.payment_status === "refunded") return { ok: false, error: "refunded" };
  if (booking.amount === 0 || booking.payment_status === "paid") return { ok: false, error: "already_paid" };
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("bookings")
    .update({ payment_status: "paid", status: "confirmed", ...(booking.payment_status === "unpaid" ? { payment_method: "counter" } : {}) })
    .eq("id", booking.id)
    .in("payment_status", ["unpaid", "submitted"]);
  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/admin", "layout");
  return { ok: true };
}

export type PrasadamResult =
  | { ok: true; prasadamClaimedAt: string }
  | { ok: false; error: "not_found" | "no_darshan" | "already_claimed"; prasadamClaimedAt?: string };

// Prasadam is handed over once per booking, any time after darshan (the
// same day or later). Like check-in, only the first scan wins.
export async function claimPrasadam(reference: string): Promise<PrasadamResult> {
  const admin = await verifyAdminSession();
  const booking = await readForScan(reference);
  if (!booking) return { ok: false, error: "not_found" };
  if (!booking.checked_in_at) return { ok: false, error: "no_darshan" };
  if (booking.prasadam_claimed_at) return { ok: false, error: "already_claimed", prasadamClaimedAt: booking.prasadam_claimed_at };

  const supabase = createAdminClient();
  const { data: updated, error } = await supabase
    .from("bookings")
    .update({ prasadam_claimed_at: new Date().toISOString(), prasadam_claimed_by: admin.id })
    .eq("id", booking.id)
    .not("checked_in_at", "is", null)
    .is("prasadam_claimed_at", null)
    .select("prasadam_claimed_at");
  if (error) throw new Error(error.message);
  if (!updated?.length) {
    const now = await readForScan(reference);
    return { ok: false, error: "already_claimed", prasadamClaimedAt: now?.prasadam_claimed_at ?? undefined };
  }
  revalidatePath("/[locale]/admin", "layout");
  return { ok: true, prasadamClaimedAt: updated[0].prasadam_claimed_at };
}
