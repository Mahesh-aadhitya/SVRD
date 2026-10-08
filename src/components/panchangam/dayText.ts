"use client";

import { useTranslations } from "next-intl";
import type { PanchangDay, Segment } from "@/lib/panchang/compute";
import { formatClock, formatLongDate, formatSpan, formatTime } from "@/lib/panchang/format";
import { observanceName } from "@/lib/panchang/observance-text";
import { verseLines, type Verse } from "@/lib/panchang/verses";
import { DHANURMASA } from "@/lib/panchang/dhanurmasa";
import {
  ADHIKA,
  AYANAS,
  MASAS,
  NAKSHATRA_NAMES,
  PAKSHAS,
  RASHIS,
  RITUS,
  SAMVATSARAS,
  VARAS,
  YOGAS,
  karanaName,
  label,
  tithiName,
} from "@/lib/panchang/names";

/** Localized wording for a computed day, shared by the page, share card and WhatsApp message. */
export function useDayText(day: PanchangDay, locale: string) {
  const t = useTranslations("panchangam");
  const L = (n: { en: string; kn: string }) => label(n, locale);
  const at = (ms: number) => formatClock(ms, day, locale);
  const span = (s: { start: number; end: number }) => formatSpan(s, day, locale);
  const time = (ms: number | null) => (ms ? formatTime(ms, day.location, locale) : t("none"));

  // Tithis are named without their paksha, as a printed panchanga lists them.
  const tithi = (i: number) => L(tithiName(i));
  const nakshatra = (i: number) => L(NAKSHATRA_NAMES[i]);
  const yoga = (i: number) => L(YOGAS[i]);
  const karana = (i: number) => L(karanaName(i));
  const rashi = (i: number) => L(RASHIS[i]);
  const pakshaShort = L(PAKSHAS[day.paksha]).split(" ")[0];

  // "Ekadashi till 12:35 AM tonight, then Dwadashi"
  const segments = (segs: Segment[], name: (i: number) => string) =>
    segs
      .map((s, i) =>
        i === segs.length - 1 && s.end >= day.nextSunrise && i > 0
          ? t("then", { name: name(s.index) })
          : s.end >= day.nextSunrise
            ? name(s.index)
            : t("until", { name: name(s.index), time: at(s.end) }),
      )
      .join(", ");

  const masaName = `${day.adhikaMasa ? `${L(ADHIKA)} ` : ""}${L(MASAS[day.masa])}`;
  // The sankalpa-style line that opens a traditional panchanga.
  const sankalpa = t("sankalpa", {
    samvatsara: L(SAMVATSARAS[day.samvatsara]),
    // Locative: Dakshinayana → Dakshinayane / ದಕ್ಷಿಣಾಯನ → ದಕ್ಷಿಣಾಯನೇ.
    ayana: locale === "kn" ? `${L(AYANAS[day.ayana])}ೇ` : L(AYANAS[day.ayana]).replace(/a$/, "e"),
    ritu: L(RITUS[day.ritu]),
    masa: masaName,
    paksha: pakshaShort,
  });

  // Our temple's own utsavas first.
  const observances = [...day.observances]
    .sort((a, b) => Number(b.kind === "utsava") - Number(a.kind === "utsava"))
    .map((o) =>
      o.kind === "sankranti" && o.rashi !== 9
        ? t("sankrantiAt", { rashi: rashi(o.rashi), time: at(o.at) })
        : observanceName(o, locale),
    );
  const utsavas = day.observances.flatMap((o) => (o.kind === "utsava" ? [o.key] : []));

  const vara = L(VARAS[day.weekday]);
  const dhanurmasaLine = day.dhanurmasaDay
    ? `${L(DHANURMASA.name)} · ${t("dhanurmasa.day", { day: day.dhanurmasaDay })} · ${t("dhanurmasa.pasuram", { n: Math.min(day.dhanurmasaDay, 30) })}`
    : "";
  const longDate = formatLongDate(day.date, locale);

  // The full panchanga as a WhatsApp message (WhatsApp renders *bold*).
  const message = (siteTitle: string, placeName: string, verse?: Verse) =>
    [
      `🙏 *${siteTitle}*`,
      `*${t("pageTitle")} · ${longDate}, ${vara}*`,
      "",
      `_${sankalpa}_`,
      "",
      `*${t("tithi")}:* ${segments(day.tithi, tithi)}`,
      `*${t("nakshatra")}:* ${segments(day.nakshatra, nakshatra)}`,
      `*${t("yoga")}:* ${segments(day.yoga, yoga)}`,
      `*${t("karana")}:* ${segments(day.karana, karana)}`,
      `*${t("moonRashi")}:* ${segments(day.moonRashi, rashi)}`,
      "",
      `☀️ ${t("sunrise")} ${time(day.sunrise)} · ${t("sunset")} ${time(day.sunset)}`,
      `🌙 ${t("moonrise")} ${time(day.moonrise)} · ${t("moonset")} ${time(day.moonset)}`,
      "",
      `✅ *${t("abhijit")}:* ${span(day.abhijit)}`,
      `⛔ *${t("rahuKalam")}:* ${span(day.rahuKalam)}`,
      `⛔ *${t("yamagandam")}:* ${span(day.yamagandam)}`,
      `⛔ *${t("gulikaKalam")}:* ${span(day.gulikaKalam)}`,
      ...(observances.length ? ["", ...observances.map((o) => `🪔 *${o}*`)] : []),
      ...(day.dhanurmasaDay ? ["", `🌅 *${dhanurmasaLine}*`] : []),
      ...(verse
        ? [
            "",
            `📿 *${t("verseOfDay")} · ${L(verse.source)}*`,
            // WhatsApp italics only span one line, so mark each line.
            ...verseLines(verse, locale).flatMap((l, i) => [...(i ? [""] : []), ...l.text.split("\n").map((line) => `_${line}_`)]),
            "",
            `${t("meaningIn.kn")}: ${verse.meaning.kn}`,
            `${t("meaningIn.en")}: ${verse.meaning.en}`,
          ]
        : []),
      "",
      `📍 ${t("timesFor", { place: placeName })}`,
    ].join("\n");

  return { tithi, nakshatra, yoga, karana, rashi, segments, at, span, time, masaName, pakshaShort, sankalpa, observances, utsavas, vara, longDate, dhanurmasaLine, message };
}
