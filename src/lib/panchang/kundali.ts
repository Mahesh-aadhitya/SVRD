// Janma kundali (birth chart) from a birth date, time and place:
// drik-ganita positions with the Chitrapaksha (Lahiri) ayanamsa, whole-sign
// houses from the sidereal lagna, the navamsa (D9), the birth panchanga and
// the Vimshottari dasha periods.
import { SiderealTime } from "astronomy-engine";
import {
  NAK,
  ayanamsa,
  computePanchang,
  grahaPositionsAt,
  karanaAt,
  mod360,
  nakshatraAt,
  tithiAt,
  yogaAt,
  type GrahaPosition,
  type PanchangLocation,
} from "./compute";
import type { GrahaKey } from "./names";

const DAY = 86_400_000;
const YEAR = 365.25 * DAY;
const deg = Math.PI / 180;

export type KundaliInput = { date: string; time: string; location: PanchangLocation };

export type Placement = { longitude: number; rashi: number; degreeInRashi: number; nakshatra: number; pada: number };

export type Dasha = { lord: GrahaKey; start: number; end: number; sub?: Dasha[] };

export type Kundali = {
  moment: number;
  lagna: Placement;
  grahas: (GrahaPosition & { house: number; navamsa: number })[];
  lagnaNavamsa: number;
  birth: {
    weekday: number; // Hindu weekday (the day runs sunrise to sunrise)
    tithi: number;
    nakshatra: number;
    pada: number;
    yoga: number;
    karana: number;
    moonRashi: number;
    sunRashi: number;
    masa: number;
    adhikaMasa: boolean;
    samvatsara: number;
  };
  dashas: Dasha[];
};

const placement = (longitude: number): Placement => {
  const nak = longitude / NAK;
  return {
    longitude,
    rashi: Math.floor(longitude / 30),
    degreeInRashi: longitude % 30,
    nakshatra: Math.floor(nak),
    pada: Math.floor((nak % 1) * 4) + 1,
  };
};

// Navamsa sign: each rashi split in nine, counted on from Mesha, Makara,
// Tula and Karkataka for fire, earth, air and water signs respectively.
export const navamsaOf = (longitude: number) => Math.floor((longitude * 9) / 30) % 12;

// Sidereal ascendant at a moment and place.
export function lagnaAt(t: number, lat: number, lon: number) {
  const date = new Date(t);
  const ramc = mod360(SiderealTime(date) * 15 + lon) * deg;
  const T = (t - Date.UTC(2000, 0, 1, 12)) / (36525 * DAY);
  const eps = (23.4392911 - 0.0130042 * T) * deg;
  const tropical = Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(lat * deg) * Math.sin(eps))) / deg;
  return mod360(tropical - ayanamsa(date));
}

// Vimshottari: lords in order from Ashwini's, with their years.
const DASHA_LORDS: GrahaKey[] = ["ketu", "venus", "sun", "moon", "mars", "rahu", "jupiter", "saturn", "mercury"];
const DASHA_YEARS: Record<GrahaKey, number> = { ketu: 7, venus: 20, sun: 6, moon: 10, mars: 7, rahu: 18, jupiter: 16, saturn: 19, mercury: 17 };

function subPeriods(lord: GrahaKey, start: number, end: number): Dasha[] {
  const span = end - start;
  const first = DASHA_LORDS.indexOf(lord);
  let t = start;
  return DASHA_LORDS.map((_, k) => {
    const sub = DASHA_LORDS[(first + k) % 9];
    const len = (span * DASHA_YEARS[sub]) / 120;
    const d = { lord: sub, start: t, end: t + len };
    t += len;
    return d;
  });
}

export function vimshottari(moonLongitude: number, birth: number): Dasha[] {
  const nak = Math.floor(moonLongitude / NAK);
  const elapsed = (moonLongitude % NAK) / NAK;
  const first = nak % 9;
  // The first dasha began before birth, by the part of the nakshatra already crossed.
  let start = birth - elapsed * DASHA_YEARS[DASHA_LORDS[first]] * YEAR;
  return Array.from({ length: 10 }, (_, k) => {
    const lord = DASHA_LORDS[(first + k) % 9];
    const end = start + DASHA_YEARS[lord] * YEAR;
    const d: Dasha = { lord, start, end, sub: subPeriods(lord, start, end) };
    start = end;
    return d;
  });
}

export function computeKundali({ date, time, location }: KundaliInput): Kundali {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const moment = Date.UTC(y, m - 1, d, hh, mm) - location.tzOffsetMin * 60_000;

  // The Hindu day begins at sunrise: before it, the birth belongs to the
  // previous day's panchanga (vara, masa…).
  let day = computePanchang(date, location);
  if (moment < day.sunrise) {
    const prev = new Date(Date.UTC(y, m - 1, d) - DAY).toISOString().slice(0, 10);
    day = computePanchang(prev, location);
  }

  const lagnaLon = lagnaAt(moment, location.lat, location.lon);
  const lagna = placement(lagnaLon);
  const grahas = grahaPositionsAt(moment).map((g) => ({
    ...g,
    house: ((g.rashi - lagna.rashi + 12) % 12) + 1,
    navamsa: navamsaOf(g.longitude),
  }));
  const moon = grahas.find((g) => g.key === "moon")!;
  const at = new Date(moment);

  return {
    moment,
    lagna,
    grahas,
    lagnaNavamsa: navamsaOf(lagnaLon),
    birth: {
      weekday: day.weekday,
      tithi: tithiAt(at),
      nakshatra: nakshatraAt(at),
      pada: moon.pada,
      yoga: yogaAt(at),
      karana: karanaAt(at),
      moonRashi: moon.rashi,
      sunRashi: grahas.find((g) => g.key === "sun")!.rashi,
      masa: day.masa,
      adhikaMasa: day.adhikaMasa,
      samvatsara: day.samvatsara,
    },
    dashas: vimshottari(moon.longitude, moment),
  };
}
