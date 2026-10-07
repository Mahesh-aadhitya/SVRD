// When each Alwar's and Acharya's tirunakshatram falls, from the same year
// scan the panchangam's calendars use.
import type { PanchangLocation } from "./compute";
import { yearCalendar } from "./year";

const cache = new Map<string, Map<number, string[]>>();

// Tirunakshatram index → its dates in a year (a star can come twice in a solar month).
function datesIn(year: number, loc: PanchangLocation) {
  const key = `${year}|${loc.lat}|${loc.lon}`;
  let byIndex = cache.get(key);
  if (!byIndex) {
    byIndex = new Map();
    for (const e of yearCalendar(year, loc).entries) {
      if (e.observance?.kind !== "tirunakshatram") continue;
      const i = e.observance.index;
      byIndex.set(i, [...(byIndex.get(i) ?? []), e.date]);
    }
    cache.set(key, byIndex);
  }
  return byIndex;
}

/** The next date (on or after `fromIso`) of a tirunakshatram, looking a year ahead. */
export function nextTirunakshatram(index: number, fromIso: string, loc: PanchangLocation): string | null {
  const year = Number(fromIso.slice(0, 4));
  for (const y of [year, year + 1]) {
    const next = (datesIn(y, loc).get(index) ?? []).find((d) => d >= fromIso);
    if (next) return next;
  }
  return null;
}
