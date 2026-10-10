import "server-only";
import sharp from "sharp";
import { llmProviders } from "./llm";

const SYSTEM = `You look at temple photographs and locate the face of the main deity (the central idol / vigraha), so the photo can be cropped without cutting the face off.
Reply with JSON only: {"point": [y, x]}
- The centre of the main deity's face, normalized to 0–1000 (0 = top/left edge, 1000 = bottom/right edge).
- Several deities: the one in the middle, or the largest. No deity: the most important subject (a person's face, else the centre of interest).`;

// Where to centre a crop of this photo, as a CSS object-position ("48% 27%"),
// or null when no AI is configured or the photo can't be read.
export async function findFocalPoint(imageUrl: string): Promise<string | null> {
  const providers = llmProviders();
  if (!providers.length) return null;
  const res = await fetch(imageUrl, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) return null;
  // A small copy is plenty to find a face, and phone photos run to several
  // MB — too slow to send. rotate() applies the photo's EXIF orientation so
  // the answer matches how browsers show it.
  const small = await sharp(Buffer.from(await res.arrayBuffer()))
    .rotate()
    .resize(640, 640, { fit: "inside" })
    .jpeg({ quality: 80 })
    .toBuffer();
  const image = { mimeType: "image/jpeg", data: small.toString("base64") };
  for (const [, ask] of providers) {
    try {
      const raw = await ask({ system: SYSTEM, text: "Where is the main deity's face?", json: true, image });
      const parsed = JSON.parse(raw.replace(/^```(?:json)?|```$/g, "").trim()) as unknown;
      // Sometimes it answers with a one-item list, or as {x, y}.
      const p = (Array.isArray(parsed) ? parsed[0] : parsed) as { point?: unknown[]; x?: unknown; y?: unknown };
      const [y, x] = Array.isArray(p.point) ? p.point.map(Number) : [Number(p.y), Number(p.x)];
      if (Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x <= 1000 && y >= 0 && y <= 1000) {
        return `${Math.round(x / 10)}% ${Math.round(y / 10)}%`;
      }
    } catch (error) {
      console.warn("findFocalPoint:", error instanceof Error ? error.message.slice(0, 200) : error);
    }
  }
  return null;
}
