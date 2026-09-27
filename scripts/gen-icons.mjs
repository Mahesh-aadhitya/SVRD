import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public");
const SQUARE_LOGO = join(outDir, "images", "emblem-icon-square.png");
mkdirSync(outDir, { recursive: true });

// App icons are generated from the real chakra + thiruvadi (naamam) +
// shankha crop of the temple's ayudha emblem photo
// (public/images/emblem-icon-square.png — see CREDITS.md), not
// hand-drawn shapes. "any" purpose icons crop closer; "maskable" ones
// get extra red margin since OS masks (circle/squircle) crop the outer
// ~10-20% of a maskable icon's safe zone.
async function makeIcon({ size, file, maskable }) {
  const inner = maskable ? Math.round(size * 0.72) : size;
  const logo = await sharp(SQUARE_LOGO)
    .resize(inner, inner, { fit: "cover", kernel: "lanczos3" })
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 122, g: 31, b: 31, alpha: 1 } },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(join(outDir, file));
}

await makeIcon({ size: 512, file: "icon-512.png", maskable: false });
await makeIcon({ size: 192, file: "icon-192.png", maskable: false });
await makeIcon({ size: 180, file: "apple-touch-icon.png", maskable: false });
await makeIcon({ size: 32, file: "favicon-32.png", maskable: false });
await makeIcon({ size: 512, file: "icon-maskable-512.png", maskable: true });
await makeIcon({ size: 192, file: "icon-maskable-192.png", maskable: true });

console.log("Generated 6 icon files from the temple ayudha emblem photo.");
