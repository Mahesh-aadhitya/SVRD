// The calendar date at the temple (IST), regardless of where the server runs.
export function todayInIndia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

// ── Client-safe ISO date helpers (yyyy-mm-dd strings compare correctly as
// plain strings, so no Date math is needed for ordering). ───────────────

export function isoFromDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Today in the viewer's local calendar.
// Temple (India) time now, "HH:MM".
export function nowInIndia() {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
}

export function localTodayIso() {
  return isoFromDate(new Date());
}

export function parseIso(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function maxIso(...dates: (string | null | undefined)[]) {
  return dates.filter((d): d is string => !!d).sort().at(-1) ?? null;
}

// Node (server) and Safari ship different ICU data, so one Intl call can word
// a date differently — "8 Oct, 2026" vs "8 Oct 2026", "7 Oct, 2:17 am" vs
// "7 Oct at 2:17 AM", narrow vs plain spaces — and React then throws away the
// server HTML and re-renders on the phone. Folding those known differences
// into one spelling keeps server and browser text identical.
export function stableIntl(text: string) {
  return text
    .replace(/[   ]/g, " ")
    .replace(/ at /g, ", ")
    .replace(/,\s+(\d{4})\b/g, " $1")
    .replace(/\b([ap])\.?m\.?(?=$|[\s,–-])/gi, (_, p: string) => `${p.toUpperCase()}M`);
}

export function formatIso(iso: string, locale: string, opts: Intl.DateTimeFormatOptions) {
  return stableIntl(parseIso(iso).toLocaleDateString(locale === "kn" ? "kn-IN" : "en-IN", opts));
}
