// Checks a UPI payment screenshot (as read by the screenshot reader)
// against the booking it's meant to pay for: the amount, the date and the
// receiver's account name. Nothing is rejected — a mismatch only becomes a
// note for the office to check in the Payments log. Pure functions — no
// I/O — so the rules are easy to read and test.

/** How long the temple's payment QR stays valid each time it's shown. */
export const PAYMENT_WINDOW_MS = 10 * 60_000;

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

export type CheckResult = { utr: string | null; paidAt: number | null; notes: string[] };

export type Expected = {
  amount: number;
  /** Start times (ms) of each 10-minute QR session shown for this booking. */
  sessions: number[];
  /** The temple's UPI account name. */
  payeeName: string;
  /** UTR the devotee typed, if any. */
  typedUtr: string | null;
  now: number;
};

const IST_OFFSET_MS = 330 * 60_000;

export const istDate = (ms: number) => new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 10);
export const istTime = (ms: number) => new Date(ms + IST_OFFSET_MS).toISOString().slice(11, 16);

const words = (v: string) =>
  v
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !["shri", "the", "and", "trust"].includes(w));

/** The receiver's name on the screenshot is the temple's account name. */
export function payeeNameMatches(shown: string, want: string): boolean {
  const wanted = words(want);
  const got = new Set(words(shown));
  const common = wanted.filter((w) => got.has(w)).length;
  // Most of the account name's words, allowing for the bank's spelling
  // ("Devasthana" vs "Devasthanam") by comparing word stems too.
  const stem = (w: string) => w.slice(0, 6);
  const gotStems = new Set([...got].map(stem));
  const fuzzy = wanted.filter((w) => gotStems.has(stem(w))).length;
  return !!wanted.length && (common / wanted.length >= 0.5 || fuzzy / wanted.length >= 0.6);
}

/** The screenshot's payment date (Indian time) as "YYYY-MM-DD". */
export function paidDateFrom(reading: ScreenshotReading, now: number): string | null {
  let date = reading.date;
  if (!date) return null;
  if (/^\d{2}-\d{2}$/.test(date)) {
    // No year on the screenshot: the most recent such date.
    const year = Number(istDate(now).slice(0, 4));
    date = `${year}-${reading.date}`;
    if (date > istDate(now)) date = `${year - 1}-${reading.date}`;
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}

/** Parses the screenshot's date and time (Indian time) to epoch ms. */
export function paidAtFrom(reading: ScreenshotReading, now: number): number | null {
  const date = paidDateFrom(reading, now);
  if (!date || !reading.time || !/^\d{1,2}:\d{2}$/.test(reading.time)) return null;
  const [h, m] = reading.time.split(":").map(Number);
  if (h > 23 || m > 59) return null;
  const ms = Date.parse(`${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+05:30`);
  return Number.isFinite(ms) ? ms : null;
}

const cleanUtr = (v: string | null) => {
  const s = (v ?? "").replace(/[\s-]/g, "").toUpperCase();
  return /^[A-Z0-9]{6,35}$/.test(s) ? s : null;
};

export function checkPayment(reading: ScreenshotReading, expected: Expected): CheckResult {
  const notes: string[] = [];

  // The full amount for all the tickets.
  if (reading.amount == null) notes.push("Amount not visible on the screenshot.");
  else if (Math.abs(reading.amount - expected.amount) > 0.001) {
    notes.push(`Amount on the screenshot is ₹${reading.amount}, expected ₹${expected.amount}.`);
  }

  // Paid on a day the QR was shown (or today).
  const date = paidDateFrom(reading, expected.now);
  const days = new Set([...expected.sessions, expected.now].map(istDate));
  if (!date) notes.push("Payment date not visible on the screenshot.");
  else if (!days.has(date)) notes.push(`Payment date on the screenshot is ${date}, not a day the payment QR was shown.`);

  // Paid to the temple's account.
  if (expected.payeeName) {
    if (!reading.payeeName) notes.push("Receiver name not visible on the screenshot.");
    else if (!payeeNameMatches(reading.payeeName, expected.payeeName)) {
      notes.push(`Receiver on the screenshot is "${reading.payeeName}", not "${expected.payeeName}".`);
    }
  }

  const utr = cleanUtr(reading.utr) ?? cleanUtr(expected.typedUtr);
  return { utr, paidAt: paidAtFrom(reading, expected.now), notes };
}
