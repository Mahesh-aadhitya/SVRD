// Display names for observances (see ./rules), in English or Kannada.
import type { Observance } from "./rules";
import { DHANURMASA } from "./dhanurmasa";
import {
  ADHIKA_EKADASHI_NAMES,
  EKADASHI,
  EKADASHI_NAMES,
  FESTIVALS,
  OBSERVANCES,
  RASHIS,
  SPECIAL_FESTIVALS,
  TEMPLE_UTSAVAS,
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
