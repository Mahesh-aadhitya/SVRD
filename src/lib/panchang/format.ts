// Display helpers for panchangam times, shown in the location's own UTC
// offset (not the viewer's device zone). Formatted by hand rather than with
// Intl so server and browser render byte-identical text (ICU builds differ
// in spacing and day-period words, which breaks hydration).
//
// Times are phrased the way a printed panchanga reads: relative to the
// panchanga day (sunrise to next sunrise) — "12:35 AM tonight",
// "tomorrow 7:20 AM" — and in Kannada with the part of the day
// ("ರಾತ್ರಿ 12:35", "ನಾಳೆ ಬೆಳಿಗ್ಗೆ 7:20").
import type { PanchangLocation } from "./compute";

const MONTHS = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  kn: ["ಜನವರಿ", "ಫೆಬ್ರವರಿ", "ಮಾರ್ಚ್", "ಏಪ್ರಿಲ್", "ಮೇ", "ಜೂನ್", "ಜುಲೈ", "ಆಗಸ್ಟ್", "ಸೆಪ್ಟೆಂಬರ್", "ಅಕ್ಟೋಬರ್", "ನವೆಂಬರ್", "ಡಿಸೆಂಬರ್"],
};

// The panchanga day a time is phrased against.
export type DayContext = { date: string; nextSunrise: number; location: PanchangLocation };

function shifted(ms: number, loc: PanchangLocation) {
  return new Date(ms + loc.tzOffsetMin * 60_000);
}

export function knDayPart(h: number) {
  if (h < 4) return "ರಾತ್ರಿ";
  if (h < 6) return "ಬೆಳಗಿನ ಜಾವ";
  if (h < 12) return "ಬೆಳಿಗ್ಗೆ";
  if (h < 16) return "ಮಧ್ಯಾಹ್ನ";
  if (h < 19) return "ಸಂಜೆ";
  return "ರಾತ್ರಿ";
}

function parts(ms: number, loc: PanchangLocation) {
  const d = shifted(ms, loc);
  const h = d.getUTCHours();
  const clock = `${h % 12 === 0 ? 12 : h % 12}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  return { d, h, clock, iso: d.toISOString().slice(0, 10) };
}

// A bare clock time with its part of day: "6:07 AM" / "ಬೆಳಿಗ್ಗೆ 6:07".
export function formatTime(ms: number, loc: PanchangLocation, locale: string) {
  const { h, clock } = parts(ms, loc);
  return locale === "kn" ? `${knDayPart(h)} ${clock}` : `${clock} ${h < 12 ? "AM" : "PM"}`;
}

// A time phrased against the panchanga day.
export function formatClock(ms: number, day: DayContext, locale: string) {
  const { h, iso } = parts(ms, day.location);
  const base = formatTime(ms, day.location, locale);
  if (iso === day.date) return base;
  if (iso < day.date) return locale === "kn" ? `ನಿನ್ನೆ ${base}` : `yesterday ${base}`;
  // Past midnight but before the next sunrise still belongs to tonight.
  if (ms < day.nextSunrise) return locale === "kn" ? base : `${base} ${h < 4 ? "tonight" : "(pre-dawn)"}`;
  return locale === "kn" ? `ನಾಳೆ ${base}` : `tomorrow ${base}`;
}

// "9:06 – 10:33 AM" / "ಬೆಳಿಗ್ಗೆ 9:06 – 10:33" when both ends share the part
// of day, otherwise both ends in full.
export function formatSpan(span: { start: number; end: number }, day: DayContext, locale: string) {
  const a = parts(span.start, day.location);
  const b = parts(span.end, day.location);
  const sameDay = a.iso === b.iso && a.iso === day.date;
  if (sameDay && locale === "kn" && knDayPart(a.h) === knDayPart(b.h)) return `${knDayPart(a.h)} ${a.clock} – ${b.clock}`;
  if (sameDay && locale !== "kn" && a.h < 12 === b.h < 12) return `${a.clock} – ${b.clock} ${a.h < 12 ? "AM" : "PM"}`;
  return `${formatClock(span.start, day, locale)} – ${formatClock(span.end, day, locale)}`;
}

// "6 October 2026"
export function formatLongDate(date: string, locale: string) {
  const [y, m, d] = date.split("-").map(Number);
  return `${d} ${(locale === "kn" ? MONTHS.kn : MONTHS.en)[m - 1]} ${y}`;
}

// Dinamana / ratrimana in hours and minutes.
export function formatDuration(ms: number, locale: string) {
  const mins = Math.round(ms / 60_000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return locale === "kn" ? `${h} ಗಂಟೆ ${m} ನಿಮಿಷ` : `${h} hr ${m} min`;
}

export function formatDegree(deg: number) {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  return `${d}°${String(m).padStart(2, "0")}′`;
}

export function shiftIsoDate(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

// Today's date at a location.
export function todayAt(loc: PanchangLocation) {
  return new Date(Date.now() + loc.tzOffsetMin * 60_000).toISOString().slice(0, 10);
}
