import sharp from "sharp";
import { writeFileSync } from "node:fs";

// Source: File:Kolam-8.png, Wikimedia Commons, public domain
// (https://commons.wikimedia.org/wiki/File:Kolam-8.png), artist Mayooranathan.
const SRC = "/tmp/temple-refs/Kolam-8.png";
const OUT = process.argv[2] || "/tmp/temple-refs/kolam-strip-preview.png";
const top = Number(process.argv[3] ?? 200);
const height = Number(process.argv[4] ?? 100);
// Antique bronze/gold, matching the site's --color-gold token.
const [R, G, B] = [185, 138, 61];

const meta = await sharp(SRC).metadata();
const { data, info } = await sharp(SRC)
  .extract({ left: 0, top, width: meta.width, height })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const out = Buffer.alloc(data.length);
for (let i = 0; i < data.length; i += 4) {
  const luminosity = data[i]; // source is grayscale (white lines on black)
  out[i] = R;
  out[i + 1] = G;
  out[i + 2] = B;
  out[i + 3] = luminosity;
}

await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png()
  .toFile(OUT);

writeFileSync(
  "/tmp/temple-refs/last-crop.json",
  JSON.stringify({ top, height, width: meta.width, srcHeight: meta.height })
);
console.log(`Wrote ${OUT} (source ${meta.width}x${meta.height}, cropped top=${top} height=${height})`);
