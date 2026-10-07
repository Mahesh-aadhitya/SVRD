"use server";

import { verifyAdminSession } from "@/lib/admin/dal";
import { llmProviders } from "@/lib/ai/llm";

// Spelling, grammar and phrasing suggestions for the admin's English and
// Kannada text. The admin sees the suggestion beside their own words and
// only an explicit "Replace" puts it into the field.

const INSTRUCTIONS = {
  en: `You proofread English text that the office of Sri Varadaraja Swamy Devasthaanam, a Hindu temple in Karnataka, is about to publish in its devotee app (titles, notices, seva and event descriptions).

Fix spelling, grammar and punctuation, and rephrase clumsy wording so it reads neatly, warmly and respectfully, as a temple office would write. Keep the meaning, facts, names, dates, times, prices (₹), phone numbers, URLs and line breaks exactly. Keep established transliterations of deities, rituals and festivals (Abhishekam, Archana, Brahmotsavam, Vaikunta Ekadasi…) — do not "correct" them into other spellings. Keep a short title short, and don't add new information.`,
  kn: `You proofread Kannada text that the office of Sri Varadaraja Swamy Devasthaanam, a Hindu temple in Karnataka, is about to publish in its devotee app (titles, notices, seva and event descriptions).

Fix spelling (ಕಾಗುಣಿತ — ottakshara, ಅಲ್ಪಪ್ರಾಣ/ಮಹಾಪ್ರಾಣ, ಹ್ರಸ್ವ/ದೀರ್ಘ), grammar (ವ್ಯಾಕರಣ — vibhakti, verb agreement) and punctuation, and rephrase awkward or word-for-word-translated wording into natural, respectful Kannada, as a temple priest or office would write. Use the established Kannada spellings for deities, rituals, sevas and festivals (ಅಭಿಷೇಕ, ಅರ್ಚನೆ, ಬ್ರಹ್ಮೋತ್ಸವ, ವೈಕುಂಠ ಏಕಾದಶಿ…). Keep the meaning, facts, names, digits, dates, times, prices (₹), phone numbers, URLs and line breaks exactly. Keep a short title short, and don't add new information. Write in Kannada script only.`,
};

const FORMAT = `

Reply with JSON only: {"ok": true} if the text is already correct and reads well, otherwise {"ok": false, "suggestion": "<the full corrected text>", "notes": "<one short line, in English, saying what was changed>"}.`;

export type ProofreadResult =
  | { ok: true; clean: true }
  | { ok: true; clean: false; suggestion: string; notes: string }
  | { ok: false; error: "not_configured" | "failed" };

export async function proofread(input: string, lang: "en" | "kn"): Promise<ProofreadResult> {
  await verifyAdminSession();
  const text = input.trim().slice(0, 3000);
  if (!text) return { ok: true, clean: true };

  const providers = llmProviders();
  if (!providers.length) return { ok: false, error: "not_configured" };

  for (const [name, ask] of providers) {
    try {
      const raw = await ask({ system: INSTRUCTIONS[lang] + FORMAT, text, json: true });
      const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, "")) as { ok?: boolean; suggestion?: string; notes?: string };
      const suggestion = parsed.suggestion?.trim();
      // A "suggestion" identical to the input (bar whitespace) is no change.
      if (parsed.ok || !suggestion || suggestion.replace(/\s+/g, " ") === text.replace(/\s+/g, " ")) {
        return { ok: true, clean: true };
      }
      return { ok: true, clean: false, suggestion, notes: parsed.notes?.trim() ?? "" };
    } catch (error) {
      console.error(`proofread (${name}):`, error instanceof Error ? error.message : error);
    }
  }
  return { ok: false, error: "failed" };
}
