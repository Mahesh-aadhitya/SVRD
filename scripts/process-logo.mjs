import sharp from "sharp";
import { mkdirSync } from "node:fs";

// Source: File:Thenkalai_Sri_Vaishnava_urdhva_pundram.jpg, Wikimedia
// Commons, CC BY-SA 4.0, author Debanjon. Shows the traditional
// chakra + naamam + shankha trio emblem.
const SRC = "/tmp/temple-refs/naamam-ref.jpg";
const OUT_DIR = "/Users/maheshm/SVRD/public/images";
mkdirSync(OUT_DIR, { recursive: true });

const BG = [211, 29, 28]; // sampled background red
const THRESHOLD = Number(process.argv[2] ?? 60);

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const out = Buffer.alloc(data.length);

for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const dist = Math.sqrt((r - BG[0]) ** 2 + (g - BG[1]) ** 2 + (b - BG[2]) ** 2);
  out[i] = r;
  out[i + 1] = g;
  out[i + 2] = b;
  // Soft falloff near the threshold so edges anti-alias instead of hard-cutting.
  const alpha = Math.max(0, Math.min(255, ((dist - THRESHOLD) / 25) * 255));
  out[i + 3] = alpha;
}

await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png()
  .toFile(`${OUT_DIR}/logo-trio-cutout.png`);

console.log(`Wrote ${OUT_DIR}/logo-trio-cutout.png (${info.width}x${info.height}, threshold=${THRESHOLD})`);
