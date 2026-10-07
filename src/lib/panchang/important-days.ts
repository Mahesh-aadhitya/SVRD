// Festivals and holy days over a span of dates, for marking calendars
// outside the panchangam (e.g. when the admin releases seva tickets).
import type { PanchangLocation } from "./compute";
import { calendarEntryName } from "./observance-text";
import { yearCalendar, type CalendarCategory, type CalendarEntry } from "./year";

export type ImportantDay = { name: string; category: CalendarCategory };

// Weekly-ish vratas and Tirumala's own calendar would crowd the marks.
function worthMarking(e: CalendarEntry) {
  if (e.category === "tirumala") return false;
  const kind = e.observance?.kind;
  return kind !== "pradosha" && kind !== "sankashti";
}

/** yyyy-mm-dd → what falls on it, for every day in [from, to] that has something. */
export function importantDaysBetween(from: string, to: string, loc: PanchangLocation, locale = "en"): Record<string, ImportantDay[]> {
  const out: Record<string, ImportantDay[]> = {};
  for (let year = Number(from.slice(0, 4)); year <= Number(to.slice(0, 4)); year++) {
    for (const e of yearCalendar(year, loc).entries) {
      if (e.date < from || e.date > to || !worthMarking(e)) continue;
      (out[e.date] ??= []).push({ name: calendarEntryName(e, locale), category: e.category });
    }
  }
  return out;
}
