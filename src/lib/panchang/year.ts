// Fast day-by-day scan of a date range — just the facts a calendar needs
// (tithi and nakshatra at sunrise, masa, observances), at a fraction of the
// cost of the full panchanga in ./compute — plus the yearly lists built
// from it: festivals, important days, grahanas, Tirumala events and our
// temple's utsavas.
import {
  Body,
  Horizon,
  Equator,
  NextLunarEclipse,
  NextLocalSolarEclipse,
  NextGlobalSolarEclipse,
  SearchGlobalSolarEclipse,
  Observer,
  SearchLocalSolarEclipse,
  SearchLunarEclipse,
  SearchMoonPhase,
  EclipseKind,
} from "astronomy-engine";
import { dhanurmasaDayAt, edge, momentTithis, nakshatraAt, riseSet, sunRashiAt, tithiAt, toMinute, type PanchangLocation } from "./compute";
import { observancesFor, type Observance } from "./rules";
import type { TirumalaKey } from "./names";

const DAY = 86_400_000;
const HOUR = 3_600_000;

export type DayLite = {
  date: string;
  weekday: number;
  sunrise: number;
  tithi: number; // at sunrise
  nakshatra: number; // at sunrise
  // At the morning Chakra Snanam hour (sunrise + 3½ h).
  nakshatraAtSnana: number;
  nakshatraAtSunset: number;
  masa: number;
  adhikaMasa: boolean;
  sunRashi: number;
  observances: Observance[];
};

const isoAt = (ms: number, loc: PanchangLocation) => new Date(ms + loc.tzOffsetMin * 60_000).toISOString().slice(0, 10);
const localMidnight = (iso: string, loc: PanchangLocation) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d) - loc.tzOffsetMin * 60_000;
};

// New moons covering [from, to], so each day finds its lunation quickly.
function newMoons(from: number, to: number) {
  const out: number[] = [];
  let t = SearchMoonPhase(0, new Date(from - 32 * DAY), 40)!.date.getTime();
  out.push(t);
  while (t < to + DAY) {
    t = SearchMoonPhase(0, new Date(t + DAY), 40)!.date.getTime();
    out.push(t);
  }
  return out;
}

/** Every day from `fromIso` to `toIso` inclusive. */
export function scanDays(fromIso: string, toIso: string, loc: PanchangLocation): DayLite[] {
  const observer = new Observer(loc.lat, loc.lon, 0);
  const start = localMidnight(fromIso, loc);
  const count = Math.round((localMidnight(toIso, loc) - start) / DAY) + 1;
  // Sunrises from the day before to three days after the range.
  const sunrises = Array.from({ length: count + 4 }, (_, i) => {
    const midnight = start + (i - 1) * DAY;
    return riseSet(Body.Sun, observer, 1, midnight, 1) ?? midnight + 6 * HOUR;
  });
  const moons = newMoons(sunrises[0], sunrises.at(-1)!);
  const lunation = (t: number) => {
    let i = moons.length - 2;
    while (i > 0 && moons[i] > t) i--;
    return { start: moons[i], end: moons[i + 1] };
  };

  const sunsets = sunrises.map((t) => riseSet(Body.Sun, observer, -1, t, 1) ?? t + 12 * HOUR);
  const tithiAtRise = sunrises.map((t) => tithiAt(new Date(t)));
  const nakAtRise = sunrises.map((t) => nakshatraAt(new Date(t)));
  const rashiAtRise = sunrises.map((t) => sunRashiAt(new Date(t)));

  return Array.from({ length: count }, (_, k) => {
    const i = k + 1;
    const sunrise = sunrises[i];
    const t0 = tithiAtRise[i];
    const t1 = tithiAtRise[i + 1];
    // At most one tithi can begin and end between two sunrises.
    const gap = (t1 - t0 + 30) % 30;
    const tithis = gap === 0 ? [t0] : gap === 2 ? [t0, (t0 + 1) % 30, t1] : [t0, t1];
    const sunset = sunsets[i];
    const midnight = start + k * DAY;
    const moonrise = riseSet(Body.Moon, observer, 1, midnight, 1);
    const { start: nmStart, end: nmEnd } = lunation(sunrise);
    const rashiAtNm = sunRashiAt(new Date(nmStart));
    const rashiAtNextNm = sunRashiAt(new Date(nmEnd));
    const masa = (rashiAtNm + 1) % 12;
    const adhikaMasa = rashiAtNm === rashiAtNextNm;
    const afterNext = moons[moons.indexOf(nmEnd) + 1];
    const sunRashi = rashiAtRise[i];
    const nextRashi = rashiAtRise[i + 1];
    const date = isoAt(midnight + 12 * HOUR, loc);
    return {
      date,
      weekday: new Date(midnight + 12 * HOUR + loc.tzOffsetMin * 60_000).getUTCDay(),
      sunrise,
      tithi: t0,
      nakshatra: nakAtRise[i],
      nakshatraAtSnana: nakshatraAt(new Date(sunrise + 3.5 * HOUR)),
      nakshatraAtSunset: nakshatraAt(new Date(sunset)),
      masa,
      adhikaMasa,
      sunRashi,
      observances: observancesFor({
        masa,
        adhikaMasa,
        tithis,
        kshayaMasa: {
          masa: (rashiAtNextNm + 1) % 12,
          adhikaMasa: afterNext !== undefined && rashiAtNextNm === sunRashiAt(new Date(afterNext)),
        },
        prevTithi: tithiAtRise[i - 1],
        tithiAt: momentTithis(sunrise, sunset, sunrises[i + 1]),
        prevTithiAt: momentTithis(sunrises[i - 1], sunsets[i - 1], sunrise),
        nextTithiAt: momentTithis(sunrises[i + 1], sunsets[i + 1], sunrises[i + 2]),
        tithiAtMoonrise: moonrise && moonrise < midnight + DAY ? tithiAt(new Date(moonrise)) : null,
        nakshatraAtSunrise: nakAtRise[i],
        prevNakshatra: nakAtRise[i - 1],
        sunRashi,
        sankranti:
          nextRashi !== sunRashi ? { rashi: nextRashi, at: toMinute(edge(sunRashiAt, sunrise, 1, 6 * HOUR, DAY + 6 * HOUR)) } : null,
        dhanurmasaDay: sunRashi === 8 ? dhanurmasaDayAt(sunrise) : null,
        makaraTomorrow: nextRashi === 8 && rashiAtRise[i + 2] === 9,
      }),
    };
  });
}

// ── Yearly lists ──────────────────────────────────────────────────────────

export type CalendarCategory = "temple" | "festival" | "important" | "tirunakshatram" | "tirumala" | "grahana";

export type CalendarEntry = {
  date: string;
  category: CalendarCategory;
  observance?: Observance;
  tirumala?: TirumalaKey;
  grahana?: Grahana;
  special?: "varamahalakshmi";
};

export type Grahana = {
  kind: "solar" | "lunar";
  type: "total" | "partial" | "annular" | "penumbral";
  peak: number;
  start?: number;
  end?: number;
  visible: boolean; // from the chosen location
  magnitude?: number; // solar: fraction of the Sun's diameter covered
};

const FESTIVAL_KINDS = new Set<Observance["kind"]>(["festival", "vaikunthaEkadashi", "dhanurmasa", "bhogi"]);

function categoryOf(o: Observance): CalendarCategory {
  if (o.kind === "utsava") return "temple";
  if (o.kind === "tirunakshatram") return "tirunakshatram";
  if (FESTIVAL_KINDS.has(o.kind) || (o.kind === "sankranti" && o.rashi === 9)) return "festival";
  return "important";
}

// Varamahalakshmi: the Friday before Shravana Purnima (in the bright half).
function varamahalakshmi(days: DayLite[]) {
  const out: string[] = [];
  days.forEach((d, i) => {
    if (d.masa !== 4 || d.adhikaMasa || d.weekday !== 5 || d.tithi >= 14) return;
    const nextFriday = days[i + 7];
    if (!nextFriday || nextFriday.masa !== 4 || nextFriday.tithi >= 14) out.push(d.date);
  });
  return out;
}

function tirumalaEvents(days: DayLite[]): { date: string; key: TirumalaKey }[] {
  const out: { date: string; key: TirumalaKey }[] = [];
  const add = (date: string | undefined, key: TirumalaKey) => date && out.push({ date, key });
  const shift = (i: number, n: number) => days[i + n]?.date;
  const has = (d: DayLite, kind: Observance["kind"], test: (o: Observance) => boolean = () => true) =>
    d.observances.some((o) => o.kind === kind && test(o));
  const fest = (d: DayLite, masa: number, tithi: number) =>
    has(d, "festival", (o) => o.kind === "festival" && o.masa === masa && o.tithi === tithi);
  // Koil Alwar Tirumanjanam: the Tuesday before a major festival.
  const tuesdayBefore = (i: number) => {
    for (let k = i - 1; k >= Math.max(0, i - 7); k--) if (days[k].weekday === 2) return days[k].date;
    return undefined;
  };

  days.forEach((d, i) => {
    const firstOf = (test: (x: DayLite) => boolean) => test(d) && !(days[i - 1] && test(days[i - 1]));
    if (fest(d, 0, 0)) {
      add(d.date, "ugadiAsthanam");
      add(tuesdayBefore(i), "koilAlwar");
    }
    if (fest(d, 0, 8)) add(d.date, "ramaNavami");
    if (!d.adhikaMasa && d.masa === 0 && firstOf((x) => x.masa === 0 && x.tithi === 12)) add(d.date, "vasantotsavam");
    if (!d.adhikaMasa && d.masa === 1 && firstOf((x) => x.masa === 1 && x.tithi === 9)) add(d.date, "padmavatiParinayam");
    if (!d.adhikaMasa && d.masa === 2 && firstOf((x) => x.masa === 2 && x.tithi === 12)) add(d.date, "jyeshtabhishekam");
    if (has(d, "sankranti", (o) => o.kind === "sankranti" && o.rashi === 3)) {
      // The Sun enters Karkataka during this day: Asthanam next morning.
      add(shift(i, 1), "anivaraAsthanam");
      add(tuesdayBefore(i + 1), "koilAlwar");
    }
    if (!d.adhikaMasa && d.masa === 4 && firstOf((x) => x.masa === 4 && x.tithi === 10)) add(d.date, "pavitrotsavam");
    if (fest(d, 4, 22)) {
      add(d.date, "gokulashtami");
      add(shift(i, 1), "utlotsavam");
    }
    // Srivari Brahmotsavam ends with Chakra Snanam on the first morning
    // Shravana nakshatra holds at the snana hour, in the solar month of
    // Kanya; it opens eight days earlier. (Matches TTD's 26 Sep 2023 and
    // 2 Oct 2025.) When that falls in Bhadrapada — in years with an adhika
    // masa — it is the Salakatla Brahmotsavam, and a second, Navaratri
    // Brahmotsavam follows in Ashvayuja, ending on its bright-half Shravana.
    const shravanaDay = (x: DayLite | undefined) => !!x && x.nakshatraAtSnana === 21;
    const firstShravana = shravanaDay(d) && !shravanaDay(days[i - 1]);
    const brahmotsavam = (start: TirumalaKey) => {
      add(shift(i, -8), start);
      if (start !== "navaratriStart") add(tuesdayBefore(i - 8), "koilAlwar");
      add(shift(i, -4), "garudaSeva");
      add(shift(i, -1), "rathotsavam");
      add(d.date, "chakraSnanam");
    };
    if (firstShravana && d.sunRashi === 5) brahmotsavam(d.masa === 5 ? "salakatlaStart" : "brahmotsavamStart");
    else if (firstShravana && d.masa === 6 && !d.adhikaMasa && d.tithi < 15) brahmotsavam("navaratriStart");
    if (fest(d, 6, 29)) add(d.date, "deepavaliAsthanam");
    if (d.masa === 7 && !d.adhikaMasa && firstShravana) add(d.date, "pushpayagam");
    // Karthigai month (Sun in Vrishchika): Deepam on Krittika star, and
    // Tiruchanur's Panchami Theertham on the bright-half Panchami.
    // (Krittika at sunrise or at dusk, when the lamp is lit; near Purnima.)
    if (firstOf((x) => x.sunRashi === 7 && (x.nakshatra === 2 || x.nakshatraAtSunset === 2) && x.tithi >= 11 && x.tithi <= 15)) {
      add(d.date, "karthikaDeepam");
    }
    if (firstOf((x) => x.sunRashi === 7 && x.tithi === 4)) add(d.date, "panchamiTheertham");
    if (has(d, "vaikunthaEkadashi")) {
      add(d.date, "vaikunthaDwaraDarshan");
      add(tuesdayBefore(i), "koilAlwar");
    }
    if (d.masa === 10 && !d.adhikaMasa && firstOf((x) => x.masa === 10 && x.tithi === 6)) add(d.date, "rathaSaptami");
    if (d.masa === 11 && !d.adhikaMasa && firstOf((x) => x.masa === 11 && x.tithi === 10)) add(d.date, "teppotsavam");
    if (has(d, "purnima")) add(d.date, "pournamiGaruda");
  });
  return out;
}

// Eclipses in [from, to), with what's seen from the location.
export function grahanas(from: number, to: number, loc: PanchangLocation): { date: string; grahana: Grahana }[] {
  const observer = new Observer(loc.lat, loc.lon, 0);
  const out: { date: string; grahana: Grahana }[] = [];
  const minutes = (m: number) => m * 60_000;

  for (let e = SearchLunarEclipse(new Date(from)); e.peak.date.getTime() < to; e = NextLunarEclipse(e.peak)) {
    const peak = e.peak.date.getTime();
    const type = e.kind === EclipseKind.Total ? "total" : e.kind === EclipseKind.Partial ? "partial" : "penumbral";
    // Seen if the Moon is above the horizon for any part of the (umbral) eclipse.
    const half = type === "penumbral" ? e.sd_penum : e.sd_partial;
    const visible = [-half, 0, half].some((m) => {
      const t = new Date(peak + minutes(m));
      const eq = Equator(Body.Moon, t, observer, true, true);
      return Horizon(t, observer, eq.ra, eq.dec, "normal").altitude > 0;
    });
    out.push({
      date: isoAt(peak, loc),
      grahana: { kind: "lunar", type, peak, start: peak - minutes(half), end: peak + minutes(half), visible },
    });
  }

  for (let e = SearchLocalSolarEclipse(new Date(from), observer); e.peak.time.date.getTime() < to; e = NextLocalSolarEclipse(e.peak.time, observer)) {
    const peak = e.peak.time.date.getTime();
    const visible = e.peak.altitude > 0 || e.partial_begin.altitude > 0 || e.partial_end.altitude > 0;
    out.push({
      date: isoAt(peak, loc),
      grahana: {
        kind: "solar",
        type: e.kind === EclipseKind.Total ? "total" : e.kind === EclipseKind.Annular ? "annular" : "partial",
        peak,
        start: e.partial_begin.time.date.getTime(),
        end: e.partial_end.time.date.getTime(),
        visible,
        magnitude: e.obscuration,
      },
    });
  }
  // Solar eclipses seen elsewhere on Earth, listed as not visible here.
  for (let e = SearchGlobalSolarEclipse(new Date(from)); e.peak.date.getTime() < to; e = NextGlobalSolarEclipse(e.peak)) {
    const peak = e.peak.date.getTime();
    if (out.some((o) => o.grahana.kind === "solar" && Math.abs(o.grahana.peak - peak) < DAY)) continue;
    const type = e.kind === EclipseKind.Total ? "total" : e.kind === EclipseKind.Annular ? "annular" : "partial";
    out.push({ date: isoAt(peak, loc), grahana: { kind: "solar", type, peak, visible: false } });
  }
  return out.sort((a, b) => a.grahana.peak - b.grahana.peak);
}

/** Everything worth listing in a Gregorian year, in date order. */
export function yearCalendar(year: number, loc: PanchangLocation): { days: DayLite[]; entries: CalendarEntry[] } {
  const days = scanDays(`${year}-01-01`, `${year}-12-31`, loc);
  // A little either side so events computed relative to a day (Brahmotsavam
  // eight days before Chakra Snanam…) near the year's edges aren't lost.
  const padded = [...scanDays(`${year - 1}-12-20`, `${year - 1}-12-31`, loc), ...days, ...scanDays(`${year + 1}-01-01`, `${year + 1}-01-10`, loc)];
  const inYear = (date: string) => date.startsWith(`${year}-`);

  const entries: CalendarEntry[] = [];
  for (const d of days) {
    for (const o of d.observances) entries.push({ date: d.date, category: categoryOf(o), observance: o });
  }
  for (const date of varamahalakshmi(padded).filter(inYear)) entries.push({ date, category: "festival", special: "varamahalakshmi" });
  for (const { date, key } of tirumalaEvents(padded)) if (inYear(date)) entries.push({ date, category: "tirumala", tirumala: key });
  const from = localMidnightOf(year, loc);
  for (const { date, grahana } of grahanas(from, localMidnightOf(year + 1, loc), loc)) {
    entries.push({ date, category: "grahana", grahana });
  }
  entries.sort((a, b) => a.date.localeCompare(b.date));
  return { days, entries };
}

const localMidnightOf = (year: number, loc: PanchangLocation) => localMidnight(`${year}-01-01`, loc);
