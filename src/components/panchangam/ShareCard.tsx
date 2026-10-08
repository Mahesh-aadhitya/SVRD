"use client";

import { useTranslations } from "next-intl";
import type { PanchangDay } from "@/lib/panchang/compute";
import { RASHI_GLYPHS, TEMPLE_UTSAVAS, label } from "@/lib/panchang/names";
import { verseLines, type Verse } from "@/lib/panchang/verses";
import { useDayText } from "./dayText";
import AcharyaPortrait from "@/components/acharya/AcharyaPortrait";
import type { Acharya } from "@/lib/panchang/acharyas";

/**
 * The day's panchangam as a fixed-size (1080px wide) card for sharing as an
 * image or PDF. Mounted off-screen by ShareActions and captured with
 * html-to-image — it is plain DOM with a CSS galaxy, since a WebGL canvas
 * can't be captured. Framed in gold, headed by the temple's emblem, with
 * the Sudarshana Chakra and Shankha as watermarks and the temple's name
 * repeated faintly across it, so a forwarded copy still says where it's from.
 */
export default function ShareCard({
  day,
  locale,
  siteTitle,
  siteUrl,
  placeName,
  verse,
  acharyas = [],
}: {
  day: PanchangDay;
  locale: string;
  siteTitle: string;
  siteUrl: string;
  placeName: string;
  verse?: Verse;
  /** Alwars/Acharyas whose tirunakshatram it is, with their picture and page link. */
  acharyas?: { acharya: Acharya; imageUrl: string | null; link: string }[];
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
  const meanings = verse ? (kn ? [verse.meaning.kn, verse.meaning.en] : [verse.meaning.en, verse.meaning.kn]) : [];

  return (
    <div style={{ width: 1080, padding: 28, background: "#05030f" }}>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "44px 56px 40px",
          color: "#f4ecdc",
          borderRadius: 36,
          border: "3px solid #d9b45a",
          boxShadow: "inset 0 0 0 10px #05030f, inset 0 0 0 12px rgba(217,180,90,0.55), 0 0 60px rgba(255,190,90,0.15)",
          background: GALAXY,
        }}
      >
        {/* Watermarks */}
        <Watermark src="/images/emblem-chakra.png" style={{ width: 760, left: 160, top: 520, opacity: 0.07 }} />
        <Watermark src="/images/emblem-shankha.png" style={{ width: 300, left: -60, bottom: 40, opacity: 0.08 }} />
        <Watermark src="/images/emblem-shankha.png" style={{ width: 300, right: -60, bottom: 40, opacity: 0.08, transform: "scaleX(-1)" }} />
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: -200,
            transform: "rotate(-24deg)",
            display: "flex",
            flexDirection: "column",
            gap: 120,
            justifyContent: "center",
            opacity: 0.045,
            fontSize: 34,
            letterSpacing: 6,
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          {Array.from({ length: 14 }, (_, i) => (
            <div key={i} style={{ marginLeft: (i % 2) * -260 }}>
              {Array.from({ length: 5 }, () => `${siteTitle}   ✦   `).join("")}
            </div>
          ))}
        </div>
        <Corner style={{ left: 18, top: 18 }} />
        <Corner style={{ right: 18, top: 18, transform: "scaleX(-1)" }} />
        <Corner style={{ left: 18, bottom: 18, transform: "scaleY(-1)" }} />
        <Corner style={{ right: 18, bottom: 18, transform: "scale(-1,-1)" }} />

        <div style={{ position: "relative" }}>
          {/* Emblem and title */}
          <div style={{ textAlign: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- captured into a static image */}
            <img src="/images/emblem-full.png" alt="" style={{ height: 120, width: "auto", margin: "0 auto", display: "block" }} />
            <div
              style={{
                marginTop: 14,
                fontSize: kn ? 44 : 46,
                color: "#ffe6a6",
                textShadow: "0 0 24px rgba(255,200,110,0.45)",
                ...(kn
                  ? {
                      fontFamily: "var(--font-temple-display-kn), var(--font-temple-kannada), serif",
                      fontWeight: 400,
                      WebkitTextStroke: "0.055em currentColor",
                      paintOrder: "stroke fill",
                    }
                  : {}),
              }}
            >
              {siteTitle}
            </div>
            <Divider />
            <div style={{ fontSize: 30, color: "#e8c97a" }}>
              {t("pageTitle")} · {text.longDate}
            </div>
            <div style={{ fontSize: 23, marginTop: 12, color: "#d9cfe8", fontStyle: "italic", lineHeight: 1.5 }}>{text.sankalpa}</div>
          </div>

          {text.utsavas.length ? (
            <div
              style={{
                ...panel,
                marginTop: 26,
                display: "flex",
                alignItems: "center",
                gap: 20,
                justifyContent: "center",
                border: "2px solid rgba(255,214,120,0.75)",
                background: "linear-gradient(90deg, rgba(255,190,90,0.22), rgba(255,140,60,0.16), rgba(255,190,90,0.22))",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- captured into a static image */}
              <img src="/images/emblem-naamam.png" alt="" style={{ height: 76, width: "auto" }} />
              <div>
                <div style={{ fontSize: 20, color: "#f5d48a", letterSpacing: kn ? 0 : 3, textTransform: "uppercase" }}>{t("atOurTemple")}</div>
                {text.utsavas.map((key) => (
                  <div key={key} style={{ fontSize: 34, color: "#fff1c9" }}>
                    {label(TEMPLE_UTSAVAS[key].name, locale)}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 20, marginTop: 28 }}>
            {[
              [t("sunrise"), text.time(day.sunrise)],
              [t("sunset"), text.time(day.sunset)],
              [t("moonrise"), text.time(day.moonrise)],
              [t("moonset"), text.time(day.moonset)],
            ].map(([k, val]) => (
              <div key={k} style={{ ...panel, flex: 1, textAlign: "center", padding: "18px 10px" }}>
                <div style={{ fontSize: 20, color: "#e8c97a" }}>{k}</div>
                <div style={{ fontSize: 26, marginTop: 6 }}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ ...panel, marginTop: 22 }}>
            {rows.map(([k, val]) => (
              <div key={k} style={rowStyle}>
                <span style={{ color: "#e8c97a", width: 220, flexShrink: 0 }}>{k}</span>
                <span>{val}</span>
              </div>
            ))}
          </div>

          <div style={{ ...panel, marginTop: 22 }}>
            {timings.map(([k, val, good]) => (
              <div key={k} style={rowStyle}>
                <span style={{ color: good ? "#9fe0b0" : "#f2a08a", width: 220, flexShrink: 0 }}>{k}</span>
                <span>{val}</span>
              </div>
            ))}
          </div>

          {text.observances.length ? (
            <div style={{ ...panel, marginTop: 22, textAlign: "center", fontSize: 28, color: "#ffe6a6" }}>🪔 {text.observances.join(" · ")}</div>
          ) : null}

          {acharyas.map(({ acharya, imageUrl, link }) => (
            <div
              key={acharya.slug}
              style={{
                ...panel,
                marginTop: 22,
                display: "flex",
                alignItems: "center",
                gap: 26,
                padding: "20px 30px",
                border: "2px solid rgba(240,170,255,0.45)",
                background: "linear-gradient(90deg, rgba(220,120,255,0.16), rgba(255,190,90,0.12), rgba(220,120,255,0.16))",
              }}
            >
              <AcharyaPortrait name={label(acharya.name, locale)} imageUrl={imageUrl} size={118} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 19, color: "#f3c8ff", letterSpacing: kn ? 0 : 3, textTransform: "uppercase" }}>
                  {t("acharya.todayTitle")}
                </div>
                <div style={{ fontSize: 34, color: "#fff1c9", lineHeight: 1.25 }}>{label(acharya.name, locale)}</div>
                <div style={{ fontSize: 21, color: "#e6def5", lineHeight: 1.45, marginTop: 6 }}>{label(acharya.summary, locale)}</div>
                <div style={{ fontSize: 19, color: "#f5d48a", marginTop: 8 }}>
                  {t("acharya.knowMore")} → {link}
                </div>
              </div>
            </div>
          ))}

          {text.dhanurmasaLine ? (
            <div style={{ ...panel, marginTop: 22, textAlign: "center", fontSize: 25, color: "#ffe6a6" }}>🌅 {text.dhanurmasaLine}</div>
          ) : null}

          {/* The day's verse */}
          {verse ? (
            <div style={{ ...panel, marginTop: 22, padding: "24px 34px", borderColor: "rgba(232,201,122,0.45)" }}>
              <div style={{ fontSize: 20, color: "#e8c97a", textAlign: "center" }}>
                📿 {t("verseOfDay")} · {label(verse.source, locale)}
              </div>
              {verseLines(verse, locale).map((line, i) => (
                <div
                  key={line.lang}
                  lang={line.lang}
                  style={{ marginTop: 12, fontSize: i ? 23 : 27, lineHeight: 1.55, color: i ? "#efe2bf" : "#fff4d6", textAlign: "center", whiteSpace: "pre-line" }}
                >
                  {line.text}
                </div>
              ))}
              {meanings.map((m, i) => (
                <div key={i} style={{ marginTop: 12, fontSize: 21, lineHeight: 1.5, color: i ? "#b9b0d6" : "#e6def5", textAlign: "center" }}>
                  {m}
                </div>
              ))}
            </div>
          ) : null}

          <Divider />
          <div style={{ textAlign: "center", fontSize: 19, color: "#a99fc4" }}>
            {t("timesFor", { place: placeName })} · {siteUrl}
          </div>
        </div>
      </div>
    </div>
  );
}

// A Milky Way band across a starfield, in plain CSS so it can be captured.
const GALAXY = [
  "radial-gradient(1.5px 1.5px at 12% 18%, #fff 50%, transparent 51%)",
  "radial-gradient(1px 1px at 72% 9%, #fff 50%, transparent 51%)",
  "radial-gradient(1.5px 1.5px at 88% 42%, #fde7b0 50%, transparent 51%)",
  "radial-gradient(1px 1px at 33% 64%, #fff 50%, transparent 51%)",
  "radial-gradient(1.5px 1.5px at 58% 86%, #cfe0ff 50%, transparent 51%)",
  "radial-gradient(1px 1px at 6% 92%, #fff 50%, transparent 51%)",
  "radial-gradient(1px 1px at 46% 30%, #fff 50%, transparent 51%)",
  "radial-gradient(1px 1px at 22% 44%, #fff 50%, transparent 51%)",
  "radial-gradient(1px 1px at 81% 71%, #fff 50%, transparent 51%)",
  "radial-gradient(1.5px 1.5px at 64% 52%, #fff 50%, transparent 51%)",
  // The galactic core and its glow along the band.
  "radial-gradient(ellipse 30% 14% at 30% 38%, rgba(255,214,160,0.28), transparent 70%)",
  "radial-gradient(ellipse 22% 9% at 30% 38%, rgba(255,236,200,0.22), transparent 70%)",
  // Dust lane.
  "linear-gradient(152deg, transparent 33%, rgba(5,3,15,0.55) 38.5%, transparent 41%)",
  // The band itself, diagonal across the card.
  "linear-gradient(152deg, transparent 22%, rgba(150,140,230,0.10) 30%, rgba(255,210,170,0.16) 38%, rgba(150,170,255,0.12) 46%, transparent 56%)",
  "radial-gradient(ellipse 60% 40% at 15% 10%, rgba(110,52,170,0.45), transparent 70%)",
  "radial-gradient(ellipse 60% 45% at 90% 85%, rgba(30,110,150,0.4), transparent 70%)",
  "radial-gradient(ellipse 45% 30% at 75% 25%, rgba(200,70,140,0.18), transparent 70%)",
  "#05030f",
].join(", ");

function Watermark({ src, style }: { src: string; style: React.CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- captured into a static image
    <img src={src} alt="" aria-hidden style={{ position: "absolute", height: "auto", pointerEvents: "none", ...style }} />
  );
}

// A small gold flourish for each corner of the frame.
function Corner({ style }: { style: React.CSSProperties }) {
  return (
    <svg width="70" height="70" viewBox="0 0 70 70" style={{ position: "absolute", ...style }} aria-hidden>
      <path d="M4 66 V20 Q4 4 20 4 H66" fill="none" stroke="#d9b45a" strokeWidth="2.5" />
      <path d="M12 66 V26 Q12 12 26 12 H66" fill="none" stroke="rgba(217,180,90,0.5)" strokeWidth="1.2" />
      <circle cx="20" cy="20" r="4" fill="#f2cf74" />
    </svg>
  );
}

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center", margin: "18px 0" }}>
      <span style={{ height: 1.5, width: 220, background: "linear-gradient(90deg, transparent, #d9b45a)" }} />
      <span style={{ color: "#f2cf74", fontSize: 20 }}>✦</span>
      <span style={{ height: 1.5, width: 220, background: "linear-gradient(90deg, #d9b45a, transparent)" }} />
    </div>
  );
}

const panel: React.CSSProperties = {
  background: "rgba(10,7,30,0.55)",
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
