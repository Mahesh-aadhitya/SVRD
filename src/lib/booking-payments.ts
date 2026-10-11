import "server-only";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBookingForTicket } from "@/lib/data/bookings";
import { alertOfficeOfPayment } from "@/lib/notify/booking-alert";
import { emailPriestOfPayment } from "@/lib/notify/priest-email";
import { siteOrigin } from "@/lib/site-url";
import { razorpayConfigured } from "@/lib/razorpay";
import { signTicket } from "@/lib/ticket-token";
import { emailBookingConfirmation } from "@/lib/email/booking-confirmation";
import { PAYMENT_HOLD_MINUTES, PAYMENT_HOLD_MS } from "@/lib/payment-hold";

const EXPIRED_NOTE = `Not paid within ${PAYMENT_HOLD_MINUTES} minutes — seats released.`;

// With online payment set up, a paid seva must be paid before it's
// confirmed: bookings made for online payment and still unpaid after the
// hold are cancelled, releasing their seats. Run before seats are counted.
// (Bookings made for the UPI QR + screenshot flow keep their seats.)
export async function releaseExpiredHolds(): Promise<void> {
  if (!razorpayConfigured()) return;
  const { error } = await createAdminClient()
    .from("bookings")
    .update({ status: "cancelled", payment_note: EXPIRED_NOTE })
    .eq("status", "pending")
    .eq("payment_status", "unpaid")
    .eq("payment_method", "razorpay")
    .gt("amount", 0)
    .lt("created_at", new Date(Date.now() - PAYMENT_HOLD_MS).toISOString());
  if (error) console.error("releaseExpiredHolds:", error.message);
}

// Marks a seva booking paid from a Razorpay order + payment. Idempotent,
// and shared by the Checkout handler and the webhook. Deliberately not a
// server action: callers must verify the Razorpay signature first. Returns
// the booking reference, or null if no booking has this order.
export async function markBookingPaid(orderId: string, paymentId: string, locale = "en"): Promise<string | null> {
  const supabase = createAdminClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, reference, status, payment_status, user_id")
    .eq("razorpay_order_id", orderId)
    .maybeSingle();
  if (!booking) return null;
  if (booking.payment_status === "paid") return booking.reference;

  const now = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("bookings")
    .update({
      payment_status: "paid",
      payment_method: "razorpay",
      razorpay_payment_id: paymentId,
      payment_utr: null,
      payment_proof_path: null,
      payment_submitted_at: now,
      // A signed Razorpay payment needs no office review.
      payment_reviewed_at: now,
      payment_reviewed_by: null,
      // Paid after the hold ran out: the seats were released meanwhile.
      payment_note: booking.status === "cancelled" ? "Paid after the payment hold expired — check the seats are still free." : null,
      status: "confirmed",
    })
    .eq("id", booking.id)
    .neq("payment_status", "paid")
    .select("id");
  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/admin", "layout");
  revalidatePath("/[locale]/account", "page");

  // Only the call that actually flipped it sends the ticket and tells the office.
  if (updated?.length) {
    const origin = await siteOrigin();
    const ref = booking.reference;
    const ticketUrl = `${origin}${locale === "kn" ? "/kn" : ""}/ticket/${ref}?t=${signTicket(ref)}`;
    after(async () => {
      const [ticket, profile] = await Promise.all([
        getBookingForTicket(ref).catch((e) => (console.error("payment alerts:", e), null)),
        booking.user_id
          ? supabase.from("devotee_profiles").select("email").eq("id", booking.user_id).maybeSingle().then((r) => r.data)
          : null,
      ]);
      if (!ticket) return;
      const txn = `${paymentId} (Razorpay)`;
      await Promise.all([
        profile?.email
          ? emailBookingConfirmation(profile.email, ticket, ticketUrl, locale).catch((e) => console.error("booking confirmation email:", e))
          : null,
        alertOfficeOfPayment(ticket, txn, null, `${origin}/admin/verify/${ref}`).catch((e) => console.error("payment WhatsApp alert:", e)),
        emailPriestOfPayment(ticket, txn, null).catch((e) => console.error("payment priest email:", e)),
      ]);
    });
  }
  return booking.reference;
}
