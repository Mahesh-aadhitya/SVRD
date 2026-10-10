// Which festivals and vratas fall on a day, from a few facts about it.
// Shared by the full daily panchanga (./compute) and the fast year scan
// (./year), so the day view and the calendars always agree.
import { FESTIVALS, TEMPLE_UTSAVAS, TIRUNAKSHATRAMS, type TithiMoment, type UtsavaKey } from "./names";

export type Observance =
  | { kind: "festival"; masa: number; tithi: number }
  | { kind: "utsava"; key: UtsavaKey }
  | { kind: "ekadashi"; masa: number; paksha: 0 | 1; adhika: boolean }
  | { kind: "vaikunthaEkadashi" | "pradosha" | "sankashti" | "purnima" | "amavasya" | "shravana" }
  | { kind: "tirunakshatram"; index: number }
  | { kind: "dhanurmasa"; day: number }
  | { kind: "bhogi" }
  | { kind: "sankranti"; rashi: number; at: number };

export type DayFacts = {
  masa: number;
  adhikaMasa: boolean;
  // Tithis from sunrise to the next sunrise, in order: the first prevails
  // at sunrise, the last at the next sunrise, any between are kshaya
  // (begin and end within the day).
  tithis: number[];
  // The masa a kshaya tithi belongs to, when a new moon falls between it
  // and sunrise (e.g. a kshaya Prathama opening Chaitra — Ugadi).
  kshayaMasa: { masa: number; adhikaMasa: boolean };
  // Tithi prevailing at each of the day's moments.
  tithiAt: Record<Exclude<TithiMoment, "sunrise">, number>;
  // …and at the same moments the day before and after.
  prevTithiAt: Record<Exclude<TithiMoment, "sunrise">, number>;
  nextTithiAt: Record<Exclude<TithiMoment, "sunrise">, number>;
  // Tithi at the previous sunrise: a festival tithi that also prevailed at
  // yesterday's sunrise (vriddhi) was already kept yesterday.
  prevTithi: number;
  tithiAtMoonrise: number | null;
  nakshatraAtSunrise: number;
  prevNakshatra: number;
  // A star that begins and ends between this sunrise and the next.
  kshayaNakshatra: number | null;
  // Whether a star falls again on a later day of this solar month.
  starRecurs: (star: number) => boolean;
  sunRashi: number;
  // The rashi the Sun enters before the next sunrise, and when.
  sankranti: { rashi: number; at: number } | null;
  // Day of Dhanurmasa (1–30, counted from the first sunrise with the Sun
  // in Dhanu), or null outside it; and whether Makara Sankranti falls
  // tomorrow (making today Bhogi).
  dhanurmasaDay: number | null;
  makaraTomorrow: boolean;
};

// Tithis "of" this day: the one at sunrise (unless it was already at
// yesterday's sunrise) plus any kshaya tithi.
export function dayTithis(f: DayFacts) {
  const own = f.tithis[0] === f.prevTithi ? [] : [f.tithis[0]];
  return [...own, ...f.tithis.slice(1, -1)];
}

export function observancesFor(f: DayFacts): Observance[] {
  const out: Observance[] = [];
  const tithis = dayTithis(f);
  const has = (t: number) => tithis.includes(t);
  const kshaya = f.tithis.slice(1, -1);
  // Is `tithi` of `masa` (not adhika) kept today, reckoned at `at`?
  const keeps = (masa: number, tithi: number, at: TithiMoment = "sunrise") => {
    if (at !== "sunrise") {
      if (f.adhikaMasa || f.masa !== masa) return false;
      // Spanning the moment on two days, it's kept on the second.
      if (f.tithiAt[at] === tithi) return f.nextTithiAt[at] !== tithi;
      // A tithi that never spans its moment on either day is kept on the
      // day it prevails at sunrise.
      return has(tithi) && f.prevTithiAt[at] !== tithi;
    }
    if (kshaya.includes(tithi)) {
      const m = tithi < f.tithis[0] ? f.kshayaMasa : f;
      return !m.adhikaMasa && m.masa === masa;
    }
    return !f.adhikaMasa && f.masa === masa && has(tithi);
  };

  for (const [key, u] of Object.entries(TEMPLE_UTSAVAS) as [UtsavaKey, (typeof TEMPLE_UTSAVAS)[UtsavaKey]][]) {
    if (keeps(u.masa, u.tithi)) out.push({ kind: "utsava", key });
  }
  for (const fest of FESTIVALS) {
    if (keeps(fest.masa, fest.tithi, fest.at)) out.push({ kind: "festival", masa: fest.masa, tithi: fest.tithi });
  }

  // Vaikuntha Ekadashi: the Shukla Ekadashi while the Sun is in Dhanu.
  if (has(10) && f.sunRashi === 8) out.push({ kind: "vaikunthaEkadashi" });
  else if (has(10)) out.push({ kind: "ekadashi", masa: f.masa, paksha: 0, adhika: f.adhikaMasa });
  if (has(25)) out.push({ kind: "ekadashi", masa: f.masa, paksha: 1, adhika: f.adhikaMasa });

  if (f.tithiAt.sunset === 12 || f.tithiAt.sunset === 27) out.push({ kind: "pradosha" });
  if (f.tithiAtMoonrise === 18) out.push({ kind: "sankashti" });
  if (has(14)) out.push({ kind: "purnima" });
  if (has(29)) out.push({ kind: "amavasya" });

  // Nakshatra-based days count the star at sunrise (first day if it spans two).
  if (f.nakshatraAtSunrise !== f.prevNakshatra) {
    if (f.nakshatraAtSunrise === 21) out.push({ kind: "shravana" });
  }

  // Tirunakshatrams: the day the star prevails at sunrise (the first, if it
  // spans two), or the day it falls wholly within when it prevails at no
  // sunrise. A star that comes twice in the solar month is kept on its
  // second day — the tradition's rule.
  const stars = [
    ...(f.nakshatraAtSunrise !== f.prevNakshatra ? [f.nakshatraAtSunrise] : []),
    ...(f.kshayaNakshatra !== null ? [f.kshayaNakshatra] : []),
  ];
  for (const star of stars) {
    const keyed = TIRUNAKSHATRAMS.flatMap((tn, index) => (tn.rashi === f.sunRashi && tn.nakshatra === star ? [index] : []));
    if (keyed.length && !f.starRecurs(star)) keyed.forEach((index) => out.push({ kind: "tirunakshatram", index }));
  }

  if (f.dhanurmasaDay === 1 || f.dhanurmasaDay === 27) out.push({ kind: "dhanurmasa", day: f.dhanurmasaDay });
  if (f.makaraTomorrow) out.push({ kind: "bhogi" });

  if (f.sankranti) out.push({ kind: "sankranti", ...f.sankranti });
  return out;
}
