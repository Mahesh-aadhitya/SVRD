import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "images");
mkdirSync(outDir, { recursive: true });

// Red-oxide / antique-bronze palette (Sri Vaishnava temple tones, not
// Rajasthani gold-and-purple).
const palettes = [
  ["#7a1f1f", "#b98a3d"],
  ["#4f1414", "#c05a1e"],
  ["#8f2a1f", "#e8c97a"],
  ["#7a1f1f", "#c05a1e"],
  ["#4f1414", "#b98a3d"],
  ["#8f2a1f", "#b98a3d"],
];

// Symbol markup drawn in a 0-100 box, later placed at translate(150,100)
// on the 400x300 canvas. Generic content-category tiles only (these get
// replaced by real uploaded photos through the admin panel) — the
// denomination-specific naamam mark is NOT drawn here; it only appears
// as the real sourced photo used for branding (see CREDITS.md).
const symbolMarkup = {
  shankha:
    '<path d="M 50 14 C 74 18 84 42 77 60 C 71 76 54 87 39 81 C 26 76 20 60 27 47 C 31 39 39 35 45 37" /><path d="M 56 30 C 62 34 63 43 56 47 C 50 50 45 46 46 41 C 47 37 51 36 53 39" />',
  chakra:
    '<circle cx="50" cy="50" r="24" />' +
    Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4;
      const x1 = 50 + Math.cos(a) * 24;
      const y1 = 50 + Math.sin(a) * 24;
      const x2 = 50 + Math.cos(a) * 33;
      const y2 = 50 + Math.sin(a) * 33;
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" />`;
    }).join(""),
  lotus:
    '<path d="M50 78c-14-4-24-16-24-30 0-2 .2-4 .6-6C34 46 42 52 50 52s16-6 23.4-10c.4 2 .6 4 .6 6 0 14-10 26-24 30Z M50 52c-8-6-14-16-14-26 0-4 .7-8 2-11 6 4 10 12 12 20 2-8 6-16 12-20 1.3 3 2 7 2 11 0 10-6 20-14 26Z" />',
  diya:
    '<path d="M20 62c0-16 13-24 30-24s30 8 30 24c0 10-8 16-30 16S20 72 20 62Z M50 34c3-6 3-12-2-18-3 8-1 13 2 18Z" />',
};

function svg({ colors, symbol, label }) {
  const [c1, c2] = colors;
  const id = `g${Math.random().toString(36).slice(2, 8)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#${id})"/>
  <circle cx="200" cy="150" r="120" fill="#ffffff" opacity="0.06"/>
  <circle cx="200" cy="150" r="80" fill="#ffffff" opacity="0.07"/>
  <g transform="translate(150,100)" fill="none" stroke="#fbf1de" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">
    ${symbolMarkup[symbol]}
  </g>
  <text x="200" y="270" text-anchor="middle" font-family="Georgia, serif" font-size="15" fill="#fbf1de" opacity="0.85">${label}</text>
</svg>`;
}

const items = [
  { file: "placeholder-pooja-1.svg", symbol: "diya", label: "Suprabhata Seva", palette: 0 },
  { file: "placeholder-pooja-2.svg", symbol: "diya", label: "Abhishekam", palette: 1 },
  { file: "placeholder-pooja-3.svg", symbol: "lotus", label: "Archana", palette: 2 },
  { file: "placeholder-pooja-4.svg", symbol: "chakra", label: "Maha Arati", palette: 3 },
  { file: "placeholder-pooja-5.svg", symbol: "shankha", label: "Ekanta Seva", palette: 4 },
  { file: "placeholder-event-1.svg", symbol: "chakra", label: "Brahmotsavam", palette: 3 },
  { file: "placeholder-event-2.svg", symbol: "diya", label: "Vaikunta Ekadasi", palette: 1 },
  { file: "placeholder-event-3.svg", symbol: "lotus", label: "Ugadi", palette: 5 },
  { file: "placeholder-gallery-1.svg", symbol: "lotus", label: "Temple", palette: 0 },
  { file: "placeholder-gallery-2.svg", symbol: "chakra", label: "Festivals", palette: 3 },
  { file: "placeholder-gallery-3.svg", symbol: "diya", label: "Sevas", palette: 1 },
  { file: "placeholder-gallery-4.svg", symbol: "shankha", label: "Festivals", palette: 5 },
  { file: "placeholder-gallery-5.svg", symbol: "lotus", label: "Temple", palette: 2 },
  { file: "placeholder-gallery-6.svg", symbol: "diya", label: "Sevas", palette: 4 },
  { file: "placeholder-hero.svg", symbol: "lotus", label: "Sri Varadaraja Swamy Devalaya", palette: 0 },
];

for (const item of items) {
  const content = svg({
    colors: palettes[item.palette],
    symbol: item.symbol,
    label: item.label,
  });
  writeFileSync(join(outDir, item.file), content, "utf8");
}

console.log(`Generated ${items.length} placeholder images in ${outDir}`);
