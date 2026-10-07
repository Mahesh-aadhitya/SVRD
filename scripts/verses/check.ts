// Checks the machine-drafted verse meanings without a person reading them
// all, and flags the ones a person should read first:
//
//   1. Reference check — a second model (Gemini) compares each English
//      meaning with the verse and with published translations: for the Gita
//      Swami Sivananda, Swami Gambhirananda and Swami Adidevananda (Ramanuja's
//      commentary), from github.com/gita/gita; for the Sahasranama R.
//      Ananthakrishna Sastry's 1927 translation of Sri Sankara's commentary,
//      from ambuda.org. The references are fetched each run and never stored.
//   2. Back-translation — the Kannada meaning is translated back into English
//      by a model that never sees our English, then compared with it.
//   3. Mechanical checks — names of address kept, no stray Latin letters in
//      the Kannada, sensible length, no duplicate meanings.
//
// Results go to verses.check_status / check_notes; /admin/verses lists the
// flagged verses first. Reviewed (approved) verses are never touched.
//
//   npm run verses:check              check every unchecked, unreviewed verse
//   npm run verses:check -- --recheck  check flagged/passed ones again too
//   npm run verses:check -- --limit 20
//   npm run verses:check -- --show-refs vs-3,bg-2-47   print the references only

import { Client } from "pg";

const MODELS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3-flash-preview"];
const BATCH = 8;

type Named = { en: string; kn: string };
type Row = { id: string; collection: "bg" | "vs" | "dp"; source: Named; text_kn: string; roman: string; tamil: string | null; meaning: Named };
type Result = { status: "passed" | "flagged"; notes: string[]; backTranslation: string | null; model: string };

// ── Gemini ────────────────────────────────────────────────────────────────

let lastModel = "";
async function gemini(prompt: string): Promise<unknown> {
  for (let attempt = 0; attempt < 8; attempt++) {
    for (const model of MODELS) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0, responseMimeType: "application/json" },
          }),
          signal: AbortSignal.timeout(180_000),
        });
        if (res.status === 429 || res.status >= 500) continue; // busy: next model
        const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[]; error?: { message: string } };
        if (!res.ok) throw new Error(`${model} ${res.status}: ${data.error?.message}`);
        const text = (data.candidates?.[0]?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? "").join("");
        lastModel = model;
        return JSON.parse(text);
      } catch (error) {
        if (error instanceof SyntaxError || (error instanceof Error && error.name === "TimeoutError")) continue;
        throw error;
      }
    }
    const wait = Math.min(300, 15 * 2 ** attempt);
    process.stdout.write(`  (all models busy, waiting ${wait}s)\n`);
    await new Promise((r) => setTimeout(r, wait * 1000));
  }
  throw new Error("Gemini unavailable — try again later");
}

// ── References ────────────────────────────────────────────────────────────

const GITA_REFS = ["Swami Sivananda", "Swami Gambirananda", "Swami Adidevananda"];

async function gitaReferences() {
  const base = "https://raw.githubusercontent.com/gita/gita/main/data";
  const [verses, translations] = (await Promise.all([fetch(`${base}/verse.json`), fetch(`${base}/translation.json`)].map(async (r) => (await r).json()))) as [
    { id: number; chapter_number: number; verse_number: number }[],
    { verse_id: number; authorName: string; lang: string; description: string }[],
  ];
  const idOf = new Map(verses.map((v) => [v.id, `bg-${v.chapter_number}-${v.verse_number}`]));
  const refs = new Map<string, string[]>();
  for (const t of translations) {
    if (t.lang !== "english" || !GITA_REFS.includes(t.authorName)) continue;
    const id = idOf.get(t.verse_id);
    if (!id) continue;
    const text = t.description.replace(/^\s*\d+\.\d+\s*/, "").replace(/\s+/g, " ").trim();
    refs.set(id, [...(refs.get(id) ?? []), `${t.authorName}: ${text}`]);
  }
  return refs;
}

const devanagariDigits = (s: string) => Number(s.replace(/[०-९]/g, (d) => String("०१२३४५६७८९".indexOf(d))));

// Sastry's book lists each shloka with the running count of names "(37) ॥ १७ ॥"
// (its shloka 14 is our verse 1), then explains the names as "38. … ".
// The scan has some misread digits, so counts that break the sequence are
// repaired from their neighbours.
async function sahasranamaReferences() {
  const text = await (await fetch("https://ambuda.org/proofing/vissnnushsrnaamaavlih-shaangkrbhaassysmetaa/download/text")).text();
  const counts = new Map<number, number>();
  let listStart = -1;
  for (const m of text.matchAll(/\(\s*(\d{1,4})\s*\)\s*॥\s*([०-९]+)\s*॥/g)) {
    counts.set(devanagariDigits(m[2]) - 13, Number(m[1]));
    if (listStart < 0) listStart = m.index!;
  }
  const fixed: number[] = [0];
  for (let n = 1; n <= 107; n++) {
    const prev = fixed[n - 1];
    const next = counts.get(n + 1);
    const ok = (c: number) => c - prev >= 4 && c - prev <= 14 && (next === undefined || next - c >= 4 || next - c < 0);
    let c = counts.get(n);
    if (c === undefined || !ok(c)) {
      const digits = String(c ?? "");
      const candidates = [...digits].flatMap((_, i) => [..."0123456789"].map((d) => Number(digits.slice(0, i) + d + digits.slice(i + 1))));
      c = candidates.find(ok) ?? prev + 9;
    }
    fixed.push(c);
  }
  fixed[107] = 1000;

  // The names are explained from "THE THOUSAND NAMES" up to the stotram at the end.
  const body = text.slice(text.indexOf("THE THOUSAND NAMES"), listStart);
  const at = new Map<number, number>([[1, 0]]);
  let cursor = 0;
  for (let k = 2; k <= 1000; k++) {
    const m = new RegExp(`(?<![\\d.])${k}\\. `).exec(body.slice(cursor));
    if (!m) continue;
    at.set(k, cursor + m.index);
    cursor += m.index + m[0].length;
  }
  const from = (k: number) => at.get(k) ?? at.get(k + 1) ?? at.get(k - 1);
  const refs = new Map<string, string[]>();
  for (let n = 1; n <= 107; n++) {
    const start = from(fixed[n - 1] + 1);
    const end = from(fixed[n] + 1) ?? body.length;
    if (start === undefined) continue;
    refs.set(`vs-${n}`, [`Sankara's commentary, tr. R. Ananthakrishna Sastry (names ${fixed[n - 1] + 1}–${fixed[n]}): ${body.slice(start, end).replace(/\s+/g, " ").slice(0, 3500)}`]);
  }
  return refs;
}

// ── Mechanical checks ─────────────────────────────────────────────────────

// Names of address in the verse (IAST stem) and how the meaning renders them.
const ADDRESS: [RegExp, RegExp][] = [
  [/pārtha/, /Partha/],
  [/kaunteya/, /Kunti|Kaunteya/],
  [/bhārata/, /Bharata/],
  [/keśava/, /Keshava/],
  [/madhusūdana/, /Madhusudana/],
  [/janārdana/, /Janardana/],
  [/dhana[ñṁ]jaya/, /Dhananjaya/],
  [/govinda/, /Govinda/],
  [/hṛṣīkeśa/, /Hrishikesha/],
  [/mahābāho/, /mighty-armed/],
  [/parantapa|paraṁtapa/, /scorcher of foes|Parantapa/],
  [/acyuta/, /Achyuta/],
  [/mādhava/, /Madhava/],
  [/vārṣṇeya/, /Varshneya/],
  [/kurunandana/, /joy of the Kurus/],
  [/guḍākeśa/, /Gudakesha/],
  [/pāṇḍava/, /Pandava|son of Pandu/],
];

function mechanical(rows: Row[]) {
  const notes = new Map<string, string[]>(rows.map((r) => [r.id, []]));
  const ratios = rows.map((r) => r.meaning.kn.length / r.meaning.en.length).sort((a, b) => a - b);
  const lo = ratios[Math.floor(ratios.length * 0.01)] ?? 0;
  const hi = ratios[Math.floor(ratios.length * 0.99)] ?? Infinity;
  const seen = new Map<string, string>();
  for (const r of rows) {
    const n = notes.get(r.id)!;
    if (/[A-Za-z]/.test(r.meaning.kn)) n.push("The Kannada meaning contains English letters.");
    const ratio = r.meaning.kn.length / r.meaning.en.length;
    if (ratio < lo || ratio > hi) n.push(`The Kannada meaning is unusually ${ratio < lo ? "short" : "long"} compared with the English.`);
    if (r.collection === "bg") {
      const roman = r.roman.toLowerCase();
      for (const [inVerse, inMeaning] of ADDRESS) {
        if (inVerse.test(roman) && !inMeaning.test(r.meaning.en)) n.push(`The verse uses "${inVerse.source}", which the English meaning leaves out.`);
      }
    }
    const other = seen.get(r.meaning.en);
    if (other) n.push(`Same English meaning as ${other}.`);
    seen.set(r.meaning.en, r.id);
  }
  return notes;
}

// ── Model checks ──────────────────────────────────────────────────────────

async function backTranslate(rows: Row[]) {
  const items = rows.map((r) => ({ id: r.id, kannada: r.meaning.kn }));
  const out = (await gemini(
    `Translate each Kannada passage into plain English, as literally as natural English allows. ` +
      `Do not add or soften anything. Return JSON: [{"id": string, "english": string}].\n\n${JSON.stringify(items)}`,
  )) as { id: string; english: string }[];
  return new Map(out.map((o) => [o.id, o.english]));
}

async function judge(rows: Row[], refs: Map<string, string[]>, back: Map<string, string>) {
  const items = rows.map((r) => ({
    id: r.id,
    source: r.source.en,
    verse: r.roman,
    references: refs.get(r.id) ?? [],
    our_english_meaning: r.meaning.en,
    our_kannada_meaning_translated_back: back.get(r.id) ?? "",
  }));
  const out = (await gemini(
    `You are checking meanings written for a Sri Vaishnava temple's "verse of the day". For each item:\n` +
      `1. Compare our_english_meaning with the verse (IAST) and the reference translations. Flag it only for a real problem: ` +
      `a wrong meaning, a key idea of the verse missing, something added that is not in the verse, the wrong speaker or person addressed, ` +
      `or a reading no traditional commentary supports. Do NOT flag differences of wording or style, or a reasonable choice between ` +
      `traditional interpretations (the references follow different schools).\n` +
      `2. Compare our_kannada_meaning_translated_back with our_english_meaning. Flag it if the Kannada says something different, ` +
      `leaves out or adds an idea. Ignore wording differences.\n` +
      `Write each issue as one short, specific sentence a temple priest can act on. ` +
      `Return JSON: [{"id": string, "english_ok": boolean, "kannada_ok": boolean, "issues": string[]}].\n\n${JSON.stringify(items)}`,
  )) as { id: string; english_ok: boolean; kannada_ok: boolean; issues: string[] }[];
  return new Map(out.map((o) => [o.id, o]));
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set in .env.local");
  const recheck = process.argv.includes("--recheck");
  const limitArg = process.argv.indexOf("--limit");
  const limit = limitArg > 0 ? Number(process.argv[limitArg + 1]) : Infinity;

  const db = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await db.connect();
  try {
    const { rows: all } = await db.query<Row & { check_status: string }>(
      "select id, collection, source, text_kn, roman, tamil, meaning, check_status from verses where not reviewed order by collection, sort",
    );
    const todo = all.filter((r) => recheck || r.check_status === "unchecked").slice(0, limit);
    console.log(`${todo.length} verses to check (${all.length} awaiting review).`);
    if (!todo.length) return;

    process.stdout.write("Fetching reference translations … ");
    const refs = new Map([...(await gitaReferences()), ...(await sahasranamaReferences())]);
    console.log(`${refs.size} verses have references.`);
    const show = process.argv.indexOf("--show-refs");
    if (show > 0) {
      for (const id of process.argv[show + 1].split(",")) console.log(`\n${id}:\n${(refs.get(id) ?? ["(none)"]).join("\n").slice(0, 900)}`);
      return;
    }
    const mech = mechanical(all); // across all unreviewed, so duplicates and length norms are found

    let passed = 0;
    let flagged = 0;
    for (let i = 0; i < todo.length; i += BATCH) {
      const batch = todo.slice(i, i + BATCH);
      const back = await backTranslate(batch);
      const verdicts = await judge(batch, refs, back);
      for (const r of batch) {
        const v = verdicts.get(r.id);
        const notes = [...(mech.get(r.id) ?? []), ...(v?.issues ?? [])];
        if (!v) notes.push("The automatic check returned no verdict; please read this one.");
        if (!refs.has(r.id)) notes.push("No published translation was available to compare with.");
        const result: Result = {
          status: v && v.english_ok && v.kannada_ok && notes.length === 0 ? "passed" : "flagged",
          notes,
          backTranslation: back.get(r.id) ?? null,
          model: lastModel,
        };
        if (result.status === "passed") passed++;
        else flagged++;
        await db.query(
          `update verses set check_status = $2, check_notes = $3, check_back_translation = $4, checked_by = $5, checked_at = now()
           where id = $1 and not reviewed`,
          [r.id, result.status, result.notes, result.backTranslation, result.model],
        );
      }
      console.log(`  ${Math.min(i + BATCH, todo.length)}/${todo.length} — ${passed} passed, ${flagged} flagged (${lastModel})`);
    }
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
