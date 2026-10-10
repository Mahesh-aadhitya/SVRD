import type { TempleTiming } from "./content-types";

// Which days a timings row covers, from its English label: "Sun – Fri",
// "Mon-Sat", "Saturday", "Sat & Sun", "Daily".
const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function coversWeekday(label: string, weekday: number) {
  const text = label.toLowerCase();
  if (/daily|every ?day|all days/.test(text)) return true;
  const found = [...text.matchAll(/(sun|mon|tue|wed|thu|fri|sat)[a-z]*/g)].map((m) => ({ day: DAYS.indexOf(m[1]), at: m.index ?? 0, end: (m.index ?? 0) + m[0].length }));
  if (found.length === 2 && /^\s*(–|—|-|to)\s*$/.test(text.slice(found[0].end, found[1].at))) {
    const [from, to] = [found[0].day, found[1].day];
    return from <= to ? weekday >= from && weekday <= to : weekday >= from || weekday <= to;
  }
  return found.some((f) => f.day === weekday);
}

export type Session = { open: string; close: string };

export function sessionsFor(timings: TempleTiming[], weekday: number): Session[] | null {
  const row = timings.find((t) => coversWeekday(t.day, weekday));
  if (!row) return null;
  return (row.sessions ?? []).filter((s) => s.open && s.close).sort((a, b) => a.open.localeCompare(b.open));
}

export const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export type HoursStatus =
  | { state: "open"; until: string }
  | { state: "closed"; opensAt: string; tomorrow: boolean }
  | { state: "closedToday" };

// Open or closed at `now`, in temple (India) time.
export function hoursStatus(timings: TempleTiming[], now: Date): HoursStatus | null {
  const ist = new Date(now.getTime() + 5.5 * 3600_000);
  const weekday = ist.getUTCDay();
  const nowMin = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  const today = sessionsFor(timings, weekday);
  if (today === null || !today.length) {
    if (!timings.some((t) => t.sessions?.length)) return null;
    return { state: "closedToday" };
  }
  const current = today.find((s) => nowMin >= minutes(s.open) && nowMin < minutes(s.close));
  if (current) return { state: "open", until: current.close };
  const next = today.find((s) => minutes(s.open) > nowMin);
  if (next) return { state: "closed", opensAt: next.open, tomorrow: false };
  const tomorrow = sessionsFor(timings, (weekday + 1) % 7);
  if (tomorrow?.length) return { state: "closed", opensAt: tomorrow[0].open, tomorrow: true };
  return { state: "closedToday" };
}

export function istWeekday(now: Date) {
  return new Date(now.getTime() + 5.5 * 3600_000).getUTCDay();
}

// Minutes since midnight, temple (India) time.
export function istMinutes(now: Date) {
  const ist = new Date(now.getTime() + 5.5 * 3600_000);
  return ist.getUTCHours() * 60 + ist.getUTCMinutes();
}
