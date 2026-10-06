"use client";

import { useTranslations } from "next-intl";
import type { PanchangDay } from "@/lib/panchang/compute";
import { RASHI_GLYPHS } from "@/lib/panchang/names";
import { useDayText } from "./dayText";

/**
 * The day's panchangam as a fixed-size (1080px wide) card for sharing as an
 * image or PDF. Mounted off-screen by ShareActions and captured with
 * html-to-image — it is plain DOM with a CSS starfield, since a WebGL
 * canvas can't be captured.
 */
export default function ShareCard({
  day,
  locale,
  siteTitle,
  siteUrl,
  placeName,
}: {
  day: PanchangDay;
  locale: string;
  siteTitle: string;
  siteUrl: string;
  placeName: string;
}) {
  const t = useTranslations("panchangam");
  const text = useDayText(day, locale);
  const kn = locale === "kn";

  const rows: [string, string][] = [
    [t("vara"), text.vara],
    [t("tithi"), `${text.pakshaShort} · ${text.segments(day.tithi, text.tithi)}`],
    [t("nakshatra"), text.segments(day.nakshatra, text.nakshatra)],
    [t("yoga"), text.segments(day.yoga, text.yoga)],
    [t("karana"), text.segments(day.karana, text.karana)],
    [t("moonRashi"), text.segments(day.moonRashi, (i) => `${RASHI_GLYPHS[i]} ${text.rashi(i)}`)],
  ];
  const timings: [string, string, boolean][] = [
    [t("brahmaMuhurta"), text.span(day.brahmaMuhurta), true],
    [t("abhijit"), text.span(day.abhijit), true],
    [t("rahuKalam"), text.span(day.rahuKalam), false],
    [t("yamagandam"), text.span(day.yamagandam), false],
    [t("gulikaKalam"), text.span(day.gulikaKalam), false],
    [t("durmuhurtham"), day.durmuhurtham.map(text.span).join(", "), false],
  ];

  return (
    <div
      style={{
        width: 1080,
        padding: 64,
        color: "#f4ecdc",
        background:
          "radial-gradient(1.5px 1.5px at 12% 18%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 72% 9%, #fff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 88% 42%, #fde7b0 50%, transparent 51%), radial-gradient(1px 1px at 33% 64%, #fff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 58% 86%, #cfe0ff 50%, transparent 51%), radial-gradient(1px 1px at 6% 92%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 46% 30%, #fff 50%, transparent 51%), radial-gradient(ellipse 60% 40% at 15% 10%, rgba(110,52,170,0.45), transparent 70%), radial-gradient(ellipse 60% 45% at 90% 85%, rgba(30,110,150,0.4), transparent 70%), radial-gradient(ellipse 50% 35% at 60% 40%, rgba(190,110,30,0.22), transparent 70%), #05030f",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: kn ? 44 : 46,
            color: "#ffe6a6",
            ...(kn ? { fontFamily: "var(--font-temple-display-kn), var(--font-temple-kannada), serif", fontWeight: 400, WebkitTextStroke: "0.055em currentColor", paintOrder: "stroke fill" } : {}),
          }}
        >
          {siteTitle}
        </div>
        <div style={{ fontSize: 30, marginTop: 14, color: "#e8c97a" }}>
          {t("pageTitle")} · {text.longDate}
        </div>
        <div style={{ fontSize: 23, marginTop: 14, color: "#d9cfe8", fontStyle: "italic", lineHeight: 1.5 }}>{text.sankalpa}</div>
      </div>

      <div style={{ display: "flex", gap: 20, marginTop: 40 }}>
        {[
          [t("sunrise"), text.time(day.sunrise)],
          [t("sunset"), text.time(day.sunset)],
          [t("moonrise"), text.time(day.moonrise)],
          [t("moonset"), text.time(day.moonset)],
        ].map(([k, v]) => (
          <div key={k} style={{ ...panel, flex: 1, textAlign: "center", padding: "18px 10px" }}>
            <div style={{ fontSize: 20, color: "#e8c97a" }}>{k}</div>
            <div style={{ fontSize: 26, marginTop: 6 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ ...panel, marginTop: 24 }}>
        {rows.map(([k, v]) => (
          <div key={k} style={rowStyle}>
            <span style={{ color: "#e8c97a", width: 220, flexShrink: 0 }}>{k}</span>
            <span>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ ...panel, marginTop: 24 }}>
        {timings.map(([k, v, good]) => (
          <div key={k} style={rowStyle}>
            <span style={{ color: good ? "#9fe0b0" : "#f2a08a", width: 220, flexShrink: 0 }}>{k}</span>
            <span>{v}</span>
          </div>
        ))}
      </div>

      {text.observances.length ? (
        <div style={{ ...panel, marginTop: 24, textAlign: "center", fontSize: 28, color: "#ffe6a6" }}>
          🪔 {text.observances.join(" · ")}
        </div>
      ) : null}

      <div style={{ marginTop: 36, textAlign: "center", fontSize: 19, color: "#a99fc4" }}>
        {t("timesFor", { place: placeName })} · {siteUrl}
      </div>
    </div>
  );
}

const panel: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(232,201,122,0.28)",
  borderRadius: 24,
  padding: "14px 30px",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  gap: 16,
  fontSize: 24,
  lineHeight: 1.45,
  padding: "12px 0",
  borderBottom: "1px solid rgba(255,255,255,0.07)",
};
