// Plain type shared between the server data-fetcher (src/lib/data/sevas.ts)
// and client components (BookingFlow). Deliberately has no "server-only"
// imports so client bundles can import it directly.
import { knDayPart } from "./panchang/format";

export type Seva = {
  id: string;
  name: { en: string; kn: string };
  description: { en: string; kn: string };
  price: number;
  capacityPerSlot: number;
  isActive: boolean;
  releaseStartDate: string | null;
  releaseEndDate: string | null;
  releaseMode: ReleaseMode;
  /** 0 = Sunday … 6 = Saturday; only used when releaseMode is "weekdays". */
  releaseWeekdays: number[] | null;
  /** Hand-picked dates; only used when releaseMode is "dates". */
  releaseDates: string[] | null;
  folderId: string | null;
  /** Time slots sorted by start time. Empty = whole-day booking. */
  slots: SevaSlot[];
  /** Nitya (daily), weekly, monthly, annual, special (darshan tickets, one-offs), or request (no dates — done when a devotee asks). */
  frequency: SevaFrequency;
  /** Free text shown to devotees, e.g. "5:30 AM – 6:15 AM". */
  timing: string;
  /** When it is performed, e.g. "Every month on Shravana nakshatra". */
  schedule: { en: string; kn: string };
  imageUrl: string | null;
  /** Where the deity's face is in the photo ("51% 16%"), for cropping; null until found. */
  imageFocus: string | null;
  /** Shown on the public Sevas page (independent of being open for booking). */
  isListed: boolean;
  /** Days the admin closed inside the booking window, with the reason shown to devotees. */
  blockedDates: Record<string, string>;
  /** Seva on request: book at least this many days ahead (a week by default)… */
  bookMinDays: number;
  /** …and at most this many. Its weekdays are in releaseWeekdays (none = every day). */
  bookMaxDays: number;
  /** Devotees may request it for a special day of their own (priest calls back). */
  allowRequests: boolean;
};

export const SEVA_FREQUENCIES = ["nitya", "weekly", "monthly", "annual", "special", "request"] as const;
export type SevaFrequency = (typeof SEVA_FREQUENCIES)[number];

export type SevaSlot = {
  id: string;
  startTime: string; // "HH:MM" (24h)
  endTime: string | null;
  capacity: number;
  isActive: boolean;
};

// Formatted by hand, like the panchang times, so the server and Safari print
// the same text ("7:30 PM" / "ಸಂಜೆ 7:30") and hydration doesn't break.
export function formatTime(hhmm: string, locale: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const clock = `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")}`;
  return locale === "kn" ? `${knDayPart(h)} ${clock}` : `${clock} ${h < 12 ? "AM" : "PM"}`;
}

// Admin-typed timings ("8:00 AM - 10:00 AM", "8.30am to 8.40am",
// "8:00AM -10:00AM") written one way, in the page's language:
// "8:30 AM – 8:40 AM" / "ಬೆಳಿಗ್ಗೆ 8:30 – ಬೆಳಿಗ್ಗೆ 8:40".
export function formatTiming(text: string, locale: string) {
  const TIME = /(\d{1,2})(?:[:.](\d{2}))?\s*([ap])\.?\s*m\.?(?![a-z])/gi;
  const out = text.replace(TIME, (_, h: string, m: string | undefined, ap: string) => {
    const hour = (Number(h) % 12) + (ap.toLowerCase() === "p" ? 12 : 0);
    return `\u0000${formatTime(`${hour}:${m ?? "00"}`, locale)}\u0000`;
  });
  return out.replace(/\u0000\s*(?:-|–|—|to)\s*\u0000/gi, " – ").replace(/\u0000/g, "");
}

// "6:30 AM – 7:30 AM"
export function formatSlot(slot: Pick<SevaSlot, "startTime" | "endTime">, locale: string) {
  const start = formatTime(slot.startTime, locale);
  return slot.endTime ? `${start} – ${formatTime(slot.endTime, locale)}` : start;
}

export type ReleaseMode = "range" | "week" | "weekdays" | "dates";

type ReleaseFields = Pick<
  Seva,
  "releaseStartDate" | "releaseEndDate" | "releaseMode" | "releaseWeekdays" | "releaseDates"
>;

function dayOfWeek(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

function addDaysIso(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// A seva on request has no released dates: devotees book any allowed day
// from bookMinDays to bookMaxDays ahead, on its weekdays. Expressed as an
// ordinary release window for `today`, so the booking calendar, What's New
// and the Sevas page treat it like any other seva (create_booking's SQL
// applies the same rule).
export function withRequestWindow<T extends Seva>(seva: T, today: string): T {
  if (seva.frequency !== "request") return seva;
  const weekdays = seva.releaseWeekdays?.length ? seva.releaseWeekdays : null;
  return {
    ...seva,
    releaseStartDate: addDaysIso(today, seva.bookMinDays),
    releaseEndDate: addDaysIso(today, seva.bookMaxDays),
    releaseMode: weekdays ? "weekdays" : "range",
    releaseWeekdays: weekdays,
    releaseDates: null,
  };
}

// Same-day bookings close at 3 PM temple time (and, for sevas with time
// slots, once the day's last slot has started). create_booking enforces the
// same.
export const SAME_DAY_CUTOFF = "15:00";

export function todayStillBookable(seva: Pick<Seva, "slots">, nowHHMM: string) {
  if (nowHHMM >= SAME_DAY_CUTOFF) return false;
  const slots = seva.slots.filter((s) => s.isActive);
  return slots.length === 0 || slots.some((s) => s.startTime > nowHHMM);
}

// Whether tickets are released for this calendar date (ignores capacity and
// "not in the past" — callers apply those). Mirrors create_booking's SQL.
export function isReleasedOn(seva: ReleaseFields, iso: string) {
  if (!seva.releaseStartDate || !seva.releaseEndDate) return false;
  if (iso < seva.releaseStartDate || iso > seva.releaseEndDate) return false;
  if (seva.releaseMode === "weekdays") return (seva.releaseWeekdays ?? []).includes(dayOfWeek(iso));
  if (seva.releaseMode === "dates") return (seva.releaseDates ?? []).includes(iso);
  return true;
}

const WEEKDAY_REF = new Date(2024, 0, 7); // a Sunday

export function weekdayName(dow: number, locale: string, style: "long" | "short" = "long") {
  const d = new Date(WEEKDAY_REF);
  d.setDate(d.getDate() + dow);
  return d.toLocaleDateString(locale === "kn" ? "kn-IN" : "en-IN", { weekday: style });
}

// Human summary, e.g. "Saturdays & Sundays, 4 Oct – 30 Nov 2026".
export function describeRelease(seva: ReleaseFields, locale: string) {
  if (!seva.releaseStartDate || !seva.releaseEndDate) return "";
  const intl = locale === "kn" ? "kn-IN" : "en-IN";
  const fmt = (iso: string, withYear = true) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(intl, {
      day: "numeric",
      month: "short",
      ...(withYear ? { year: "numeric" } : {}),
    });
  };
  const span =
    seva.releaseStartDate === seva.releaseEndDate
      ? fmt(seva.releaseStartDate)
      : `${fmt(seva.releaseStartDate, false)} – ${fmt(seva.releaseEndDate)}`;
  const and = locale === "kn" ? " ಮತ್ತು " : " & ";

  if (seva.releaseMode === "dates") {
    const dates = [...(seva.releaseDates ?? [])].sort();
    if (dates.length <= 4) return dates.map((d) => fmt(d)).join(", ");
    return `${dates.length} ${locale === "kn" ? "ದಿನಾಂಕಗಳು" : "dates"}, ${span}`;
  }
  if (seva.releaseMode === "weekdays") {
    const days = [...(seva.releaseWeekdays ?? [])].sort().map((d) => weekdayName(d, locale));
    const list = days.length > 1 ? `${days.slice(0, -1).join(", ")}${and}${days.at(-1)}` : days.join("");
    return `${list} · ${span}`;
  }
  return span;
}
