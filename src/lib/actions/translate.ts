"use server";

import { verifyAdminSession } from "@/lib/admin/dal";
import { llmProviders } from "@/lib/ai/llm";

// English → Kannada suggestions for the admin forms. Providers, best first:
//   1. Google Gemini   — free tier, needs GEMINI_API_KEY (aistudio.google.com)
//   2. Claude          — optional paid, needs ANTHROPIC_API_KEY
//   3. MyMemory        — free, no signup; also the fallback if 1/2 fail.
//      Set MYMEMORY_EMAIL to raise its free daily quota (5k → 50k chars).

const INSTRUCTIONS = `You translate English text written by the office of Sri Varadaraja Swamy Devasthaanam, a Hindu temple in Karnataka, into Kannada for the temple's devotee app.

Write natural, respectful Kannada as a Kannada-speaking temple priest or office would — not a word-for-word rendering. Use the established Kannada spellings for deities, rituals, sevas and festivals (e.g. Abhishekam → ಅಭಿಷೇಕ, Archana → ಅರ್ಚನೆ, Brahmotsavam → ಬ್ರಹ್ಮೋತ್ಸವ, Vaikunta Ekadasi → ವೈಕುಂಠ ಏಕಾದಶಿ). Keep all digits, prices (₹), phone numbers, URLs and line breaks exactly as given, but write month names, weekdays and AM/PM the Kannada way (e.g. "12 October at 6:30 AM" → "ಅಕ್ಟೋಬರ್ 12 ರಂದು ಬೆಳಿಗ್ಗೆ 6:30 ಕ್ಕೆ"). If the text is a short title, return a short title.

Reply with only the Kannada translation — no quotes, notes, or transliteration.`;

export type TranslateResult = { ok: true; text: string } | { ok: false; error: "not_configured" | "failed" };

export async function translateToKannada(english: string): Promise<TranslateResult> {
  await verifyAdminSession();
  const text = english.trim().slice(0, 3000);
  if (!text) return { ok: true, text: "" };

  const providers: [string, (t: string) => Promise<string>][] = llmProviders().map(([name, ask]) => [
    name,
    (t: string) => ask({ system: INSTRUCTIONS, text: t }),
  ]);
  providers.push(["mymemory", translateWithMyMemory]);

  for (const [name, translate] of providers) {
    try {
      const kannada = (await translate(text)).trim();
      if (kannada) return { ok: true, text: kannada };
    } catch (error) {
      console.error(`translateToKannada (${name}):`, error instanceof Error ? error.message : error);
    }
  }
  return { ok: false, error: "failed" };
}

// ── MyMemory (free, no key) ──────────────────────────────────────────────

// MyMemory accepts at most 500 bytes per request: split a line into
// sentence-packed chunks under the limit (hard-splitting any single
// over-long sentence).
function chunkLine(line: string, limit = 450) {
  const chunks: string[] = [];
  let current = "";
  for (const sentence of line.match(/[^.!?]+[.!?]*\s*/g) ?? [line]) {
    for (let rest = sentence; rest; rest = rest.slice(limit)) {
      const part = rest.slice(0, limit);
      if (current && (current + part).length > limit) {
        chunks.push(current);
        current = "";
      }
      current += part;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function translatePiece(piece: string) {
  if (!piece.trim()) return piece;
  const params = new URLSearchParams({ q: piece, langpair: "en|kn" });
  if (process.env.MYMEMORY_EMAIL) params.set("de", process.env.MYMEMORY_EMAIL);
  const response = await fetch(`https://api.mymemory.translated.net/get?${params}`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`MyMemory ${response.status}`);
  const data = (await response.json()) as {
    responseStatus: number | string;
    responseDetails?: string;
    responseData?: { translatedText?: string };
    quotaFinished?: boolean;
  };
  if (Number(data.responseStatus) !== 200 || data.quotaFinished) {
    throw new Error(`MyMemory: ${data.responseDetails || "quota reached"}`);
  }
  return (
    (data.responseData?.translatedText ?? "")
      // MyMemory inserts spaces inside times ("6: 30") and after "₹".
      .replace(/(\d): (\d{2})/g, "$1:$2")
      .replace(/₹ (\d)/g, "₹$1")
  );
}

async function translateWithMyMemory(text: string) {
  // Line by line so the admin's line breaks survive translation.
  const lines = await Promise.all(
    text.split("\n").map(async (line) => {
      if (!line.trim()) return line;
      const parts = await Promise.all(chunkLine(line).map(translatePiece));
      return parts.map((p) => p.trim()).join(" ");
    }),
  );
  return lines.join("\n");
}
