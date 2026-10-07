// Builds the favicon, Apple touch icon and PWA icons from the temple's
// chakram (public/images/chakra-watermark.png): the full maroon chakram on
// cream, so the tab, home screen and link previews all show the same mark.
// Run: node scripts/build-icons.mjs
import sharp from "sharp";

const SRC = "public/images/chakra-watermark.png";
const CREAM = { r: 251, g: 241, b: 222, alpha: 1 };

// `pad` is the share of the square left around the chakram; maskable icons
// need ~20% so launchers can crop them to a circle.
async function icon(out, size, pad, background = CREAM) {
  const inner = Math.round(size * (1 - pad * 2));
  const art = await sharp(SRC).trim().resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: art, gravity: "center" }])
    .png()
    .toFile(out);
  console.log("wrote", out);
}

await icon("public/favicon-32.png", 32, 0.02);
await icon("public/favicon-64.png", 64, 0.03);
await icon("public/apple-touch-icon.png", 180, 0.1);
await icon("public/icon-192.png", 192, 0.08);
await icon("public/icon-512.png", 512, 0.08);
await icon("public/icon-maskable-192.png", 192, 0.2);
await icon("public/icon-maskable-512.png", 512, 0.2);
