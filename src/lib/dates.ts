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

export function formatIso(iso: string, locale: string, opts: Intl.DateTimeFormatOptions) {
  return parseIso(iso).toLocaleDateString(locale === "kn" ? "kn-IN" : "en-IN", opts);
}
