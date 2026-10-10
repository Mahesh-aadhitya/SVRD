"use client";

import { useEffect, useMemo, useState } from "react";
import ShareButton from "@/components/ShareButton";
import { Link } from "@/i18n/navigation";
import ZoomablePortrait from "@/components/acharya/ZoomablePortrait";
import { NO_UPLOADS, acharyaForTirunakshatram, acharyaPath, mediaFor, type AcharyaUploads } from "@/lib/panchang/acharyas";
import { useTranslations } from "next-intl";
import type { PanchangLocation } from "@/lib/panchang/compute";
import { formatTime } from "@/lib/panchang/format";
import { calendarEntryName } from "@/lib/panchang/observance-text";
import {
  MASAS,
  NAKSHATRA_NAMES,
  PAKSHAS,
  TEMPLE_UTSAVAS,
  label,
  tithiName,
} from "@/lib/panchang/names";
import { yearCalendar, type CalendarCategory, type CalendarEntry, type DayLite } from "@/lib/panchang/year";
import { stableIntl } from "@/lib/dates";

export type ListTab = Exclude<CalendarCategory, "temple">;

// (Map.groupBy is too new for older Safari.)
function groupBy<T>(items: T[], key: (item: T) => string) {
  const out = new Map<string, T[]>();
  for (const item of items) out.set(key(item), [...(out.get(key(item)) ?? []), item]);
  return out;
}

const glass =
  "rounded-3xl border border-white/10 bg-[#0b0820]/70 shadow-[0_0_40px_rgba(90,70,220,0.18)] backdrop-blur-md";

// One year's calendar per (year, place), shared by the tabs.
export function useYearCalendar(year: number, location: PanchangLocation) {
  return useMemo(() => yearCalendar(year, location), [year, location]);
}

export const entryName = calendarEntryName;

const fmtDate = (iso: string, locale: string, opts: Intl.DateTimeFormatOptions) => {
  const [y, m, d] = iso.split("-").map(Number);
  return stableIntl(new Intl.DateTimeFormat(locale === "kn" ? "kn-IN" : "en-IN", { timeZone: "UTC", ...opts }).format(new Date(Date.UTC(y, m - 1, d))));
};

const tithiLabel = (d: DayLite, locale: string) => {
  const t = d.tithi;
  const paksha = t === 14 || t === 29 ? "" : `${label(PAKSHAS[t < 15 ? 0 : 1], locale).split(" ")[0]} `;
  return `${paksha}${label(tithiName(t), locale)}`;
};

const CATEGORY_STYLE: Record<CalendarCategory, string> = {
  temple: "border-amber-300/70 bg-gradient-to-r from-amber-300/25 to-orange-400/20 text-amber-50",
  tirunakshatram: "border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-100",
  festival: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  important: "border-sky-300/25 bg-sky-300/10 text-sky-100",
  tirumala: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  grahana: "border-rose-300/30 bg-rose-400/10 text-rose-100",
};
const CATEGORY_DOT: Record<CalendarCategory, string> = {
  temple: "bg-amber-300",
  tirunakshatram: "bg-fuchsia-300",
  festival: "bg-orange-400",
  important: "bg-sky-300",
  tirumala: "bg-emerald-300",
  grahana: "bg-rose-400",
};

function YearNav({ year, onYear }: { year: number; onYear: (y: number) => void }) {
  const t = useTranslations("panchangam");
  return (
    <div className="flex items-center justify-center gap-2">
      <button type="button" onClick={() => onYear(year - 1)} className={navBtn} aria-label={t("prevYear")}>
        ‹
      </button>
      <span className="font-display min-w-[5rem] text-center text-xl text-amber-100">{year}</span>
      <button type="button" onClick={() => onYear(year + 1)} className={navBtn} aria-label={t("nextYear")}>
        ›
      </button>
    </div>
  );
}

const navBtn = "rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-white/90 backdrop-blur hover:bg-white/10";

// ── Lists: festivals, important days, grahanas, Tirumala ─────────────────

// "All" is the default but sits last, as in every filter row on the site.
const IMPORTANT_FILTERS = ["ekadashi", "moon", "pradosha", "sankashti", "shravana", "sankranti", "all"] as const;
type ImportantFilter = (typeof IMPORTANT_FILTERS)[number];

function matchesImportant(e: CalendarEntry, f: ImportantFilter) {
  const k = e.observance?.kind;
  switch (f) {
    case "all":
      return true;
    case "ekadashi":
      return k === "ekadashi";
    case "moon":
      return k === "purnima" || k === "amavasya";
    default:
      return k === f;
  }
}

export function CalendarList({
  tab,
  year,
  onYear,
  location,
  locale,
  placeName,
  onPick,
  acharyaMedia = NO_UPLOADS,
}: {
  tab: ListTab;
  year: number;
  onYear: (y: number) => void;
  location: PanchangLocation;
  locale: string;
  placeName: string;
  onPick: (date: string) => void;
  acharyaMedia?: AcharyaUploads;
}) {
  const t = useTranslations("panchangam");
  const { days, entries } = useYearCalendar(year, location);
  const [filter, setFilter] = useState<ImportantFilter>("all");
  const dayOf = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);

  // Our temple's utsavas lead the festival list.
  const utsavas = entries.filter((e) => e.category === "temple");
  const shown = entries.filter(
    (e) =>
      (tab === "festival" ? e.category === "festival" : e.category === tab) &&
      (tab !== "important" || matchesImportant(e, filter)) &&
      // The monthly Pournami Garuda Seva would crowd out the annual
      // utsavas here; it still shows on the month view.
      e.tirumala !== "pournamiGaruda",
  );
  const byMonth = groupBy(shown, (e) => e.date.slice(0, 7));

  // Open on the current month (or the next one with anything in it) in
  // the current year, rather than at January.
  const [thisMonth] = useState(() => new Date(Date.now() + location.tzOffsetMin * 60_000).toISOString().slice(0, 7));
  const target = year === Number(thisMonth.slice(0, 4)) ? [...byMonth.keys()].find((m) => m >= thisMonth) : undefined;
  useEffect(() => {
    if (!target) return;
    const el = document.getElementById(`month-${target}`);
    // After the tab's layout settles.
    const id = requestAnimationFrame(() => el?.scrollIntoView({ behavior: "smooth", block: "start" }));
    return () => cancelAnimationFrame(id);
  }, [target, tab]);

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 pb-8 sm:px-6">
      <YearNav year={year} onYear={onYear} />

      {tab === "festival" && utsavas.length ? (
        <section className={`${glass} overflow-hidden border-amber-300/40 p-5`}>
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- small static emblem */}
            <img src="/images/emblem-naamam.png" alt="" className="h-12 w-auto" />
            <div>
              <p className="text-xs uppercase tracking-widest text-amber-200/80">{t("ourTemple")}</p>
              <h2 className="font-display text-lg text-amber-100">{t("templeUtsavas")}</h2>
            </div>
          </div>
          <ul className="mt-3 space-y-2">
            {utsavas.map((e) => {
              const u = e.observance?.kind === "utsava" ? TEMPLE_UTSAVAS[e.observance.key] : null;
              return (
                <li key={`${e.date}-${entryName(e, locale)}`} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onPick(e.date)}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition hover:brightness-110 ${CATEGORY_STYLE.temple}`}
                  >
                    <DateBadge iso={e.date} locale={locale} withMonth />
                    <span className="min-w-0">
                      <span className="block font-semibold">{entryName(e, locale)}</span>
                      {u ? <span className="block text-xs text-amber-100/70">{label(u.rule, locale)}</span> : null}
                    </span>
                  </button>
                  <ShareButton
                    compact
                    tone="dark"
                    title={entryName(e, locale)}
                    text={`${t("ourTemple")}\n${fmtDate(e.date, locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}${u ? ` · ${label(u.rule, locale)}` : ""}`}
                    path={`/panchangam?date=${e.date}`}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {tab === "important" ? (
        <div className="flex flex-wrap justify-center gap-2">
          {IMPORTANT_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 text-xs ${
                filter === f ? "border-amber-300/60 bg-amber-300/15 text-amber-100" : "border-white/15 text-white/70 hover:bg-white/10"
              }`}
            >
              {t(`filter.${f}`)}
            </button>
          ))}
        </div>
      ) : null}

      {tab === "tirunakshatram" ? (
        <p className="text-center text-xs text-fuchsia-100/70">
          <Link href="/panchangam/acharya" className="underline-offset-2 hover:underline">
            {t("acharya.all")} →
          </Link>
        </p>
      ) : null}
      {tab === "tirumala" ? <p className="text-center text-xs text-emerald-100/60">{t("tirumalaNote")}</p> : null}
      {tab === "grahana" ? <p className="text-center text-xs text-rose-100/60">{t("grahanaNote", { place: placeName })}</p> : null}

      {shown.length === 0 ? <p className={`${glass} p-6 text-center text-sm text-indigo-100/60`}>{t("nothingThisYear")}</p> : null}

      {[...byMonth].map(([month, list]) => (
        <section key={month} id={`month-${month}`} className={`${glass} scroll-mt-20 p-4 sm:p-5`}>
          <h3 className="font-display mb-2 text-lg text-amber-200">{fmtDate(`${month}-01`, locale, { month: "long", year: "numeric" })}</h3>
          <ul className="divide-y divide-white/5">
            {list.map((e, i) => {
              const d = dayOf.get(e.date);
              const acharya = e.observance?.kind === "tirunakshatram" ? acharyaForTirunakshatram(e.observance.index) : undefined;
              if (acharya) {
                const name = label(acharya.name, locale);
                return (
                  <li key={`${e.date}-${i}`} className="flex items-center gap-2">
                    <Link href={acharyaPath(acharya.slug)} className="flex w-full min-w-0 items-center gap-3 py-2.5 text-left transition hover:bg-white/5">
                      <DateBadge iso={e.date} locale={locale} />
                      <ZoomablePortrait name={name} imageUrl={mediaFor(acharya, acharyaMedia).imageUrl} fullImageUrl={mediaFor(acharya, acharyaMedia).imageFullUrl} size={40} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-white/95">{entryName(e, locale)}</span>
                        <span className="line-clamp-1 text-xs text-fuchsia-100/70">{label(acharya.summary, locale)}</span>
                        <span className="block text-[11px] font-semibold text-amber-200">{t("acharya.knowMore")} →</span>
                      </span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => onPick(e.date)}
                      aria-label={t("acharya.openDay")}
                      title={t("acharya.openDay")}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-amber-100 hover:bg-white/15"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <rect x="3" y="5" width="18" height="16" rx="2" />
                        <path d="M3 10h18M8 3v4M16 3v4" />
                      </svg>
                    </button>
                    <ShareButton
                      compact
                      tone="dark"
                      title={`🙏 ${name}`}
                      text={`${t("acharya.tirunakshatram")}: ${fmtDate(e.date, locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}\n${label(acharya.summary, locale)}`}
                      path={acharyaPath(acharya.slug)}
                      imageUrl={mediaFor(acharya, acharyaMedia).imageUrl ?? undefined}
                    />
                  </li>
                );
              }
              return (
                <li key={`${e.date}-${i}`} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onPick(e.date)}
                    className="flex w-full items-start gap-3 py-2.5 text-left transition hover:bg-white/5"
                  >
                    <DateBadge iso={e.date} locale={locale} />
                    <span className="min-w-0 flex-1">
                      <span className={`block ${e.category === "grahana" && !e.grahana?.visible ? "text-white/60" : "text-white/95"}`}>
                        {entryName(e, locale)}
                      </span>
                      {e.grahana ? (
                        <GrahanaDetail entry={e} location={location} locale={locale} placeName={placeName} />
                      ) : d ? (
                        <span className="block text-xs text-indigo-100/55">
                          {tithiLabel(d, locale)} · {label(NAKSHATRA_NAMES[d.nakshatra], locale)} · {label(MASAS[d.masa], locale)}
                        </span>
                      ) : null}
                    </span>
                  </button>
                  <ShareButton
                    compact
                    tone="dark"
                    title={entryName(e, locale)}
                    text={`${fmtDate(e.date, locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}${
                      d ? `\n${tithiLabel(d, locale)} · ${label(NAKSHATRA_NAMES[d.nakshatra], locale)} · ${label(MASAS[d.masa], locale)}` : ""
                    }`}
                    path={`/panchangam?date=${e.date}`}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function DateBadge({ iso, locale, withMonth }: { iso: string; locale: string; withMonth?: boolean }) {
  return (
    <span className="flex w-14 shrink-0 flex-col items-center rounded-xl border border-white/10 bg-white/5 py-1 leading-tight">
      {withMonth ? <span className="text-[10px] uppercase text-amber-200/80">{fmtDate(iso, locale, { month: "short" })}</span> : null}
      <span className="text-lg font-semibold text-amber-100">{Number(iso.slice(8))}</span>
      <span className="text-[10px] uppercase text-indigo-100/60">{fmtDate(iso, locale, { weekday: "short" })}</span>
    </span>
  );
}

function GrahanaDetail({
  entry,
  location,
  locale,
  placeName,
}: {
  entry: CalendarEntry;
  location: PanchangLocation;
  locale: string;
  placeName: string;
}) {
  const t = useTranslations("panchangam");
  const g = entry.grahana!;
  const time = (ms: number) => formatTime(ms, location, locale);
  return (
    <span className="block text-xs text-indigo-100/60">
      {g.visible ? (
        <span className="mr-1 rounded bg-rose-400/20 px-1.5 text-rose-100">{t("visibleHere", { place: placeName })}</span>
      ) : (
        <span className="mr-1 rounded bg-white/10 px-1.5">{t("notVisibleHere", { place: placeName })}</span>
      )}
      {g.start && g.end ? t("grahanaTimes", { start: time(g.start), peak: time(g.peak), end: time(g.end) }) : t("grahanaPeak", { peak: time(g.peak) })}
      {g.magnitude ? ` · ${t("obscuration", { pct: Math.round(g.magnitude * 100) })}` : ""}
      {g.type === "penumbral" ? ` · ${t("penumbralNote")}` : ""}
    </span>
  );
}

// ── Month view ────────────────────────────────────────────────────────────

export function MonthView({
  month,
  onMonth,
  selected,
  today,
  location,
  locale,
  onPick,
}: {
  month: string; // yyyy-mm
  onMonth: (m: string) => void;
  selected: string;
  today: string;
  location: PanchangLocation;
  locale: string;
  onPick: (date: string) => void;
}) {
  const t = useTranslations("panchangam");
  const year = Number(month.slice(0, 4));
  const { days, entries } = useYearCalendar(year, location);
  const monthDays = days.filter((d) => d.date.startsWith(month));
  const entriesOn = useMemo(() => groupBy(entries, (e) => e.date), [entries]);
  const lead = monthDays[0]?.weekday ?? 0;
  const shift = (n: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 1 + n, 1));
    onMonth(d.toISOString().slice(0, 7));
  };
  const weekdays = Array.from({ length: 7 }, (_, i) => fmtDate(`2026-10-${String(4 + i).padStart(2, "0")}`, locale, { weekday: "short" }));
  // Masas the month spans, for the heading ("Ashvayuja – Kartika").
  const masas = [...new Set(monthDays.map((d) => `${d.adhikaMasa ? `${t("adhikaShort")} ` : ""}${label(MASAS[d.masa], locale)}`))];

  return (
    <div className="mx-auto max-w-5xl px-2 pb-8 sm:px-6">
      <div className="mb-3 flex items-center justify-between gap-2 px-2">
        <button type="button" onClick={() => shift(-1)} className={navBtn} aria-label={t("prevMonth")}>
          ‹
        </button>
        <div className="text-center">
          <p className="font-display text-2xl text-amber-100">{fmtDate(`${month}-01`, locale, { month: "long", year: "numeric" })}</p>
          <p className="text-xs text-indigo-100/60">{masas.join(" – ")}</p>
        </div>
        <button type="button" onClick={() => shift(1)} className={navBtn} aria-label={t("nextMonth")}>
          ›
        </button>
      </div>

      <div className={`${glass} p-2 sm:p-3`}>
        <div className="grid grid-cols-7 gap-1 pb-1 text-center text-[11px] uppercase tracking-wide text-indigo-100/50">
          {weekdays.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: lead }, (_, i) => (
            <span key={`pad-${i}`} />
          ))}
          {monthDays.map((d) => {
            const list = entriesOn.get(d.date) ?? [];
            const top = [...list].sort((a, b) => RANK[a.category] - RANK[b.category]);
            const isTemple = list.some((e) => e.category === "temple");
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => onPick(d.date)}
                className={`relative flex min-h-[86px] flex-col rounded-xl border p-1.5 text-left transition hover:bg-white/10 sm:min-h-[104px] ${
                  d.date === selected
                    ? "border-amber-300/80 bg-amber-300/10"
                    : isTemple
                      ? "border-amber-300/50 bg-gradient-to-br from-amber-300/20 to-transparent"
                      : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <span className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${d.date === today ? "rounded-full bg-amber-300 px-1.5 text-[#1a0f05]" : "text-amber-50"}`}>
                    {Number(d.date.slice(8))}
                  </span>
                  {d.tithi === 14 ? <span className="text-xs" aria-label={t("tithiPurnima")}>○</span> : null}
                  {d.tithi === 29 ? <span className="text-xs" aria-label={t("tithiAmavasya")}>●</span> : null}
                </span>
                <span className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-indigo-100/75 sm:text-[11px]">{tithiLabel(d, locale)}</span>
                <span className="hidden text-[10px] leading-tight text-indigo-100/45 sm:block">{label(NAKSHATRA_NAMES[d.nakshatra], locale)}</span>
                {top[0] ? (
                  <span className={`mt-auto line-clamp-2 rounded-md border px-1 text-[9px] leading-tight sm:text-[10px] ${CATEGORY_STYLE[top[0].category]}`}>
                    {entryName(top[0], locale)}
                  </span>
                ) : null}
                {top.length > 1 ? (
                  <span className="absolute right-1 top-6 flex flex-col gap-0.5">
                    {[...new Set(top.slice(1).map((e) => e.category))].map((c) => (
                      <span key={c} className={`h-1.5 w-1.5 rounded-full ${CATEGORY_DOT[c]}`} />
                    ))}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-3 text-[11px] text-indigo-100/70">
          {(Object.keys(CATEGORY_DOT) as CalendarCategory[]).map((c) => (
            <span key={c} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${CATEGORY_DOT[c]}`} />
              {t(`category.${c}`)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const RANK: Record<CalendarCategory, number> = { temple: 0, grahana: 1, festival: 2, tirunakshatram: 3, tirumala: 4, important: 5 };
