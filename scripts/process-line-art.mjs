import sharp from "sharp";

// Generic white-background line-art -> transparent, flat-recolored PNG.
// Usage: node process-line-art.mjs <src> <out> <r> <g> <b>
const [, , src, out, r, g, b] = process.argv;
const target = [Number(r), Number(g), Number(b)];

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const outBuf = Buffer.alloc(data.length);

for (let i = 0; i < data.length; i += 4) {
  const luminosity = (data[i] + data[i + 1] + data[i + 2]) / 3;
  const alpha = Math.max(0, Math.min(255, 255 - luminosity));
  outBuf[i] = target[0];
  outBuf[i + 1] = target[1];
  outBuf[i + 2] = target[2];
  outBuf[i + 3] = alpha;
}

await sharp(outBuf, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png()
  .toFile(out);

console.log(`Wrote ${out}`);
