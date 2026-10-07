// Temple timings: rows of days with one or more open sessions, edited in
// the admin and shown on the site. Plain module, safe for client bundles.
import type { TempleTiming } from "@/lib/content-types";

// Day labels the office picks from, in both languages.
export const DAY_PRESETS: { en: string; kn: string }[] = [
  { en: "Daily", kn: "ಪ್ರತಿದಿನ" },
  { en: "Mon – Fri", kn: "ಸೋಮ – ಶುಕ್ರ" },
  { en: "Mon – Sat", kn: "ಸೋಮ – ಶನಿ" },
  { en: "Sun – Fri", kn: "ಭಾನು – ಶುಕ್ರ" },
  { en: "Sat & Sun", kn: "ಶನಿ ಮತ್ತು ಭಾನು" },
  { en: "Sunday", kn: "ಭಾನುವಾರ" },
  { en: "Saturday", kn: "ಶನಿವಾರ" },
  { en: "Festival days", kn: "ಹಬ್ಬದ ದಿನಗಳು" },
  { en: "Dhanurmasa", kn: "ಧನುರ್ಮಾಸ" },
  { en: "Ekadashi", kn: "ಏಕಾದಶಿ" },
];

// "18:30" → "6:30 PM" / "ಸಂಜೆ 6:30"
export function formatClockTime(hhmm: string, locale: string) {
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
  const h12 = ((h + 11) % 12) + 1;
  const mm = String(m).padStart(2, "0");
  if (locale !== "kn") return `${h12}:${mm} ${h < 12 ? "AM" : "PM"}`;
  const part = h < 5 ? "ಬೆಳಗಿನ ಜಾವ" : h < 12 ? "ಬೆಳಿಗ್ಗೆ" : h < 16 ? "ಮಧ್ಯಾಹ್ನ" : h < 20 ? "ಸಂಜೆ" : "ರಾತ್ರಿ";
  return `${part} ${h12}:${mm}`;
}

export function timingHours(row: TempleTiming, locale: string) {
  if (!row.sessions?.length) return row.hours;
  return row.sessions.map((s) => `${formatClockTime(s.open, locale)} – ${formatClockTime(s.close, locale)}`).join(", ");
}

export const timingDay = (row: TempleTiming, locale: string) => (locale === "kn" && row.dayKn ? row.dayKn : row.day);
