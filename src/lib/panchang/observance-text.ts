// Display names for observances (see ./rules), in English or Kannada.
import type { Observance } from "./rules";
import type { CalendarEntry } from "./year";
import { DHANURMASA } from "./dhanurmasa";
import {
  ADHIKA_EKADASHI_NAMES,
  EKADASHI,
  EKADASHI_NAMES,
  FESTIVALS,
  GRAHANA_NAMES,
  OBSERVANCES,
  RASHIS,
  SPECIAL_FESTIVALS,
  TEMPLE_UTSAVAS,
  TIRUMALA_EVENTS,
  TIRUNAKSHATRAMS,
  label,
} from "./names";

export function observanceName(o: Observance, locale: string): string {
  const L = (n: { en: string; kn: string }) => label(n, locale);
  switch (o.kind) {
    case "festival":
      return L(FESTIVALS.find((f) => f.masa === o.masa && f.tithi === o.tithi)!.name);
    case "utsava":
      return L(TEMPLE_UTSAVAS[o.key].name);
    case "ekadashi":
      return `${L(o.adhika ? ADHIKA_EKADASHI_NAMES[o.paksha] : EKADASHI_NAMES[o.masa][o.paksha])} ${L(EKADASHI)}`;
    case "vaikunthaEkadashi":
      return L(SPECIAL_FESTIVALS.vaikunthaEkadashi);
    case "shravana":
      return L(SPECIAL_FESTIVALS.shravana);
    case "dhanurmasa":
      return L(o.day === 1 ? DHANURMASA.begins : DHANURMASA.koodaraivalli);
    case "bhogi":
      return L(DHANURMASA.bhogi);
    case "tirunakshatram":
      return L(TIRUNAKSHATRAMS[o.index].name);
    case "sankranti":
      return o.rashi === 9 ? L(SPECIAL_FESTIVALS.makaraSankranti) : `${L(RASHIS[o.rashi])} ${L(OBSERVANCES.sankranti)}`;
    default:
      return L(OBSERVANCES[o.kind]);
  }
}

/** The name of anything listed in the year calendar. */
export function calendarEntryName(e: CalendarEntry, locale: string): string {
  const L = (n: { en: string; kn: string }) => label(n, locale);
  if (e.observance) return observanceName(e.observance, locale);
  if (e.tirumala) return L(TIRUMALA_EVENTS[e.tirumala]);
  if (e.special === "varamahalakshmi") return L(SPECIAL_FESTIVALS.varamahalakshmi);
  if (e.grahana) return `${L(GRAHANA_NAMES[e.grahana.type])} ${L(GRAHANA_NAMES[e.grahana.kind])}`;
  return "";
}
