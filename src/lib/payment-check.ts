// Checks a UPI payment screenshot (as read by the screenshot reader)
// against the booking it's meant to pay for. Pure functions — no I/O — so
// the rules are easy to read and test.

/** How long the temple's payment QR stays valid each time it's shown. */
export const PAYMENT_WINDOW_MS = 10 * 60_000;
// Screenshots show the time to the minute, and phone clocks drift a little.
const CLOCK_SLACK_MS = 2 * 60_000;

export type ScreenshotReading = {
  isUpiPayment: boolean;
  status: "success" | "failed" | "pending" | null;
  amount: number | null;
  utr: string | null;
  /** "YYYY-MM-DD", or "MM-DD" when the screenshot shows no year. */
  date: string | null;
  /** "HH:MM", 24-hour, as shown (Indian time). */
  time: string | null;
  payeeName: string | null;
  payeeUpiId: string | null;
  payeePhone: string | null;
  note: string | null;
  editedSuspected: boolean;
};

export type PaymentRejection =
  | "not_payment"
  | "not_successful"
  | "wrong_receiver"
  | "amount_mismatch"
  | "missing_time"
  | "date_mismatch"
  | "time_mismatch"
  | "other_booking"
  | "utr_mismatch"
  | "missing_utr";

export type CheckResult =
  | { ok: true; utr: string; paidAt: number; notes: string[] }
  | { ok: false; reason: PaymentRejection; details: Record<string, string | number> };

export type Expected = {
  reference: string;
  amount: number;
  /** Start times (ms) of each 10-minute QR session shown for this booking. */
  sessions: number[];
  receiver: { upiId: string; upiNumber: string; payeeName: string };
  /** UTR the devotee typed, if any. */
  typedUtr: string | null;
  now: number;
};

const IST_OFFSET_MS = 330 * 60_000;

export const istDate = (ms: number) => new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 10);
export const istTime = (ms: number) => new Date(ms + IST_OFFSET_MS).toISOString().slice(11, 16);

const digits = (v: string) => v.replace(/\D/g, "");
const words = (v: string) =>
  v
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !["shri", "the", "and", "trust"].includes(w));

/** The payee on the screenshot is the temple's own UPI account. */
export function receiverMatches(reading: ScreenshotReading, receiver: Expected["receiver"]): boolean {
  const id = reading.payeeUpiId?.trim().toLowerCase();
  if (id && receiver.upiId && id === receiver.upiId.trim().toLowerCase()) return true;

  if (reading.payeePhone && receiver.upiNumber) {
    const shown = reading.payeePhone;
    const want = digits(receiver.upiNumber).slice(-10);
    const got = digits(shown);
    // Apps often mask the number (XXXXXX1234): then the visible tail must match.
    if (got.length >= 10 && got.slice(-10) === want) return true;
    if (/[x*•]/i.test(shown) && got.length >= 4 && want.endsWith(got.slice(-4))) return true;
  }

  if (reading.payeeName && receiver.payeeName) {
    const want = words(receiver.payeeName);
    const got = new Set(words(reading.payeeName));
    const common = want.filter((w) => got.has(w)).length;
    // Most of the account name's words, allowing for the bank's spelling
    // ("Devasthana" vs "Devasthanam") by comparing word stems too.
    const stem = (w: string) => w.slice(0, 6);
    const gotStems = new Set([...got].map(stem));
    const fuzzy = want.filter((w) => gotStems.has(stem(w))).length;
    if (want.length && (common / want.length >= 0.5 || fuzzy / want.length >= 0.6)) return true;
  }
  return false;
}

/** Parses the screenshot's date and time (Indian time) to epoch ms. */
export function paidAtFrom(reading: ScreenshotReading, now: number): number | null {
  if (!reading.date || !reading.time || !/^\d{1,2}:\d{2}$/.test(reading.time)) return null;
  const [h, m] = reading.time.split(":").map(Number);
  if (h > 23 || m > 59) return null;
  let date = reading.date;
  if (/^\d{2}-\d{2}$/.test(date)) {
    // No year on the screenshot: the most recent such date.
    const year = Number(istDate(now).slice(0, 4));
    date = `${year}-${date}`;
    if (date > istDate(now)) date = `${year - 1}-${reading.date}`;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const ms = Date.parse(`${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+05:30`);
  return Number.isFinite(ms) ? ms : null;
}

const cleanUtr = (v: string | null) => {
  const s = (v ?? "").replace(/[\s-]/g, "").toUpperCase();
  return /^[A-Z0-9]{6,35}$/.test(s) ? s : null;
};

export function checkPayment(reading: ScreenshotReading, expected: Expected): CheckResult {
  const fail = (reason: PaymentRejection, details: Record<string, string | number> = {}): CheckResult => ({ ok: false, reason, details });

  if (!reading.isUpiPayment) return fail("not_payment");
  if (reading.status !== "success") return fail("not_successful");

  // Paid to the temple — its UPI ID, number or account name must be on it.
  const { receiver } = expected;
  if ((receiver.upiId || receiver.upiNumber || receiver.payeeName) && !receiverMatches(reading, receiver)) {
    return fail("wrong_receiver");
  }

  // The full amount for all the tickets.
  if (reading.amount == null || Math.abs(reading.amount - expected.amount) > 0.001) {
    return fail("amount_mismatch", { paid: reading.amount ?? 0, expected: expected.amount });
  }

  // When it was paid: on a day a QR was shown, inside a 10-minute window.
  const paidAt = paidAtFrom(reading, expected.now);
  if (paidAt == null) return fail("missing_time");
  if (paidAt > expected.now + CLOCK_SLACK_MS) return fail("date_mismatch", { date: istDate(paidAt) });
  const sessions = [...expected.sessions].sort((a, b) => b - a);
  if (!sessions.some((s) => istDate(s) === istDate(paidAt))) {
    return fail("date_mismatch", { date: istDate(paidAt) });
  }
  // Minute precision on the screenshot: compare against the whole minute.
  const inWindow = sessions.some((s) => paidAt + 60_000 >= s - CLOCK_SLACK_MS && paidAt <= s + PAYMENT_WINDOW_MS + CLOCK_SLACK_MS);
  if (!inWindow) {
    const nearest = sessions.reduce((best, s) => (Math.abs(s - paidAt) < Math.abs(best - paidAt) ? s : best), sessions[0]);
    return fail("time_mismatch", {
      time: istTime(paidAt),
      from: istTime(nearest),
      to: istTime(nearest + PAYMENT_WINDOW_MS),
    });
  }

  // A payment note naming another booking.
  const noteRef = reading.note?.toUpperCase().match(/\b([A-F0-9]{8})\b/)?.[1];
  if (noteRef && noteRef !== expected.reference && /seva/i.test(reading.note ?? "")) return fail("other_booking");

  const shownUtr = cleanUtr(reading.utr);
  const typed = cleanUtr(expected.typedUtr);
  if (shownUtr && typed && shownUtr !== typed) return fail("utr_mismatch");
  const utr = shownUtr ?? typed;
  if (!utr) return fail("missing_utr");

  const notes: string[] = [];
  if (reading.editedSuspected) notes.push("Screenshot reader saw possible signs of editing — check carefully.");
  if (!shownUtr) notes.push("UTR typed by the devotee; not visible on the screenshot.");
  return { ok: true, utr, paidAt, notes };
}
