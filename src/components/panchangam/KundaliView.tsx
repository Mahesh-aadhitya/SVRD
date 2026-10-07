"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { TEMPLE_LOCATION, type PanchangLocation } from "@/lib/panchang/compute";
import { formatDegree } from "@/lib/panchang/format";
import { computeKundali, type Dasha, type Kundali } from "@/lib/panchang/kundali";
import ShareButton from "@/components/ShareButton";
import JatakaChart, { DARK_PALETTE, type ChartStyle } from "./JatakaChart";
import KundaliExport from "./KundaliExport";
import {
  GRAHAS,
  MASAS,
  NAKSHATRA_NAMES,
  PAKSHAS,
  RASHIS,
  SAMVATSARAS,
  VARAS,
  YOGAS,
  karanaName,
  label,
  tithiName,
  type GrahaKey,
} from "@/lib/panchang/names";

const glass =
  "rounded-3xl border border-white/10 bg-[#0b0820]/70 shadow-[0_0_40px_rgba(90,70,220,0.18)] backdrop-blur-md";
const field =
  "mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-300/60";

// Birthplaces devotees most often need; anything else by coordinates.
const PLACES: (PanchangLocation & { kn: string })[] = [
  { ...TEMPLE_LOCATION, kn: "ಕೋಲಾರ" },
  { name: "Bengaluru", kn: "ಬೆಂಗಳೂರು", lat: 12.972, lon: 77.594, tzOffsetMin: 330 },
  { name: "Mysuru", kn: "ಮೈಸೂರು", lat: 12.296, lon: 76.639, tzOffsetMin: 330 },
  { name: "Tumakuru", kn: "ತುಮಕೂರು", lat: 13.34, lon: 77.101, tzOffsetMin: 330 },
  { name: "Chikkaballapura", kn: "ಚಿಕ್ಕಬಳ್ಳಾಪುರ", lat: 13.435, lon: 77.727, tzOffsetMin: 330 },
  { name: "Mandya", kn: "ಮಂಡ್ಯ", lat: 12.522, lon: 76.897, tzOffsetMin: 330 },
  { name: "Hassan", kn: "ಹಾಸನ", lat: 13.007, lon: 76.096, tzOffsetMin: 330 },
  { name: "Shivamogga", kn: "ಶಿವಮೊಗ್ಗ", lat: 13.93, lon: 75.568, tzOffsetMin: 330 },
  { name: "Davanagere", kn: "ದಾವಣಗೆರೆ", lat: 14.464, lon: 75.921, tzOffsetMin: 330 },
  { name: "Hubballi", kn: "ಹುಬ್ಬಳ್ಳಿ", lat: 15.364, lon: 75.124, tzOffsetMin: 330 },
  { name: "Ballari", kn: "ಬಳ್ಳಾರಿ", lat: 15.139, lon: 76.921, tzOffsetMin: 330 },
  { name: "Kalaburagi", kn: "ಕಲಬುರಗಿ", lat: 17.329, lon: 76.834, tzOffsetMin: 330 },
  { name: "Mangaluru", kn: "ಮಂಗಳೂರು", lat: 12.914, lon: 74.856, tzOffsetMin: 330 },
  { name: "Udupi", kn: "ಉಡುಪಿ", lat: 13.341, lon: 74.747, tzOffsetMin: 330 },
  { name: "Tirupati", kn: "ತಿರುಪತಿ", lat: 13.629, lon: 79.419, tzOffsetMin: 330 },
  { name: "Chennai", kn: "ಚೆನ್ನೈ", lat: 13.083, lon: 80.271, tzOffsetMin: 330 },
  { name: "Srirangam", kn: "ಶ್ರೀರಂಗಂ", lat: 10.862, lon: 78.689, tzOffsetMin: 330 },
  { name: "Kanchipuram", kn: "ಕಾಂಚೀಪುರಂ", lat: 12.834, lon: 79.703, tzOffsetMin: 330 },
  { name: "Hyderabad", kn: "ಹೈದರಾಬಾದ್", lat: 17.385, lon: 78.487, tzOffsetMin: 330 },
  { name: "Mumbai", kn: "ಮುಂಬೈ", lat: 19.076, lon: 72.878, tzOffsetMin: 330 },
  { name: "Delhi", kn: "ದೆಹಲಿ", lat: 28.614, lon: 77.209, tzOffsetMin: 330 },
];

export default function KundaliView({ locale }: { locale: string }) {
  const t = useTranslations("panchangam");
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("0");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [tz, setTz] = useState("5.5");
  const [input, setInput] = useState<{ date: string; time: string; location: PanchangLocation; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chartStyle, setChartStyle] = useState<ChartStyle>("south");

  const kundali = useMemo(() => (input ? computeKundali(input) : null), [input]);
  const L = (n: { en: string; kn: string }) => label(n, locale);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return setError(t("kundali.needDateTime"));
    let location: PanchangLocation;
    if (place === "custom") {
      const la = Number(lat);
      const lo = Number(lon);
      const offset = Number(tz);
      if (!Number.isFinite(la) || !Number.isFinite(lo) || Math.abs(la) > 66 || Math.abs(lo) > 180 || !Number.isFinite(offset)) {
        return setError(t("kundali.needPlace"));
      }
      location = { name: `${la.toFixed(2)}°, ${lo.toFixed(2)}°`, lat: la, lon: lo, tzOffsetMin: Math.round(offset * 60) };
    } else {
      const p = PLACES[Number(place)];
      location = { ...p, name: locale === "kn" ? p.kn : p.name };
    }
    setError(null);
    setInput({ date, time, location, name: name.trim() });
  }

  function useDevice() {
    navigator.geolocation?.getCurrentPosition((pos) => {
      setPlace("custom");
      setLat(pos.coords.latitude.toFixed(3));
      setLon(pos.coords.longitude.toFixed(3));
      setTz(String(-new Date().getTimezoneOffset() / 60));
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 pb-8 sm:px-6">
      <form onSubmit={submit} className={`${glass} p-5`}>
        <h2 className="font-display text-xl text-amber-200">{t("kundali.title")}</h2>
        <p className="mt-1 text-xs text-indigo-100/60">{t("kundali.intro")}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-indigo-100/70 lg:col-span-1">
            {t("kundali.name")}
            <input value={name} onChange={(e) => setName(e.target.value)} className={field} maxLength={60} />
          </label>
          <label className="text-xs text-indigo-100/70">
            {t("kundali.date")}
            <input type="date" value={date} min="1900-01-01" max="2100-12-31" onChange={(e) => setDate(e.target.value)} className={field} required />
          </label>
          <label className="text-xs text-indigo-100/70">
            {t("kundali.time")}
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={field} required />
          </label>
          <label className="text-xs text-indigo-100/70">
            {t("kundali.place")}
            <select value={place} onChange={(e) => setPlace(e.target.value)} className={field}>
              {PLACES.map((p, i) => (
                <option key={p.name} value={i} className="bg-[#0b0820]">
                  {locale === "kn" ? p.kn : p.name}
                </option>
              ))}
              <option value="custom" className="bg-[#0b0820]">
                {t("kundali.otherPlace")}
              </option>
            </select>
          </label>
        </div>
        {place === "custom" ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <label className="text-xs text-indigo-100/70">
              {t("kundali.lat")}
              <input inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="13.137" className={field} />
            </label>
            <label className="text-xs text-indigo-100/70">
              {t("kundali.lon")}
              <input inputMode="decimal" value={lon} onChange={(e) => setLon(e.target.value)} placeholder="78.133" className={field} />
            </label>
            <label className="text-xs text-indigo-100/70">
              {t("kundali.tz")}
              <input inputMode="decimal" value={tz} onChange={(e) => setTz(e.target.value)} placeholder="5.5" className={field} />
            </label>
            <button type="button" onClick={useDevice} className="mt-5 rounded-xl border border-white/15 px-3 py-2 text-xs text-white/80 hover:bg-white/10">
              {t("useMyLocation")}
            </button>
          </div>
        ) : null}
        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        <button
          type="submit"
          className="mt-4 rounded-full bg-gradient-to-r from-amber-300 to-orange-400 px-6 py-2.5 text-sm font-semibold text-[#1a0f05] shadow-[0_0_24px_rgba(255,180,80,0.35)] hover:brightness-110"
        >
          {t("kundali.make")}
        </button>
      </form>

      {kundali && input ? (
        <>
          <div className={`${glass} relative p-5 text-center`}>
            <ShareButton
              tone="dark"
              className="absolute right-4 top-4"
              title={`${t("kundali.title")}${input.name ? ` · ${input.name}` : ""}`}
              text={[
                `${input.date} · ${input.time} · ${input.location.name}`,
                `${t("kundali.lagna")}: ${L(RASHIS[kundali.lagna.rashi])} ${formatDegree(kundali.lagna.degreeInRashi)}`,
                `${t("moonRashi")}: ${L(RASHIS[kundali.birth.moonRashi])}`,
                `${t("nakshatra")}: ${L(NAKSHATRA_NAMES[kundali.birth.nakshatra])} · ${t("pada", { n: kundali.birth.pada })}`,
                `${t("tithi")}: ${L(PAKSHAS[kundali.birth.tithi < 15 ? 0 : 1]).split(" ")[0]} ${L(tithiName(kundali.birth.tithi))}`,
                "",
                ...kundali.grahas.map((g) => `${L(GRAHAS[g.key])}: ${L(RASHIS[g.rashi])} ${formatDegree(g.degreeInRashi)} · ${L(NAKSHATRA_NAMES[g.nakshatra])} ${g.pada}`),
                "",
                `${t("kundali.dasha")}:`,
                ...kundali.dashas.slice(0, 9).map(
                  (d) => `${L(GRAHAS[d.lord])}: ${new Date(d.start).toISOString().slice(0, 10)} – ${new Date(d.end).toISOString().slice(0, 10)}`,
                ),
              ].join("\n")}
            />
            {input.name ? <p className="font-display text-2xl text-amber-100">{input.name}</p> : null}
            <p className="text-sm text-indigo-100/75">
              {new Intl.DateTimeFormat(locale === "kn" ? "kn-IN" : "en-IN", { dateStyle: "long", timeZone: "UTC" }).format(
                new Date(`${input.date}T00:00:00Z`),
              )}{" "}
              · {input.time} · {input.location.name}
            </p>
          </div>

          <div role="radiogroup" aria-label={t("kundali.chartStyle")} className="flex items-center justify-center gap-2 text-sm">
            <span className="text-indigo-100/60">{t("kundali.chartStyle")}:</span>
            {(["south", "north"] as const).map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={chartStyle === s}
                onClick={() => setChartStyle(s)}
                className={`rounded-full border px-4 py-1.5 ${
                  chartStyle === s ? "border-amber-300/70 bg-amber-300/15 text-amber-100" : "border-white/15 text-white/70 hover:bg-white/5"
                }`}
              >
                {t(`kundali.${s}`)}
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard title={t("kundali.rashiChart")} kundali={kundali} locale={locale} navamsa={false} chartStyle={chartStyle} />
            <ChartCard title={t("kundali.navamsaChart")} kundali={kundali} locale={locale} navamsa chartStyle={chartStyle} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <section className={`${glass} p-5`}>
              <h3 className="font-display mb-2 text-lg text-amber-200">{t("kundali.birthPanchanga")}</h3>
              <dl className="divide-y divide-white/5 text-sm">
                {(
                  [
                    [t("kundali.lagna"), `${L(RASHIS[kundali.lagna.rashi])} ${formatDegree(kundali.lagna.degreeInRashi)}`],
                    [t("moonRashi"), L(RASHIS[kundali.birth.moonRashi])],
                    [t("nakshatra"), `${L(NAKSHATRA_NAMES[kundali.birth.nakshatra])} · ${t("pada", { n: kundali.birth.pada })}`],
                    [
                      t("tithi"),
                      `${L(PAKSHAS[kundali.birth.tithi < 15 ? 0 : 1]).split(" ")[0]} ${L(tithiName(kundali.birth.tithi))}`,
                    ],
                    [t("vara"), L(VARAS[kundali.birth.weekday])],
                    [t("yoga"), L(YOGAS[kundali.birth.yoga])],
                    [t("karana"), L(karanaName(kundali.birth.karana))],
                    [t("masa"), `${kundali.birth.adhikaMasa ? `${t("adhikaShort")} ` : ""}${L(MASAS[kundali.birth.masa])}`],
                    [t("samvatsara"), L(SAMVATSARAS[kundali.birth.samvatsara])],
                    [t("sunRashi"), L(RASHIS[kundali.birth.sunRashi])],
                  ] as [string, string][]
                ).map(([k, val]) => (
                  <div key={k} className="grid grid-cols-[8.5rem_1fr] gap-3 py-1.5">
                    <dt className="text-indigo-100/60">{k}</dt>
                    <dd className="text-white/90">{val}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <DashaCard dashas={kundali.dashas} locale={locale} />
          </div>

          <section className={`${glass} p-5`}>
            <h3 className="font-display mb-2 text-lg text-amber-200">{t("grahas")}</h3>
            <div className="-mx-1 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-indigo-100/50">
                  <tr>
                    <th className="px-1 py-2 font-normal">{t("graha")}</th>
                    <th className="px-1 py-2 font-normal">{t("rashi")}</th>
                    <th className="px-1 py-2 font-normal">{t("degree")}</th>
                    <th className="px-1 py-2 font-normal">{t("nakshatra")}</th>
                    <th className="px-1 py-2 font-normal">{t("kundali.house")}</th>
                    <th className="px-1 py-2 font-normal">{t("kundali.navamsa")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-white/5">
                    <td className="px-1 py-2 text-amber-100">{t("kundali.lagna")}</td>
                    <td className="px-1 py-2">{L(RASHIS[kundali.lagna.rashi])}</td>
                    <td className="px-1 py-2 tabular-nums">{formatDegree(kundali.lagna.degreeInRashi)}</td>
                    <td className="px-1 py-2">
                      {L(NAKSHATRA_NAMES[kundali.lagna.nakshatra])} · {kundali.lagna.pada}
                    </td>
                    <td className="px-1 py-2">1</td>
                    <td className="px-1 py-2">{L(RASHIS[kundali.lagnaNavamsa])}</td>
                  </tr>
                  {kundali.grahas.map((g) => (
                    <tr key={g.key} className="border-t border-white/5">
                      <td className="px-1 py-2 text-amber-100">
                        {L(GRAHAS[g.key])}
                        {g.retrograde && g.key !== "rahu" && g.key !== "ketu" ? (
                          <span className="ml-1.5 rounded bg-rose-400/15 px-1.5 text-[10px] text-rose-200">{t("retrograde")}</span>
                        ) : null}
                      </td>
                      <td className="px-1 py-2">{L(RASHIS[g.rashi])}</td>
                      <td className="px-1 py-2 tabular-nums">{formatDegree(g.degreeInRashi)}</td>
                      <td className="px-1 py-2">
                        {L(NAKSHATRA_NAMES[g.nakshatra])} · {g.pada}
                      </td>
                      <td className="px-1 py-2">{g.house}</td>
                      <td className="px-1 py-2">{L(RASHIS[g.navamsa])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <KundaliExport kundali={kundali} input={input} locale={locale} chartStyle={chartStyle} />
          <p className="text-center text-xs leading-relaxed text-indigo-100/45">{t("kundali.footnote")}</p>
        </>
      ) : null}
    </div>
  );
}

function ChartCard({
  title,
  kundali,
  locale,
  navamsa,
  chartStyle,
}: {
  title: string;
  kundali: Kundali;
  locale: string;
  navamsa: boolean;
  chartStyle: ChartStyle;
}) {
  const t = useTranslations("panchangam");
  return (
    <section className={`${glass} p-4`}>
      <div className="mx-auto max-w-[420px] overflow-hidden rounded-xl">
        <JatakaChart
          kundali={kundali}
          navamsa={navamsa}
          chartStyle={chartStyle}
          locale={locale}
          title={title}
          lagnaShort={t("kundali.lagnaShort")}
          retroShort={t("kundali.retroShort")}
          palette={DARK_PALETTE}
        />
      </div>
      {chartStyle === "north" ? <p className="font-display mt-2 text-center text-base text-amber-200">{title}</p> : null}
    </section>
  );
}

function DashaCard({ dashas, locale }: { dashas: Dasha[]; locale: string }) {
  const t = useTranslations("panchangam");
  const [now] = useState(() => Date.now());
  const current = dashas.find((d) => d.start <= now && now < d.end);
  const [open, setOpen] = useState<GrahaKey | null>(current?.lord ?? null);
  const fmt = (ms: number) =>
    new Intl.DateTimeFormat(locale === "kn" ? "kn-IN" : "en-IN", { month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(ms));
  const L = (n: { en: string; kn: string }) => label(n, locale);

  return (
    <section className={`${glass} p-5`}>
      <h3 className="font-display mb-2 text-lg text-amber-200">{t("kundali.dasha")}</h3>
      <ul className="divide-y divide-white/5 text-sm">
        {dashas.map((d) => {
          const isNow = d === current;
          return (
            <li key={d.start}>
              <button
                type="button"
                onClick={() => setOpen(open === d.lord ? null : d.lord)}
                className={`flex w-full items-center justify-between gap-2 py-1.5 text-left ${isNow ? "text-amber-100" : "text-white/85"}`}
              >
                <span>
                  {L(GRAHAS[d.lord])}
                  {isNow ? <span className="ml-2 rounded bg-amber-300/20 px-1.5 text-[10px] text-amber-100">{t("kundali.now")}</span> : null}
                </span>
                <span className="text-xs tabular-nums text-indigo-100/60">
                  {fmt(d.start)} – {fmt(d.end)}
                </span>
              </button>
              {open === d.lord && d.sub ? (
                <ul className="mb-2 ml-3 border-l border-white/10 pl-3 text-xs">
                  {d.sub.map((s) => (
                    <li
                      key={s.start}
                      className={`flex justify-between gap-2 py-0.5 ${s.start <= now && now < s.end ? "text-amber-100" : "text-indigo-100/70"}`}
                    >
                      <span>
                        {L(GRAHAS[d.lord]).split(" ")[0]} – {L(GRAHAS[s.lord]).split(" ")[0]}
                      </span>
                      <span className="tabular-nums">
                        {fmt(s.start)} – {fmt(s.end)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
