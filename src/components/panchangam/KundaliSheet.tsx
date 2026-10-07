"use client";

import { Fragment, useLayoutEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ayanamsa, type PanchangLocation } from "@/lib/panchang/compute";
import { formatDegree } from "@/lib/panchang/format";
import type { Kundali } from "@/lib/panchang/kundali";
import { GRAHAS, MASAS, NAKSHATRA_NAMES, PAKSHAS, RASHIS, SAMVATSARAS, VARAS, YOGAS, karanaName, label, tithiName } from "@/lib/panchang/names";
import JatakaChart, { PRINT_PALETTE, type ChartStyle } from "./JatakaChart";

export const PAPER = {
  A4: { w: 210, h: 297 },
  A5: { w: 148, h: 210 },
  A3: { w: 297, h: 420 },
  Letter: { w: 215.9, h: 279.4 },
  Legal: { w: 215.9, h: 355.6 },
} as const;
export type PaperSize = keyof typeof PAPER;
export type Orientation = "portrait" | "landscape";

export const MM_PX = 96 / 25.4;

export function paperMm(size: PaperSize, orientation: Orientation) {
  const { w, h } = PAPER[size];
  return orientation === "portrait" ? { w, h } : { w: h, h: w };
}

const MAROON = "#6b1621";
const GOLD = "#b8892f";
const INK = "#1f140c";
const RULE = "#3b2a1f";

const vakri = (g: { key: string; retrograde: boolean }) => g.retrograde && g.key !== "rahu" && g.key !== "ketu";

/**
 * The kundali laid out on one sheet of the chosen paper, for printing or a
 * PDF, in the layout printed jatakas use: temple header, the birth
 * particulars, rashi and navamsa charts side by side, the graha sphutas,
 * then the janma panchanga beside the Vimshottari dasha. Everything is
 * sized from the page, and the sheet is shrunk to fit if it would run over.
 */
export default function KundaliSheet({
  kundali,
  input,
  locale,
  size,
  orientation,
  siteTitle,
  chartStyle,
}: {
  kundali: Kundali;
  input: { date: string; time: string; location: PanchangLocation; name: string };
  locale: string;
  size: PaperSize;
  orientation: Orientation;
  siteTitle: string;
  chartStyle: ChartStyle;
}) {
  const t = useTranslations("panchangam");
  const L = (n: { en: string; kn: string }) => label(n, locale);
  const graha = (key: keyof typeof GRAHAS) => L(GRAHAS[key]).split(" (")[0];
  const { w, h } = paperMm(size, orientation);
  const margin = Math.max(8, w * 0.045);
  const inner = w - 2 * margin;
  const wide = inner >= 120;
  const chartMm = Math.min((inner - 8) / 2, 105);
  // Text scales with the shorter side so A5 stays readable and A3 grand.
  const base = (Math.min(w, h * 0.78) / 210) * 11;
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const available = (h - 2 * margin) * MM_PX;
    const needed = el.scrollHeight;
    setScale(needed > available ? available / needed : 1);
  }, [w, h, margin, kundali, locale, chartStyle]);

  const birthRows: [string, string][] = [
    [t("kundali.lagna"), `${L(RASHIS[kundali.lagna.rashi])} ${formatDegree(kundali.lagna.degreeInRashi)}`],
    [t("moonRashi"), L(RASHIS[kundali.birth.moonRashi])],
    [t("nakshatra"), `${L(NAKSHATRA_NAMES[kundali.birth.nakshatra])} · ${t("pada", { n: kundali.birth.pada })}`],
    [t("tithi"), `${L(PAKSHAS[kundali.birth.tithi < 15 ? 0 : 1]).split(" ")[0]} ${L(tithiName(kundali.birth.tithi))}`],
    [t("vara"), L(VARAS[kundali.birth.weekday])],
    [t("yoga"), L(YOGAS[kundali.birth.yoga])],
    [t("karana"), L(karanaName(kundali.birth.karana))],
    [t("masa"), `${kundali.birth.adhikaMasa ? `${t("adhikaShort")} ` : ""}${L(MASAS[kundali.birth.masa])}`],
    [t("samvatsara"), L(SAMVATSARAS[kundali.birth.samvatsara])],
    [t("sunRashi"), L(RASHIS[kundali.birth.sunRashi])],
  ];
  const intl = locale === "kn" ? "kn-IN" : "en-IN";
  const fmt = (ms: number) => new Intl.DateTimeFormat(intl, { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(ms));
  const [today] = useState(() => Date.now());
  const now = Math.max(kundali.moment, today);
  const current = kundali.dashas.find((d) => d.start <= now && now < d.end);
  const birthDate = new Intl.DateTimeFormat(intl, { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${input.date}T00:00:00Z`));
  const { lat, lon, tzOffsetMin } = input.location;
  const tz = `UTC${tzOffsetMin >= 0 ? "+" : "−"}${Math.floor(Math.abs(tzOffsetMin) / 60)}:${String(Math.abs(tzOffsetMin) % 60).padStart(2, "0")}`;
  const particulars: [string, string][] = [
    ...(input.name ? ([[t("kundali.name").replace(/\s*\(.*\)$/, ""), input.name]] as [string, string][]) : []),
    [t("kundali.date"), birthDate],
    [t("kundali.time"), `${input.time} (${tz})`],
    [t("kundali.place"), input.location.name],
    [t("kundali.latLon"), `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? "E" : "W"}`],
    [t("kundali.ayanamsa"), `${formatDegree(ayanamsa(new Date(kundali.moment)))} (Lahiri)`],
  ];

  const cell: React.CSSProperties = { padding: `${base * 0.26}px ${base * 0.45}px`, border: `1px solid ${RULE}55`, textAlign: "left", verticalAlign: "top" };
  const head: React.CSSProperties = { ...cell, background: `${GOLD}26`, color: MAROON, fontWeight: 700 };
  const heading: React.CSSProperties = {
    fontSize: base * 1.12,
    color: "#fff",
    background: MAROON,
    margin: 0,
    padding: `${base * 0.25}px ${base * 0.6}px`,
    fontWeight: 700,
    letterSpacing: locale === "kn" ? 0 : 0.5,
  };
  const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse" };
  const centerLines = chartStyle === "south" ? [birthDate, input.time, input.location.name] : [];
  const chart = (navamsa: boolean, title: string) => (
    <div style={{ width: `${chartMm}mm`, textAlign: "center" }}>
      <JatakaChart
        kundali={kundali}
        navamsa={navamsa}
        chartStyle={chartStyle}
        locale={locale}
        title={title}
        lagnaShort={t("kundali.lagnaShort")}
        retroShort={t("kundali.retroShort")}
        centerLines={centerLines}
        palette={PRINT_PALETTE}
      />
      {chartStyle === "north" ? <div style={{ marginTop: base * 0.3, fontWeight: 700, color: MAROON, fontSize: base * 1.1 }}>{title}</div> : null}
    </div>
  );

  return (
    <div
      style={{
        width: `${w}mm`,
        height: `${h}mm`,
        padding: `${margin}mm`,
        boxSizing: "border-box",
        background: "#fffdf7",
        color: INK,
        position: "relative",
        overflow: "hidden",
        fontSize: base,
        lineHeight: 1.4,
        ...(locale === "kn" ? { fontFamily: "var(--font-temple-kannada), sans-serif" } : {}),
      }}
    >
      {/* Page frame: a heavy rule with a thin one inside, as on printed jatakas. */}
      <div style={{ position: "absolute", inset: `${margin * 0.45}mm`, border: `2px solid ${MAROON}`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: `${margin * 0.45 + 1.1}mm`, border: `0.75px solid ${MAROON}`, pointerEvents: "none" }} />

      <div ref={innerRef} style={{ position: "relative", transform: scale < 1 ? `scale(${scale})` : undefined, transformOrigin: "top center" }}>
        {/* Header: the temple's own emblem and name */}
        <div style={{ textAlign: "center", borderBottom: `1.5px solid ${MAROON}`, paddingBottom: base * 0.5 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- printed */}
          <img src="/images/emblem-full.png" alt="" style={{ height: base * 3.4, width: "auto", margin: "0 auto", display: "block" }} />
          <div
            style={{
              fontSize: base * 1.6,
              color: MAROON,
              marginTop: base * 0.2,
              ...(locale === "kn"
                ? { fontFamily: "var(--font-temple-display-kn), var(--font-temple-kannada), serif" }
                : { fontFamily: "var(--font-temple-display), serif" }),
            }}
          >
            {siteTitle}
          </div>
          <div style={{ fontSize: base * 1.3, fontWeight: 700, color: INK, marginTop: base * 0.15, letterSpacing: locale === "kn" ? 0 : 3, textTransform: locale === "kn" ? undefined : "uppercase" }}>
            {t("kundali.title")}
          </div>
        </div>

        {/* Birth particulars */}
        <table style={{ ...table, marginTop: base * 0.8 }}>
          <tbody>
            {Array.from({ length: Math.ceil(particulars.length / (wide ? 2 : 1)) }, (_, r) => (
              <tr key={r}>
                {particulars.slice(r * (wide ? 2 : 1), (r + 1) * (wide ? 2 : 1)).map(([k, v]) => (
                  <Fragment key={k}>
                    <td style={{ ...head, width: wide ? "17%" : "35%" }}>{k}</td>
                    <td style={{ ...cell, fontWeight: 600 }}>{v}</td>
                  </Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Rashi and navamsa charts */}
        <div style={{ display: "flex", justifyContent: "space-evenly", gap: base, marginTop: base }}>
          {chart(false, t("kundali.rashiChart"))}
          {chart(true, t("kundali.navamsaChart"))}
        </div>

        {/* Graha sphutas */}
        <div style={{ marginTop: base }}>
          <p style={heading}>{t("kundali.sphuta")}</p>
          <table style={table}>
            <thead>
              <tr>
                {[t("graha"), t("rashi"), t("degree"), t("nakshatra"), t("kundali.padaShort"), t("kundali.house"), t("kundali.navamsa")].map((hd) => (
                  <th key={hd} style={head}>
                    {hd}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...cell, fontWeight: 700, color: MAROON }}>{t("kundali.lagna")}</td>
                <td style={cell}>{L(RASHIS[kundali.lagna.rashi])}</td>
                <td style={{ ...cell, fontVariantNumeric: "tabular-nums" }}>{formatDegree(kundali.lagna.degreeInRashi)}</td>
                <td style={cell}>{L(NAKSHATRA_NAMES[kundali.lagna.nakshatra])}</td>
                <td style={cell}>{kundali.lagna.pada}</td>
                <td style={cell}>1</td>
                <td style={cell}>{L(RASHIS[kundali.lagnaNavamsa])}</td>
              </tr>
              {kundali.grahas.map((g) => (
                <tr key={g.key}>
                  <td style={{ ...cell, fontWeight: 700 }}>
                    {graha(g.key)}
                    {vakri(g) ? <span style={{ color: MAROON }}> ({t("kundali.retroShort")})</span> : null}
                  </td>
                  <td style={cell}>{L(RASHIS[g.rashi])}</td>
                  <td style={{ ...cell, fontVariantNumeric: "tabular-nums" }}>{formatDegree(g.degreeInRashi)}</td>
                  <td style={cell}>{L(NAKSHATRA_NAMES[g.nakshatra])}</td>
                  <td style={cell}>{g.pada}</td>
                  <td style={cell}>{g.house}</td>
                  <td style={cell}>{L(RASHIS[g.navamsa])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Janma panchanga beside the dasha periods */}
        <div style={{ display: "grid", gridTemplateColumns: wide ? "1fr 1fr" : "1fr", gap: base, marginTop: base, alignItems: "start" }}>
          <div>
            <p style={heading}>{t("kundali.birthPanchanga")}</p>
            <table style={table}>
              <tbody>
                {birthRows.map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ ...head, width: "40%" }}>{k}</td>
                    <td style={cell}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <p style={heading}>{t("kundali.dasha")}</p>
            <table style={table}>
              <thead>
                <tr>
                  <th style={head}>{t("kundali.mahadasha")}</th>
                  <th style={head}>{t("kundali.from")}</th>
                  <th style={head}>{t("kundali.to")}</th>
                </tr>
              </thead>
              <tbody>
                {kundali.dashas.slice(0, 9).map((d) => (
                  <tr key={d.start} style={d === current ? { background: `${GOLD}2e`, fontWeight: 700 } : undefined}>
                    <td style={cell}>{graha(d.lord)}</td>
                    <td style={{ ...cell, fontVariantNumeric: "tabular-nums" }}>{fmt(d.start)}</td>
                    <td style={{ ...cell, fontVariantNumeric: "tabular-nums" }}>{fmt(d.end)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {current?.sub ? (
              <table style={{ ...table, marginTop: base * 0.6, fontSize: base * 0.9 }}>
                <thead>
                  <tr>
                    <th style={head} colSpan={3}>
                      {graha(current.lord)} {t("kundali.mahadasha")} — {t("kundali.antardasha")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {current.sub.map((s) => (
                    <tr key={s.start} style={s.start <= now && now < s.end ? { background: `${GOLD}2e`, fontWeight: 700 } : undefined}>
                      <td style={cell}>
                        {graha(current.lord)} – {graha(s.lord)}
                      </td>
                      <td style={{ ...cell, fontVariantNumeric: "tabular-nums" }}>{fmt(s.start)}</td>
                      <td style={{ ...cell, fontVariantNumeric: "tabular-nums" }}>{fmt(s.end)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
        </div>

        <p style={{ marginTop: base, textAlign: "center", fontSize: base * 0.78, color: `${INK}99` }}>{t("kundali.footnote")}</p>
      </div>
    </div>
  );
}
