"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { computePanchang, TEMPLE_LOCATION, type PanchangDay, type PanchangLocation } from "@/lib/panchang/compute";
import { formatDegree, formatDuration, shiftIsoDate, todayAt } from "@/lib/panchang/format";
import { AYANAS, GRAHAS, PAKSHAS, GRAHA_ORDER, GRAHA_SHORT, NAKSHATRA_NAMES, RASHIS, RASHI_GLYPHS, RITUS, SAMVATSARAS, label, type GrahaKey } from "@/lib/panchang/names";
import type { SceneControl } from "./BrahmandaScene";
import ShareCard from "./ShareCard";
import ShareActions from "./ShareActions";
import { useDayText } from "./dayText";

// WebGL only exists in the browser; the page's text renders without it.
const BrahmandaScene = dynamic(() => import("./BrahmandaScene"), { ssr: false });

const LOCATION_KEY = "panchangam-location";

type StoredLocation = PanchangLocation & { device?: boolean };

function readStoredLocation(): StoredLocation | null {
  try {
    const raw = localStorage.getItem(LOCATION_KEY);
    if (!raw) return null;
    const loc = JSON.parse(raw) as StoredLocation;
    return typeof loc.lat === "number" && typeof loc.lon === "number" ? loc : null;
  } catch {
    return null;
  }
}

function storeLocation(loc: StoredLocation | null) {
  try {
    if (loc) localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
    else localStorage.removeItem(LOCATION_KEY);
  } catch {
    // Private mode etc. — the choice just won't be remembered.
  }
}

export default function PanchangamView({
  initialDate,
  initialDay,
  locale,
  siteTitle,
}: {
  initialDate: string;
  initialDay: PanchangDay;
  locale: string;
  siteTitle: string;
}) {
  const t = useTranslations("panchangam");
  const [date, setDate] = useState(initialDate);
  const [location, setLocation] = useState<StoredLocation>(TEMPLE_LOCATION);
  const [locating, setLocating] = useState(false);
  const [locationFailed, setLocationFailed] = useState(false);
  const [selected, setSelected] = useState<GrahaKey | null>(null);
  const [hovered, setHovered] = useState<GrahaKey | null>(null);
  const [siteUrl, setSiteUrl] = useState("");
  const controlRef = useRef<SceneControl | null>(null);

  // Restore a visitor's saved location after hydration.
  useEffect(() => {
    const stored = readStoredLocation();
    if (stored) setLocation(stored); // eslint-disable-line react-hooks/set-state-in-effect
    setSiteUrl(window.location.origin);
  }, []);

  const day = useMemo(
    () => (date === initialDate && location === TEMPLE_LOCATION ? initialDay : computePanchang(date, location)),
    [date, location, initialDate, initialDay],
  );
  const text = useDayText(day, locale);

  // Keep ?date= in the address bar so a link opens the same day.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("date", date);
    window.history.replaceState(window.history.state, "", url);
  }, [date]);

  function chooseTemple() {
    setLocation(TEMPLE_LOCATION);
    setLocationFailed(false);
    storeLocation(null);
  }

  function chooseDevice() {
    if (!navigator.geolocation) {
      setLocationFailed(true);
      return;
    }
    setLocating(true);
    setLocationFailed(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: StoredLocation = {
          name: `${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°`,
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          tzOffsetMin: -new Date().getTimezoneOffset(),
          device: true,
        };
        setLocation(loc);
        storeLocation(loc);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setLocationFailed(true);
        setLocation(TEMPLE_LOCATION);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 3_600_000 },
    );
  }

  // ── Stage pointer handling: drag to spin, tap/click to pick a graha. ──
  const drag = useRef<{ x: number; moved: boolean } | null>(null);

  function onPointerDown(e: ReactPointerEvent) {
    drag.current = { x: e.clientX, moved: false };
  }
  function onPointerMove(e: ReactPointerEvent) {
    const d = drag.current;
    if (d) {
      const dx = e.clientX - d.x;
      if (Math.abs(dx) > 3) d.moved = true;
      controlRef.current?.spin(dx * 0.006);
      d.x = e.clientX;
      return;
    }
    if (e.pointerType === "mouse") setHovered(controlRef.current?.pick(e.clientX, e.clientY) ?? null);
  }
  function onPointerUp(e: ReactPointerEvent) {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved) setSelected(controlRef.current?.pick(e.clientX, e.clientY) ?? null);
  }

  const grahaLabels = useMemo(
    () => Object.fromEntries(GRAHA_ORDER.map((k) => [k, label(GRAHA_SHORT[k], locale)])) as Record<GrahaKey, string>,
    [locale],
  );
  const rashiLabels = useMemo(() => RASHIS.map((r, i) => ({ glyph: RASHI_GLYPHS[i], name: label(r, locale) })), [locale]);
  const selectedGraha = selected ? day.grahas.find((g) => g.key === selected) : null;

  const loc = day.location;
  const { span, time, vara, longDate } = text;
  const placeName = location.device ? t("myLocation") : t("templeLocation");
  const today = todayAt(location);

  const whatsappText = text.message(siteTitle, placeName);

  return (
    <div className="relative isolate bg-[#03020a] text-white/90">
      {/* The Brahmanda: a viewport-sized WebGL backdrop that stays put while
          the panchangam cards scroll over it. */}
      <div className="pointer-events-none sticky top-0 h-[100svh] w-full overflow-hidden" aria-hidden>
        <BrahmandaScene
          grahas={day.grahas}
          rashiLabels={rashiLabels}
          grahaLabels={grahaLabels}
          selected={selected}
          hovered={hovered}
          controlRef={controlRef}
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#03020a] to-transparent" />
      </div>

      <div className="relative -mt-[100svh]">
        {/* Heading and controls */}
        {/* A soft dark backdrop keeps the heading legible over the sky. */}
        <header className="mx-auto max-w-5xl bg-[radial-gradient(ellipse_60%_70%_at_50%_45%,rgba(3,2,10,0.78),rgba(3,2,10,0.4)_60%,transparent_85%)] px-4 pb-4 pt-8 text-center sm:px-6">
          <h1 className="font-display mt-2 bg-gradient-to-b from-amber-100 via-amber-300 to-orange-400 bg-clip-text text-4xl text-transparent drop-shadow-[0_0_18px_rgba(255,190,90,0.35)] sm:text-5xl">
            {t("pageTitle")}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-indigo-100/70">{t("subtitle")}</p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button type="button" onClick={() => setDate(shiftIsoDate(date, -1))} className={chip} aria-label={t("prevDay")}>
              ‹
            </button>
            <input
              type="date"
              value={date}
              min="1900-01-01"
              max="2100-12-31"
              onChange={(e) => e.target.value && setDate(e.target.value)}
              aria-label={t("pickDate")}
              className={`${chip} [color-scheme:dark]`}
            />
            <button type="button" onClick={() => setDate(shiftIsoDate(date, 1))} className={chip} aria-label={t("nextDay")}>
              ›
            </button>
            {date !== today ? (
              <button type="button" onClick={() => setDate(today)} className={`${chip} text-amber-200`}>
                {t("today")}
              </button>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-indigo-100/60">{t("location")}:</span>
            <button type="button" onClick={chooseTemple} className={`${pill} ${location.device ? "" : pillOn}`}>
              {t("templeLocation")}
            </button>
            <button type="button" onClick={chooseDevice} disabled={locating} className={`${pill} ${location.device ? pillOn : ""}`}>
              {locating ? t("locating") : location.device ? `${t("myLocation")} · ${location.name}` : t("useMyLocation")}
            </button>
          </div>
          {locationFailed ? <p className="mt-2 text-xs text-rose-300">{t("locationFailed")}</p> : null}

          {/* The day at a glance */}
          <div className="mt-6">
            <p className="font-display text-2xl text-amber-100 sm:text-3xl">{longDate}</p>
            <p className="mt-1 text-indigo-100/80">
              {vara} · {text.pakshaShort} {text.tithi(day.tithi[0].index)} · {text.nakshatra(day.nakshatra[0].index)}
            </p>
            <p className="mx-auto mt-2 max-w-2xl text-sm italic text-amber-100/70">{text.sankalpa}</p>
            {text.observances.length ? (
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {text.observances.map((o) => (
                  <span key={o} className="rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-sm text-amber-100 shadow-[0_0_16px_rgba(255,190,90,0.25)]">
                    ✦ {o}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </header>

        {/* Interactive stage: the open sky where the grahas can be turned
            and picked. Vertical swipes still scroll the page. */}
        <section
          className="relative mx-auto h-[56svh] min-h-[340px] max-w-6xl touch-pan-y select-none"
          style={{ cursor: hovered ? "pointer" : "grab" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (drag.current = null)}
          onPointerLeave={() => {
            drag.current = null;
            setHovered(null);
          }}
        >
          <p className="absolute inset-x-0 bottom-3 text-center text-xs text-indigo-100/50">{t("sceneHint")}</p>
          {selectedGraha ? (
            <div className={`${glass} absolute bottom-10 left-1/2 w-[min(92%,360px)] -translate-x-1/2 p-4 text-left`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl text-amber-200">{label(GRAHAS[selectedGraha.key], locale)}</p>
                  <p className="mt-0.5 text-xs text-indigo-100/70">{label(GRAHAS[selectedGraha.key].about, locale)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-full px-2 text-lg leading-none text-white/60 hover:text-white"
                  aria-label={t("close")}
                >
                  ×
                </button>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <dt className="text-indigo-100/60">{t("rashi")}</dt>
                <dd>
                  <span className="rashi-glyph">{RASHI_GLYPHS[selectedGraha.rashi]}</span> {label(RASHIS[selectedGraha.rashi], locale)}{" "}
                  {formatDegree(selectedGraha.degreeInRashi)}
                </dd>
                <dt className="text-indigo-100/60">{t("nakshatra")}</dt>
                <dd>
                  {label(NAKSHATRA_NAMES[selectedGraha.nakshatra], locale)} · {t("pada", { n: selectedGraha.pada })}
                </dd>
                <dt className="text-indigo-100/60">{t("degree")}</dt>
                <dd>{formatDegree(selectedGraha.longitude)}</dd>
                <dt className="text-indigo-100/60">&nbsp;</dt>
                <dd className={selectedGraha.retrograde ? "text-rose-300" : "text-emerald-300"}>
                  {selectedGraha.retrograde ? t("retrogradeLong") : t("direct")}
                </dd>
              </dl>
            </div>
          ) : null}
        </section>

        {/* The full panchangam */}
        <div className="mx-auto grid max-w-5xl items-start gap-4 px-4 pb-6 sm:px-6 md:grid-cols-2">
          <Card title={t("panchaAnga")} className="md:col-span-2">
            <Rows
              rows={[
                [t("vara"), vara],
                [t("tithi"), text.segments(day.tithi, text.tithi)],
                [t("nakshatra"), text.segments(day.nakshatra, text.nakshatra)],
                [t("yoga"), text.segments(day.yoga, text.yoga)],
                [t("karana"), text.segments(day.karana, text.karana)],
              ]}
            />
          </Card>

          <Card title={t("sunMoon")}>
            <Rows
              rows={[
                [t("sunrise"), time(day.sunrise)],
                [t("sunset"), time(day.sunset)],
                [t("moonrise"), time(day.moonrise)],
                [t("moonset"), time(day.moonset)],
                [t("dayLength"), formatDuration(day.sunset - day.sunrise, locale)],
                [t("nightLength"), formatDuration(day.nextSunrise - day.sunset, locale)],
              ]}
            />
          </Card>

          <Card title={t("calendar")}>
            <Rows
              rows={[
                [t("samvatsara"), label(SAMVATSARAS[day.samvatsara], locale)],
                [t("masa"), text.masaName],
                [t("paksha"), label(PAKSHAS[day.paksha], locale)],
                [t("ritu"), label(RITUS[day.ritu], locale)],
                [t("ayana"), label(AYANAS[day.ayana], locale)],
                [t("sunRashi"), `${RASHI_GLYPHS[day.sunRashi]} ${text.rashi(day.sunRashi)}`],
                [t("moonRashi"), text.segments(day.moonRashi, text.rashi)],
                [t("shaka"), String(day.shakaYear)],
                [t("vikram"), String(day.vikramYear)],
                [t("kali"), String(day.kaliYear)],
              ]}
            />
          </Card>

          <Card title={t("muhurtas")} className="md:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs uppercase tracking-widest text-emerald-300/90">{t("good")}</p>
                <Rows
                  tone="good"
                  rows={[
                    [t("brahmaMuhurta"), span(day.brahmaMuhurta)],
                    [t("abhijit"), span(day.abhijit)],
                  ]}
                />
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-widest text-rose-300/90">{t("avoid")}</p>
                <Rows
                  tone="avoid"
                  rows={[
                    [t("rahuKalam"), span(day.rahuKalam)],
                    [t("yamagandam"), span(day.yamagandam)],
                    [t("gulikaKalam"), span(day.gulikaKalam)],
                    [t("durmuhurtham"), day.durmuhurtham.map(span).join(", ")],
                  ]}
                />
              </div>
            </div>
          </Card>

          <Card title={t("grahas")} className="md:col-span-2">
            <div className="-mx-1 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-indigo-100/50">
                  <tr>
                    <th className="px-1 py-2 font-normal">{t("graha")}</th>
                    <th className="px-1 py-2 font-normal">{t("rashi")}</th>
                    <th className="px-1 py-2 font-normal">{t("degree")}</th>
                    <th className="px-1 py-2 font-normal">{t("nakshatra")}</th>
                  </tr>
                </thead>
                <tbody>
                  {day.grahas.map((g) => (
                    <tr
                      key={g.key}
                      onClick={() => setSelected(g.key)}
                      className={`cursor-pointer border-t border-white/5 transition-colors hover:bg-white/5 ${selected === g.key ? "bg-amber-300/10" : ""}`}
                    >
                      <td className="px-1 py-2 text-amber-100">
                        {label(GRAHAS[g.key], locale)}
                        {g.retrograde && g.key !== "rahu" && g.key !== "ketu" ? (
                          <span className="ml-1.5 rounded bg-rose-400/15 px-1.5 text-[10px] text-rose-200">{t("retrograde")}</span>
                        ) : null}
                      </td>
                      <td className="px-1 py-2">
                        <span className="rashi-glyph mr-1 text-amber-200">{RASHI_GLYPHS[g.rashi]}</span>
                        {label(RASHIS[g.rashi], locale)}
                      </td>
                      <td className="px-1 py-2 tabular-nums">{formatDegree(g.degreeInRashi)}</td>
                      <td className="px-1 py-2">
                        {label(NAKSHATRA_NAMES[g.nakshatra], locale)} · {g.pada}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title={t("observances")} className="md:col-span-2">
            {text.observances.length ? (
              <ul className="flex flex-wrap gap-2">
                {text.observances.map((o) => (
                  <li key={o} className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-sm text-amber-100">
                    {o}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-indigo-100/60">{t("noObservances")}</p>
            )}
          </Card>

          <Card title={t("share")} className="md:col-span-2">
            <ShareActions
              card={
                <ShareCard
                  day={day}
                  locale={locale}
                  siteTitle={siteTitle}
                  siteUrl={siteUrl.replace(/^https?:\/\//, "")}
                  placeName={placeName}
                />
              }
              fileBase={`panchangam-${day.date}`}
              shareTitle={t("shareText", { date: longDate })}
              whatsappText={whatsappText}
            />
          </Card>

          <p className="text-center text-xs leading-relaxed text-indigo-100/45 md:col-span-2">
            {t("timesFor", { place: placeName })} · {loc.lat.toFixed(2)}°, {loc.lon.toFixed(2)}° · {t("footnote")}
          </p>
        </div>
      </div>

    </div>
  );
}

const chip =
  "rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/90 backdrop-blur hover:bg-white/10";
const pill = "rounded-full border border-white/15 px-3 py-1.5 text-white/80 backdrop-blur hover:bg-white/10 disabled:opacity-60";
const pillOn = "border-amber-300/60 bg-amber-300/15 text-amber-100";
const glass =
  "rounded-3xl border border-white/10 bg-[#0b0820]/90 shadow-[0_0_40px_rgba(90,70,220,0.18)] backdrop-blur-md";

function Card({ title, className = "", children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={`${glass} p-5 ${className}`}>
      <h2 className="font-display mb-3 text-lg text-amber-200">{title}</h2>
      {children}
    </section>
  );
}

function Rows({ rows, tone }: { rows: [string, string][]; tone?: "good" | "avoid" }) {
  const labelColor = tone === "good" ? "text-emerald-200/80" : tone === "avoid" ? "text-rose-200/80" : "text-indigo-100/60";
  return (
    <dl className="divide-y divide-white/5 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[8.5rem_1fr] gap-3 py-2">
          <dt className={labelColor}>{k}</dt>
          <dd className="text-white/90">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
