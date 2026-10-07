// Drik-ganita panchangam computed in-app with astronomy-engine — no external
// API. Longitudes are sidereal (Lahiri ayanamsa); day elements follow the
// South Indian convention of what prevails at local sunrise, with every
// change up to the next sunrise listed. Runs on the server and in the
// browser alike (the page recomputes when a visitor changes date/place).
import { Body, EclipticGeoMoon, Ecliptic, GeoVector, HelioVector, Observer, SearchMoonPhase, SearchRiseSet, SunPosition } from "astronomy-engine";
import type { GrahaKey } from "./names";
import { observancesFor, type Observance } from "./rules";

export type { Observance } from "./rules";

export type PanchangLocation = {
  name: string;
  lat: number;
  lon: number;
  // Minutes east of UTC; all times are shown in this offset.
  tzOffsetMin: number;
};

// The temple: Sri Varadaraja Swamy Devasthaanam, Kolar Fort, Kolar.
export const TEMPLE_LOCATION: PanchangLocation = {
  name: "Kolar",
  lat: 13.137,
  lon: 78.133,
  tzOffsetMin: 330,
};

/** The temple's own pin from the admin's Temple info, else Kolar. */
export function templeLocationFrom(info: { lat: number | null; lon: number | null } | null, name: string): PanchangLocation {
  return info?.lat != null && info.lon != null ? { name, lat: info.lat, lon: info.lon, tzOffsetMin: 330 } : TEMPLE_LOCATION;
}

// One run of a day element (tithi, nakshatra…) — `start`/`end` are epoch ms.
export type Segment = { index: number; start: number; end: number };
export type Span = { start: number; end: number };

export type GrahaPosition = {
  key: GrahaKey;
  longitude: number; // sidereal, 0–360
  rashi: number;
  degreeInRashi: number;
  nakshatra: number;
  pada: number; // 1–4
  retrograde: boolean;
  // Sidereal longitude seen from the Sun (Mercury–Saturn only), for the
  // Sun-centred model of the sky; the panchanga itself is geocentric.
  helioLongitude?: number;
};

export type PanchangDay = {
  date: string; // yyyy-mm-dd at the location
  location: PanchangLocation;
  weekday: number; // 0 = Sunday
  sunrise: number;
  sunset: number;
  nextSunrise: number;
  moonrise: number | null;
  moonset: number | null;
  tithi: Segment[];
  nakshatra: Segment[];
  yoga: Segment[];
  karana: Segment[];
  moonRashi: Segment[];
  paksha: 0 | 1;
  masa: number;
  adhikaMasa: boolean;
  ritu: number;
  ayana: 0 | 1;
  sunRashi: number;
  samvatsara: number;
  shakaYear: number;
  vikramYear: number;
  kaliYear: number;
  rahuKalam: Span;
  yamagandam: Span;
  gulikaKalam: Span;
  abhijit: Span;
  durmuhurtham: Span[];
  brahmaMuhurta: Span;
  grahas: GrahaPosition[];
  dhanurmasaDay: number | null;
  // Sidereal longitude of the Earth seen from the Sun.
  earthLongitude: number;
  observances: Observance[];
};

const DAY = 86_400_000;
const HOUR = 3_600_000;
export const NAK = 360 / 27;

export const mod360 = (x: number) => ((x % 360) + 360) % 360;

// Lahiri (Chitrapaksha) ayanamsa: 23°51′25.5″ at J2000 plus precession.
export function ayanamsa(t: Date) {
  const T = (t.getTime() - Date.UTC(2000, 0, 1, 12)) / (36525 * DAY);
  return 23.857092 + 1.396971 * T + 0.000308 * T * T;
}

const sunTropical = (t: Date) => SunPosition(t).elon;
const moonTropical = (t: Date) => EclipticGeoMoon(t).lon;
const sidereal = (tropical: number, t: Date) => mod360(tropical - ayanamsa(t));
export const sunSidereal = (t: Date) => sidereal(sunTropical(t), t);
export const moonSidereal = (t: Date) => sidereal(moonTropical(t), t);
const elongation = (t: Date) => mod360(moonTropical(t) - sunTropical(t));

// Mean ascending lunar node (Rahu), tropical.
function rahuTropical(t: Date) {
  const T = (t.getTime() - Date.UTC(2000, 0, 1, 12)) / (36525 * DAY);
  return mod360(125.04452 - 1934.136261 * T + 0.0020708 * T * T);
}

const PLANET_BODIES: Partial<Record<GrahaKey, Body>> = {
  mars: Body.Mars,
  mercury: Body.Mercury,
  jupiter: Body.Jupiter,
  venus: Body.Venus,
  saturn: Body.Saturn,
};

export function grahaSidereal(key: GrahaKey, t: Date) {
  switch (key) {
    case "sun":
      return sunSidereal(t);
    case "moon":
      return moonSidereal(t);
    case "rahu":
      return sidereal(rahuTropical(t), t);
    case "ketu":
      return sidereal(rahuTropical(t) + 180, t);
    default:
      return sidereal(Ecliptic(GeoVector(PLANET_BODIES[key]!, t, true)).elon, t);
  }
}

function helioSidereal(key: GrahaKey, t: Date) {
  const body = PLANET_BODIES[key];
  return body ? sidereal(Ecliptic(HelioVector(body, t)).elon, t) : undefined;
}

export const tithiAt = (t: Date) => Math.floor(elongation(t) / 12);
export const karanaAt = (t: Date) => Math.floor(elongation(t) / 6);
export const nakshatraAt = (t: Date) => Math.floor(moonSidereal(t) / NAK);
export const yogaAt = (t: Date) => Math.floor(mod360(sunSidereal(t) + moonSidereal(t)) / NAK);
const moonRashiAt = (t: Date) => Math.floor(moonSidereal(t) / 30);
export const sunRashiAt = (t: Date) => Math.floor(sunSidereal(t) / 30);

// First moment (within 30s) at which `fn` has changed value in (lo, hi].
function bisect(fn: (t: Date) => number, lo: number, hi: number) {
  const from = fn(new Date(lo));
  while (hi - lo > 30_000) {
    const mid = (lo + hi) / 2;
    if (fn(new Date(mid)) === from) lo = mid;
    else hi = mid;
  }
  return hi;
}

export const toMinute = (t: number) => Math.round(t / 60_000) * 60_000;

// The time `fn`'s current value at `t` began (searching back) or ends.
export function edge(fn: (t: Date) => number, t: number, dir: 1 | -1, stepMs: number, limitMs: number) {
  const value = fn(new Date(t));
  for (let s = stepMs; s <= limitMs; s += stepMs) {
    const probe = t + dir * s;
    if (fn(new Date(probe)) !== value) {
      return dir === 1 ? bisect(fn, probe - stepMs, probe) : bisect(fn, probe, probe + stepMs);
    }
  }
  return t + dir * limitMs;
}

// Every run of `fn` that overlaps [from, to), with true start/end times.
function segments(fn: (t: Date) => number, from: number, to: number, stepMs = HOUR): Segment[] {
  const out: Segment[] = [];
  let start = edge(fn, from, -1, stepMs, 3 * DAY);
  let cursor = from;
  while (cursor < to) {
    const index = fn(new Date(cursor));
    const end = edge(fn, cursor, 1, stepMs, 3 * DAY);
    out.push({ index, start: toMinute(start), end: toMinute(end) });
    start = end;
    cursor = end + 1000;
  }
  return out;
}

export function riseSet(body: Body, observer: Observer, direction: 1 | -1, from: number, limitDays: number) {
  const t = SearchRiseSet(body, observer, direction, new Date(from), limitDays);
  return t ? t.date.getTime() : null;
}

// Most recent new moon at or before `t`.
export function previousNewMoon(t: number) {
  let found = SearchMoonPhase(0, new Date(t - 32 * DAY), 32)!.date.getTime();
  for (;;) {
    const next = SearchMoonPhase(0, new Date(found + DAY), 32)!.date.getTime();
    if (next > t) return found;
    found = next;
  }
}

// Rahu/Yama/Gulika: which eighth of daylight, by weekday (Sunday first).
const RAHU_PART = [8, 2, 7, 5, 6, 4, 3];
const YAMA_PART = [5, 4, 3, 2, 1, 7, 6];
const GULIKA_PART = [7, 6, 5, 4, 3, 2, 1];
// Durmuhurtham: [day muhurta numbers (of 15), night muhurta numbers].
const DURMUHURTA: [number[], number[]][] = [
  [[14], []],
  [[9, 12], []],
  [[4], [7]],
  [[8], []],
  [[6, 12], []],
  [[4, 9], []],
  [[1, 2], []],
];

// Back-to-back spans (e.g. Saturday's two consecutive durmuhurthas) as one.
function mergeSpans(spans: Span[]) {
  return spans.reduce<Span[]>((out, s) => {
    const last = out.at(-1);
    if (last && Math.abs(last.end - s.start) < 60_000) last.end = s.end;
    else out.push({ ...s });
    return out;
  }, []);
}

// Sidereal positions of the nine grahas at a moment (epoch ms).
export function grahaPositionsAt(t: number): GrahaPosition[] {
  const at = new Date(t);
  return (["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"] as GrahaKey[]).map((key) => {
    const longitude = grahaSidereal(key, at);
    const later = grahaSidereal(key, new Date(t + 12 * HOUR));
    const motion = ((later - longitude + 540) % 360) - 180;
    const nakFloat = longitude / NAK;
    return {
      key,
      longitude,
      rashi: Math.floor(longitude / 30),
      degreeInRashi: longitude % 30,
      nakshatra: Math.floor(nakFloat),
      pada: Math.floor((nakFloat % 1) * 4) + 1,
      retrograde: key === "rahu" || key === "ketu" ? true : motion < 0,
      helioLongitude: helioSidereal(key, at),
    };
  });
}

// Day of Dhanurmasa at a sunrise: counted from the first sunrise with the
// Sun in Dhanu. Null outside the month.
export function dhanurmasaDayAt(sunrise: number) {
  if (sunRashiAt(new Date(sunrise)) !== 8) return null;
  let k = 1;
  while (k < 32 && sunRashiAt(new Date(sunrise - k * DAY)) === 8) k++;
  return k;
}

// Tithi at madhyahna, aparahna, pradosha and nishita of one day.
export function momentTithis(sunrise: number, sunset: number, nextSunrise: number) {
  return {
    noon: tithiAt(new Date((sunrise + sunset) / 2)),
    aparahna: tithiAt(new Date(sunrise + 0.7 * (sunset - sunrise))),
    sunset: tithiAt(new Date(sunset)),
    midnight: tithiAt(new Date((sunset + nextSunrise) / 2)),
  };
}

export function isValidIsoDate(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d && y >= 1900 && y <= 2100;
}

export function computePanchang(date: string, location: PanchangLocation): PanchangDay {
  const [y, m, d] = date.split("-").map(Number);
  const midnight = Date.UTC(y, m - 1, d) - location.tzOffsetMin * 60_000;
  const observer = new Observer(location.lat, location.lon, 0);

  // Fallbacks (6:00/18:00) only matter in polar latitudes.
  const sunrise = riseSet(Body.Sun, observer, 1, midnight, 1) ?? midnight + 6 * HOUR;
  const sunset = riseSet(Body.Sun, observer, -1, sunrise, 1) ?? midnight + 18 * HOUR;
  const nextSunrise = riseSet(Body.Sun, observer, 1, sunrise + HOUR, 2) ?? sunrise + DAY;
  const moonriseT = riseSet(Body.Moon, observer, 1, midnight, 1);
  const moonsetT = riseSet(Body.Moon, observer, -1, midnight, 1);
  const nextMidnight = midnight + DAY;
  const sr = new Date(sunrise);

  const tithi = segments(tithiAt, sunrise, nextSunrise);
  const tithiAtSunrise = tithi[0].index;
  const paksha = tithiAtSunrise < 15 ? 0 : 1;

  // Amanta masa: named from the Sun's rashi at the new moon that began it;
  // adhika when the Sun does not change rashi before the next new moon.
  const prevNm = previousNewMoon(sunrise);
  const nextNm = SearchMoonPhase(0, new Date(prevNm + DAY), 32)!.date.getTime();
  const rashiAtPrev = sunRashiAt(new Date(prevNm));
  const masa = (rashiAtPrev + 1) % 12;
  const adhikaMasa = rashiAtPrev === sunRashiAt(new Date(nextNm));

  const weekday = new Date(midnight + location.tzOffsetMin * 60_000).getUTCDay();
  const sunRashi = sunRashiAt(sr);

  // Shaka year turns at Ugadi (Chaitra); Jan–Apr dates still in Pushya,
  // Magha or Phalguna belong to the previous year.
  const shakaYear = m <= 4 && masa >= 9 ? y - 79 : y - 78;

  const dayLen = sunset - sunrise;
  const nightLen = nextSunrise - sunset;
  const eighth = dayLen / 8;
  const part = (n: number): Span => ({ start: sunrise + (n - 1) * eighth, end: sunrise + n * eighth });
  const dayMuhurta = dayLen / 15;
  const nightMuhurta = nightLen / 15;
  const [dayDur, nightDur] = DURMUHURTA[weekday];

  const grahas = grahaPositionsAt(sunrise);

  const nextRashi = sunRashiAt(new Date(nextSunrise));
  const dhanurmasaDay = dhanurmasaDayAt(sunrise);
  // Yesterday's sunrise is close enough to 24h earlier for these checks.
  const prevSunrise = new Date(sunrise - DAY);
  const observances: Observance[] = observancesFor({
    masa,
    adhikaMasa,
    tithis: tithi.map((s) => s.index),
    kshayaMasa: { masa: (sunRashiAt(new Date(nextNm)) + 1) % 12, adhikaMasa: false },
    prevTithi: tithiAt(prevSunrise),
    tithiAt: momentTithis(sunrise, sunset, nextSunrise),
    prevTithiAt: (() => {
      const prevRise = riseSet(Body.Sun, observer, 1, midnight - DAY, 1) ?? sunrise - DAY;
      return momentTithis(prevRise, riseSet(Body.Sun, observer, -1, prevRise, 1) ?? sunset - DAY, sunrise);
    })(),
    nextTithiAt: (() => {
      const nextSet = riseSet(Body.Sun, observer, -1, nextSunrise, 1) ?? sunset + DAY;
      return momentTithis(nextSunrise, nextSet, riseSet(Body.Sun, observer, 1, nextSet, 1) ?? nextSunrise + DAY);
    })(),
    tithiAtMoonrise: moonriseT ? tithiAt(new Date(moonriseT)) : null,
    nakshatraAtSunrise: nakshatraAt(sr),
    prevNakshatra: nakshatraAt(prevSunrise),
    sunRashi,
    sankranti:
      nextRashi !== sunRashi ? { rashi: nextRashi, at: toMinute(edge(sunRashiAt, sunrise, 1, 6 * HOUR, DAY + 6 * HOUR)) } : null,
    dhanurmasaDay,
    makaraTomorrow: nextRashi === 8 && sunRashiAt(new Date(nextSunrise + DAY)) === 9,
  });

  return {
    date,
    location,
    weekday,
    sunrise,
    sunset,
    nextSunrise,
    moonrise: moonriseT && moonriseT < nextMidnight ? moonriseT : null,
    moonset: moonsetT && moonsetT < nextMidnight ? moonsetT : null,
    tithi,
    nakshatra: segments(nakshatraAt, sunrise, nextSunrise),
    yoga: segments(yogaAt, sunrise, nextSunrise),
    karana: segments(karanaAt, sunrise, nextSunrise),
    moonRashi: segments(moonRashiAt, sunrise, nextSunrise),
    paksha,
    masa,
    adhikaMasa,
    ritu: Math.floor(masa / 2),
    // Traditional (sidereal) ayana: Uttarayana from Makara Sankranti.
    ayana: [9, 10, 11, 0, 1, 2].includes(sunRashi) ? 0 : 1,
    sunRashi,
    samvatsara: (shakaYear + 11) % 60,
    shakaYear,
    vikramYear: shakaYear + 135,
    kaliYear: shakaYear + 3179,
    rahuKalam: part(RAHU_PART[weekday]),
    yamagandam: part(YAMA_PART[weekday]),
    gulikaKalam: part(GULIKA_PART[weekday]),
    abhijit: { start: sunrise + 7 * dayMuhurta, end: sunrise + 8 * dayMuhurta },
    durmuhurtham: mergeSpans([
      ...dayDur.map((k) => ({ start: sunrise + (k - 1) * dayMuhurta, end: sunrise + k * dayMuhurta })),
      ...nightDur.map((k) => ({ start: sunset + (k - 1) * nightMuhurta, end: sunset + k * nightMuhurta })),
    ]),
    brahmaMuhurta: { start: sunrise - 96 * 60_000, end: sunrise - 48 * 60_000 },
    grahas,
    dhanurmasaDay,
    earthLongitude: mod360(sunSidereal(sr) + 180),
    observances,
  };
}

