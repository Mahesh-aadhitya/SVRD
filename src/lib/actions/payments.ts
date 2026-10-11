"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTicket } from "@/lib/ticket-token";
import { llmProviders } from "@/lib/ai/llm";
import { fetchSiteSettings } from "@/lib/data/site-settings";
import { getBookingForTicket } from "@/lib/data/bookings";
import { alertOfficeOfPayment } from "@/lib/notify/booking-alert";
import { emailPriestOfPayment } from "@/lib/notify/priest-email";
import { siteOrigin } from "@/lib/site-url";
import { PAYMENT_WINDOW_MS, checkPayment, type ScreenshotReading } from "@/lib/payment-check";

// UPI pay-by-proof: the devotee is shown the temple's UPI QR / ID for 10
// minutes, pays from any UPI app, then uploads the payment screenshot. The
// ticket is issued as "payment submitted" straight away. The screenshot is
// read and checked — the amount, the date and the receiver's account name —
// and anything that doesn't match is noted for the office, which verifies
// each payment from the Payments log. Nothing is rejected automatically.

const PROOF_BUCKET = "payment-proofs";
const PROOF_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};
const refPattern = /^[A-F0-9]{8}$/;
const utrPattern = /^[A-Za-z0-9]{6,35}$/;
const MAX_SESSIONS = 30;

const cleanUtr = (v: unknown) => {
  const s = String(v ?? "").replace(/[\s-]/g, "");
  return utrPattern.test(s) ? s.toUpperCase() : null;
};

type PayableBooking = { id: string; amount: number; status: string; payment_status: string; payment_sessions: string[] | null };

export type PaymentError = "not_found" | "cancelled" | "already_paid" | "bad_file" | "failed";

// The ticket link's signature proves this is the devotee's own booking.
async function payableBooking(reference: string, token: string): Promise<PayableBooking | { error: PaymentError }> {
  const ref = reference.trim().toUpperCase();
  if (!refPattern.test(ref) || !verifyTicket(ref, token)) return { error: "not_found" };
  const { data, error } = await createAdminClient()
    .from("bookings")
    .select("id, amount, status, payment_status, payment_sessions")
    .eq("reference", ref)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return { error: "not_found" };
  if (data.status === "cancelled") return { error: "cancelled" };
  if (data.amount === 0 || data.payment_status === "paid" || data.payment_status === "refunded") return { error: "already_paid" };
  return data;
}

// ── The 10-minute payment QR ─────────────────────────────────────────────

export type PaymentSession = { startedAt: number; expiresAt: number; serverNow: number };

// Shows the temple's QR / UPI details for 10 minutes: returns the window
// still running, or (unless `resumeOnly`) opens a new one. The start is
// recorded so the screenshot's payment time can be checked against it.
export async function startPaymentSession(
  reference: string,
  token: string,
  resumeOnly = false,
): Promise<{ session: PaymentSession | null } | { error: PaymentError }> {
  const booking = await payableBooking(reference, token);
  if ("error" in booking) return { error: booking.error };
  const now = Date.now();
  const sessions = (booking.payment_sessions ?? []).map((s) => Date.parse(s)).filter(Number.isFinite);
  const latest = Math.max(0, ...sessions);
  if (latest && now < latest + PAYMENT_WINDOW_MS) {
    return { session: { startedAt: latest, expiresAt: latest + PAYMENT_WINDOW_MS, serverNow: now } };
  }
  if (resumeOnly) return { session: null };
  const next = [...(booking.payment_sessions ?? []), new Date(now).toISOString()].slice(-MAX_SESSIONS);
  const { error } = await createAdminClient().from("bookings").update({ payment_sessions: next }).eq("id", booking.id);
  if (error) return { error: "failed" };
  return { session: { startedAt: now, expiresAt: now + PAYMENT_WINDOW_MS, serverNow: now } };
}

// ── Screenshot upload ────────────────────────────────────────────────────

export async function requestPaymentProofUpload(
  reference: string,
  token: string,
  contentType: string,
): Promise<{ path?: string; token?: string; error?: PaymentError }> {
  const booking = await payableBooking(reference, token);
  if ("error" in booking) return { error: booking.error };
  const ext = PROOF_EXT[contentType];
  if (!ext) return { error: "bad_file" };
  const { data, error } = await createAdminClient()
    .storage.from(PROOF_BUCKET)
    .createSignedUploadUrl(`${reference.toUpperCase()}/${randomUUID()}.${ext}`);
  if (error || !data) return { error: "failed" };
  return { path: data.path, token: data.token };
}

export type SubmitPaymentResult = { ok: true; utr: string | null } | { ok: false; error: PaymentError };

export async function submitPaymentProof(input: {
  reference: string;
  token: string;
  path: string;
  utr?: string;
}): Promise<SubmitPaymentResult> {
  const ref = input.reference.trim().toUpperCase();
  const booking = await payableBooking(ref, input.token);
  if ("error" in booking) return { ok: false, error: booking.error };
  // Only a file uploaded for this booking.
  if (!new RegExp(`^${ref}/[0-9a-f-]{36}\\.(jpg|png|webp|heic|heif)$`).test(input.path)) return { ok: false, error: "bad_file" };

  const supabase = createAdminClient();
  const { data: file, error: fileError } = await supabase.storage.from(PROOF_BUCKET).download(input.path);
  if (fileError || !file) return { ok: false, error: "bad_file" };

  const reading = await readScreenshot(file).catch((error) => {
    console.error("readScreenshot:", error instanceof Error ? error.message : error);
    return null;
  });
  const settings = await fetchSiteSettings();
  const now = Date.now();
  // Couldn't read it at all (reader busy or down): accept it anyway and
  // leave the check to the office.
  const result = reading
    ? checkPayment(reading, {
        amount: booking.amount,
        sessions: (booking.payment_sessions ?? []).map((s) => Date.parse(s)).filter(Number.isFinite),
        payeeName: settings.upiPayeeName,
        typedUtr: cleanUtr(input.utr),
        now,
      })
    : { utr: cleanUtr(input.utr), paidAt: null, notes: ["Screenshot couldn't be read automatically — check it by hand."] };

  const { error } = await supabase
    .from("bookings")
    .update({
      payment_status: "submitted",
      payment_method: "upi",
      payment_proof_path: input.path,
      payment_utr: result.utr,
      payment_submitted_at: new Date(result.paidAt ?? now).toISOString(),
      payment_reviewed_at: null,
      payment_reviewed_by: null,
      payment_note: result.notes.join(" ") || null,
      // The ticket is issued straight away; the office verifies the proof.
      status: "confirmed",
    })
    .eq("id", booking.id)
    .in("payment_status", ["unpaid", "submitted"]);
  if (error) {
    console.error("submitPaymentProof:", error.message);
    return { ok: false, error: "failed" };
  }
  await supabase.from("payment_attempts").insert({ booking_id: booking.id, proof_path: input.path, accepted: true, reason: null, reading });
  revalidatePath("/[locale]/admin", "layout");

  // Tell the priest, after the response: on WhatsApp with a 30-day link to
  // the screenshot (the bucket is private), and by email with the
  // screenshot attached.
  const origin = await siteOrigin();
  const utr = result.utr ?? "—";
  after(async () => {
    const ticket = await getBookingForTicket(ref).catch((e) => (console.error("payment alerts:", e), null));
    if (!ticket) return;
    const ext = input.path.split(".").pop() ?? "jpg";
    const contentType = Object.entries(PROOF_EXT).find(([, e]) => e === ext)?.[0] ?? "image/jpeg";
    await Promise.all([
      supabase.storage
        .from(PROOF_BUCKET)
        .createSignedUrl(input.path, 30 * 86_400)
        .then((signed) => alertOfficeOfPayment(ticket, utr, signed.data?.signedUrl ?? null, `${origin}/admin/verify/${ref}`))
        .catch((e) => console.error("payment WhatsApp alert:", e)),
      emailPriestOfPayment(ticket, utr, {
        filename: `payment-${ref}.${ext}`,
        content: Buffer.from(await file.arrayBuffer()),
        contentType,
      }).catch((e) => console.error("payment priest email:", e)),
    ]);
  });

  return { ok: true, utr: result.utr };
}

const READ_SYSTEM = `You read screenshots of Indian UPI payment confirmations (Google Pay, PhonePe, Paytm, BHIM, bank apps) and extract exactly what is visible.
Reply with JSON only:
{"is_upi_payment": boolean, "status": "success"|"failed"|"pending"|null, "amount": number|null, "utr": string|null, "date": string|null, "time": string|null, "payee_name": string|null, "payee_upi_id": string|null, "payee_phone": string|null, "note": string|null, "edited_suspected": boolean}
- is_upi_payment: true only if this is a screenshot of a UPI payment receipt/confirmation screen. Photos, documents, chats, QR codes alone, bank statements or anything else: false.
- status: whether the screen shows the payment completed ("success"), failed, or pending/processing.
- amount: the rupee amount paid, as a number.
- utr: the UPI transaction reference — labelled "UPI transaction ID", "UTR", "UPI Ref No" or "Transaction ID"; prefer the 12-digit UPI reference when several IDs are shown. Copy exactly.
- date: the payment date as "YYYY-MM-DD", or "MM-DD" if the year isn't shown. time: the payment time as 24-hour "HH:MM".
- payee_*: the RECEIVER of the money (the "To" / "Paid to" party) — never the sender/payer. payee_phone may be masked (e.g. "XXXXXX1234"); copy it as shown.
- note: the payment note/message, if shown.
- edited_suspected: true only if there are clear visual signs the screenshot was edited (mismatched fonts, misaligned or pasted-over text).
Use null for anything not visible. Never guess or invent values.`;

// Bounded so the devotee isn't kept waiting: no answer in time means the
// screenshot couldn't be read (they're asked to try again).
async function readScreenshot(file: Blob): Promise<ScreenshotReading | null> {
  const providers = llmProviders();
  if (!providers.length || file.size > 8 * 1024 * 1024) return null;
  const image = { mimeType: file.type || "image/jpeg", data: Buffer.from(await file.arrayBuffer()).toString("base64") };
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const attempt = (async () => {
    for (const [, ask] of providers) {
      try {
        const raw = await ask({ system: READ_SYSTEM, text: "Read this screenshot.", json: true, image });
        const p = JSON.parse(raw.replace(/^```(?:json)?|```$/g, "").trim()) as Record<string, unknown>;
        const amount = typeof p.amount === "number" ? p.amount : Number(String(p.amount ?? "").replace(/[^\d.]/g, "")) || null;
        const status = p.status === "success" || p.status === "failed" || p.status === "pending" ? p.status : null;
        return {
          isUpiPayment: p.is_upi_payment === true,
          status,
          amount,
          utr: str(p.utr),
          date: str(p.date),
          time: str(p.time),
          payeeName: str(p.payee_name),
          payeeUpiId: str(p.payee_upi_id),
          payeePhone: str(p.payee_phone),
          note: str(p.note),
          editedSuspected: p.edited_suspected === true,
        } satisfies ScreenshotReading;
      } catch {
        // Try the next provider.
      }
    }
    return null;
  })();
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 25_000));
  return Promise.race([attempt, timeout]);
}

// ── Admin: the payment log ───────────────────────────────────────────────

export async function verifyPayment(bookingId: string): Promise<void> {
  const admin = await verifyAdminSession();
  const { error } = await createAdminClient()
    .from("bookings")
    .update({
      payment_status: "paid",
      status: "confirmed",
      payment_reviewed_at: new Date().toISOString(),
      payment_reviewed_by: admin.id,
    })
    .eq("id", bookingId)
    .eq("payment_status", "submitted");
  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/admin", "layout");
}

// The money didn't arrive (or the screenshot is wrong): the ticket goes
// back to awaiting payment, and the devotee can upload again or pay at the
// counter.
export async function rejectPayment(bookingId: string, note: string): Promise<void> {
  const admin = await verifyAdminSession();
  const { error } = await createAdminClient()
    .from("bookings")
    .update({
      payment_status: "unpaid",
      status: "pending",
      payment_reviewed_at: new Date().toISOString(),
      payment_reviewed_by: admin.id,
      payment_note: note.trim().slice(0, 300) || "Payment could not be verified.",
    })
    .eq("id", bookingId)
    .eq("payment_status", "submitted");
  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/admin", "layout");
}

export async function setPaymentUtr(bookingId: string, utr: string): Promise<{ error?: string }> {
  await verifyAdminSession();
  const value = utr.trim() ? cleanUtr(utr) : null;
  if (utr.trim() && !value) return { error: "UTR should be 6–35 letters or digits" };
  const { error } = await createAdminClient().from("bookings").update({ payment_utr: value }).eq("id", bookingId);
  if (error) return { error: error.message };
  revalidatePath("/[locale]/admin", "layout");
  return {};
}
