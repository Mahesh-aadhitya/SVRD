import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Shared text-generation calls for the admin's writing helpers
// (translation, proofreading) and for reading UPI payment screenshots.
// Providers, best first:
//   1. Google Gemini — free tier, needs GEMINI_API_KEY (aistudio.google.com)
//   2. Claude        — optional paid, needs ANTHROPIC_API_KEY

export type LlmImage = { mimeType: string; data: string /* base64 */ };
export type LlmRequest = { system: string; text: string; json?: boolean; image?: LlmImage };

export function llmProviders(): [string, (req: LlmRequest) => Promise<string>][] {
  const providers: [string, (req: LlmRequest) => Promise<string>][] = [];
  if (process.env.GEMINI_API_KEY) providers.push(["gemini", askGemini]);
  if (process.env.ANTHROPIC_API_KEY) providers.push(["claude", askClaude]);
  return providers;
}

// ── Google Gemini (free tier) ────────────────────────────────────────────

// Measured on our spelling checks and translations (Oct 2026):
// 3.1 Flash-Lite answers in ~1s with the right corrections, where the
// "-latest" aliases took 6–18s. The free tier sometimes returns 503 "high
// demand" or a 429 rate limit for one model while another is fine, and a
// model that stalls is cut off, so each is tried in turn.
const GEMINI_MODELS = ["gemini-3.1-flash-lite", "gemini-3.1-flash-lite-preview", "gemini-flash-lite-latest"];
const MODEL_TIMEOUT_MS = 8_000;

export async function askGemini({ system, text, json, image }: LlmRequest) {
  const models = process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL, ...GEMINI_MODELS] : GEMINI_MODELS;
  let lastError: Error | null = null;
  for (const model of [...new Set(models)]) {
    let response: Response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: "user", parts: [...(image ? [{ inlineData: image }] : []), { text }] }],
            generationConfig: { temperature: 0.2, ...(json ? { responseMimeType: "application/json" } : {}) },
          }),
          signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
        },
      );
    } catch (error) {
      // Timed out or dropped: move on to the next model.
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
    if (!response.ok) {
      lastError = new Error(`Gemini ${model} ${response.status}: ${(await response.text()).slice(0, 200)}`);
      if (response.status === 429 || response.status >= 500) continue;
      throw lastError;
    }
    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
    };
    return (data.candidates?.[0]?.content?.parts ?? [])
      .filter((part) => !part.thought)
      .map((part) => part.text ?? "")
      .join("");
  }
  throw lastError ?? new Error("Gemini: no model available");
}

// ── Claude (optional, paid) ──────────────────────────────────────────────

let anthropic: Anthropic | null = null;

const CLAUDE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;

export async function askClaude({ system, text, image }: LlmRequest) {
  const imageType = CLAUDE_IMAGE_TYPES.find((type) => type === image?.mimeType);
  if (image && !imageType) throw new Error(`Claude can't read ${image.mimeType} images`);
  anthropic ??= new Anthropic();
  const response = await anthropic.beta.messages.create({
    model: "claude-opus-5",
    max_tokens: 4000,
    // Short, well-specified task: low effort keeps suggestions fast.
    output_config: { effort: "low" },
    // A declined request is retried on a fallback model within the same call.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system,
    messages: [
      {
        role: "user",
        content:
          image && imageType
            ? [{ type: "image", source: { type: "base64", media_type: imageType, data: image.data } }, { type: "text", text }]
            : text,
      },
    ],
  });
  if (response.stop_reason === "refusal") throw new Error("Claude declined the request");
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
}
