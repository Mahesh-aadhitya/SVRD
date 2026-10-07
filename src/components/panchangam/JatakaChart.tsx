import type { Kundali } from "@/lib/panchang/kundali";
import { RASHIS, label } from "@/lib/panchang/names";
import { SHORT, SQUARE_OF_RASHI } from "./kundaliChart";

export type ChartStyle = "south" | "north";

export type ChartPalette = {
  line: string;
  frame: string;
  text: string;
  muted: string;
  accent: string;
  retro: string;
  lagnaFill: string;
  background: string;
};

export const PRINT_PALETTE: ChartPalette = {
  line: "#3b2a1f",
  frame: "#3b2a1f",
  text: "#1f140c",
  muted: "#7a6a5c",
  accent: "#8a1c24",
  retro: "#8a1c24",
  lagnaFill: "rgba(184,137,47,0.10)",
  background: "#ffffff",
};

export const DARK_PALETTE: ChartPalette = {
  line: "rgba(252,211,77,0.35)",
  frame: "rgba(252,211,77,0.65)",
  text: "#ffffff",
  muted: "rgba(224,231,255,0.5)",
  accent: "#fcd34d",
  retro: "#fecdd3",
  lagnaFill: "rgba(252,211,77,0.08)",
  background: "rgba(18,12,40,0.8)",
};

type Item = { text: string; color: string; bold?: boolean };

const S = 400; // viewBox size

/**
 * A jataka chart drawn the way standard kundali software draws it.
 *
 * South Indian: the twelve rashis sit in fixed squares round a 4×4 grid,
 * Meena top-left and running clockwise; the lagna's square carries a
 * diagonal stroke and "Asc"/"ಲ"; the four centre squares hold the chart's
 * name and birth details.
 *
 * North Indian: the twelve bhavas are fixed — the lagna is always the top
 * centre diamond and the houses run anticlockwise — and each house shows
 * the number of the rashi (Mesha = 1) that falls in it.
 *
 * Grahas are written with their two-letter (Kannada: one-syllable)
 * abbreviations; vakri (retrograde) ones are followed by (R) / (ವ).
 */
export default function JatakaChart({
  kundali,
  navamsa,
  chartStyle,
  locale,
  title,
  lagnaShort,
  retroShort,
  centerLines = [],
  palette,
}: {
  kundali: Kundali;
  navamsa: boolean;
  chartStyle: ChartStyle;
  locale: string;
  title: string;
  lagnaShort: string;
  retroShort: string;
  /** Birth details shown under the title in a South Indian chart's centre. */
  centerLines?: string[];
  palette: ChartPalette;
}) {
  const lagnaRashi = navamsa ? kundali.lagnaNavamsa : kundali.lagna.rashi;
  const itemsIn = (rashi: number): Item[] => [
    ...(rashi === lagnaRashi ? [{ text: lagnaShort, color: palette.accent, bold: true }] : []),
    ...kundali.grahas
      .filter((g) => (navamsa ? g.navamsa : g.rashi) === rashi)
      .map((g) => {
        // Rahu and Ketu always move backwards; only true vakri grahas are marked.
        const vakri = g.retrograde && g.key !== "rahu" && g.key !== "ketu";
        return { text: `${label(SHORT[g.key], locale)}${vakri ? `(${retroShort})` : ""}`, color: vakri ? palette.retro : palette.text };
      }),
  ];
  const font = locale === "kn" ? "var(--font-temple-kannada), sans-serif" : "inherit";

  return (
    <svg
      viewBox={`0 0 ${S} ${S}`}
      role="img"
      aria-label={title}
      style={{ display: "block", width: "100%", height: "auto", fontFamily: font }}
    >
      <rect width={S} height={S} fill={palette.background} />
      {chartStyle === "south" ? (
        <South lagnaRashi={lagnaRashi} itemsIn={itemsIn} locale={locale} title={title} centerLines={centerLines} palette={palette} />
      ) : (
        <North lagnaRashi={lagnaRashi} itemsIn={itemsIn} palette={palette} />
      )}
      <rect x={1.5} y={1.5} width={S - 3} height={S - 3} fill="none" stroke={palette.frame} strokeWidth={3} />
    </svg>
  );
}

// Writes items in rows of `perRow`, centred on (cx, cy), each in its own
// slot `width / perRow` wide, shrinking the type when a house is crowded.
function ItemBlock({
  items,
  cx,
  cy,
  perRow,
  width,
  maxSize,
  maxHeight,
}: {
  items: Item[];
  cx: number;
  cy: number;
  perRow: number;
  width: number;
  maxSize: number;
  maxHeight: number;
}) {
  if (!items.length) return null;
  const rows: Item[][] = [];
  for (let i = 0; i < items.length; i += perRow) rows.push(items.slice(i, i + perRow));
  const size = Math.min(maxSize, maxHeight / (rows.length * 1.18));
  const lineH = size * 1.18;
  const top = cy - ((rows.length - 1) * lineH) / 2;
  const slot = width / perRow;
  return (
    <g fontSize={size} textAnchor="middle" dominantBaseline="central">
      {rows.flatMap((row, r) =>
        row.map((it, i) => (
          <text key={`${r}-${i}`} x={cx + (i - (row.length - 1) / 2) * slot} y={top + r * lineH} fill={it.color} fontWeight={it.bold ? 700 : 600}>
            {it.text}
          </text>
        )),
      )}
    </g>
  );
}

function South({
  lagnaRashi,
  itemsIn,
  locale,
  title,
  centerLines,
  palette,
}: {
  lagnaRashi: number;
  itemsIn: (rashi: number) => Item[];
  locale: string;
  title: string;
  centerLines: string[];
  palette: ChartPalette;
}) {
  const c = S / 4;
  return (
    <g>
      {SQUARE_OF_RASHI.map(([row, col], rashi) => {
        const x = col * c;
        const y = row * c;
        const lagna = rashi === lagnaRashi;
        return (
          <g key={rashi}>
            <rect x={x} y={y} width={c} height={c} fill={lagna ? palette.lagnaFill : "none"} stroke={palette.line} strokeWidth={1.5} />
            {lagna ? <line x1={x} y1={y + c * 0.3} x2={x + c * 0.3} y2={y} stroke={palette.accent} strokeWidth={2} /> : null}
            <text x={x + c - 5} y={y + c - 6} textAnchor="end" fontSize={11} fill={palette.muted}>
              {label(RASHIS[rashi], locale)}
            </text>
            <ItemBlock items={itemsIn(rashi)} cx={x + c / 2} cy={y + c * 0.47} perRow={2} width={c * 0.88} maxSize={15} maxHeight={c * 0.64} />
          </g>
        );
      })}
      {/* Centre: chart name and birth details — no symbols or emblems. */}
      <g textAnchor="middle" dominantBaseline="central">
        <text x={S / 2} y={S / 2 - (centerLines.length ? 14 + centerLines.length * 8 : 0)} fontSize={24} fontWeight={700} fill={palette.accent}>
          {title}
        </text>
        {centerLines.map((line, i) => (
          <text key={i} x={S / 2} y={S / 2 - centerLines.length * 8 + 22 + i * 18} fontSize={13} fill={palette.text}>
            {line}
          </text>
        ))}
      </g>
    </g>
  );
}

// North Indian house geometry on the 400 grid: where the grahas go, where
// the rashi number goes, and how many abbreviations fit per row.
const NORTH_HOUSES: { cx: number; cy: number; nx: number; ny: number; perRow: number; h: number }[] = [
  { cx: 200, cy: 92, nx: 200, ny: 176, perRow: 3, h: 110 }, // 1 — top diamond
  { cx: 100, cy: 34, nx: 100, ny: 80, perRow: 2, h: 52 }, // 2
  { cx: 34, cy: 100, nx: 80, ny: 100, perRow: 1, h: 90 }, // 3
  { cx: 92, cy: 200, nx: 176, ny: 200, perRow: 2, h: 120 }, // 4 — left diamond
  { cx: 34, cy: 300, nx: 80, ny: 300, perRow: 1, h: 90 }, // 5
  { cx: 100, cy: 366, nx: 100, ny: 320, perRow: 2, h: 52 }, // 6
  { cx: 200, cy: 308, nx: 200, ny: 224, perRow: 3, h: 110 }, // 7 — bottom diamond
  { cx: 300, cy: 366, nx: 300, ny: 320, perRow: 2, h: 52 }, // 8
  { cx: 366, cy: 300, nx: 320, ny: 300, perRow: 1, h: 90 }, // 9
  { cx: 308, cy: 200, nx: 224, ny: 200, perRow: 2, h: 120 }, // 10 — right diamond
  { cx: 366, cy: 100, nx: 320, ny: 100, perRow: 1, h: 90 }, // 11
  { cx: 300, cy: 34, nx: 300, ny: 80, perRow: 2, h: 52 }, // 12
];

function North({ lagnaRashi, itemsIn, palette }: { lagnaRashi: number; itemsIn: (rashi: number) => Item[]; palette: ChartPalette }) {
  return (
    <g>
      <g stroke={palette.line} strokeWidth={1.5} fill="none">
        <line x1={0} y1={0} x2={S} y2={S} />
        <line x1={S} y1={0} x2={0} y2={S} />
        <polygon points={`${S / 2},0 ${S},${S / 2} ${S / 2},${S} 0,${S / 2}`} />
      </g>
      <polygon points={`${S / 2},0 ${(S * 3) / 4},${S / 4} ${S / 2},${S / 2} ${S / 4},${S / 4}`} fill={palette.lagnaFill} />
      {NORTH_HOUSES.map((house, i) => {
        const rashi = (lagnaRashi + i) % 12;
        return (
          <g key={i}>
            <text x={house.nx} y={house.ny} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={600} fill={palette.muted}>
              {rashi + 1}
            </text>
            <ItemBlock items={itemsIn(rashi)} cx={house.cx} cy={house.cy} perRow={house.perRow} width={house.perRow === 1 ? 60 : house.perRow === 3 ? 126 : 92} maxSize={15} maxHeight={house.h} />
          </g>
        );
      })}
    </g>
  );
}
