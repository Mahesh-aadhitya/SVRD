// Loads the verse-of-the-day collection into Supabase:
//   - the hand-written verses in src/lib/panchang/verses.ts (reviewed), and
//   - supabase/verses/{bg,vs}.json joined with supabase/verses/meanings/*.json
//     (machine-drafted meanings, unreviewed until an admin approves them).
// New verses are added; existing rows keep their text and meanings (so the
// admin's corrections survive) and only get their rotation order refreshed.
//
//   npm run verses:seed

import { existsSync, readdirSync, readFileSync } from "fs";
import path from "path";
import { createHash } from "crypto";
import { Client } from "pg";
import { OCCASION, VERSES } from "../../src/lib/panchang/verses";

const DIR = path.resolve("supabase/verses");

type Named = { en: string; kn: string };
type Row = {
  id: string;
  collection: "bg" | "vs" | "dp";
  source: Named;
  text_kn: string;
  roman: string;
  tamil: string | null;
  meaning: Named;
  occasion: string | null;
  reviewed: boolean;
};

// Built texts that duplicate a hand-written verse under another id.
const SAME_AS: Record<string, string> = { "vs-108": "vs-vanamali" };

const readJson = <T>(file: string): T => JSON.parse(readFileSync(file, "utf8")) as T;

function collect(): Row[] {
  const occasionOf = Object.fromEntries(Object.entries(OCCASION).map(([key, id]) => [id, key]));
  const rows = new Map<string, Row>();
  for (const v of VERSES) {
    rows.set(v.id, {
      id: v.id,
      collection: v.id.slice(0, 2) as Row["collection"],
      source: v.source,
      text_kn: v.kn,
      roman: v.roman,
      tamil: v.tamil ?? null,
      meaning: v.meaning,
      occasion: occasionOf[v.id] ?? null,
      reviewed: true,
    });
  }

  const meanings: Record<string, Named> = {};
  const meaningsDir = path.join(DIR, "meanings");
  if (existsSync(meaningsDir)) {
    for (const f of readdirSync(meaningsDir).filter((f) => f.endsWith(".json")).sort()) {
      Object.assign(meanings, readJson<Record<string, Named>>(path.join(meaningsDir, f)));
    }
  }

  for (const file of ["bg.json", "vs.json"]) {
    for (const t of readJson<Omit<Row, "tamil" | "meaning" | "occasion" | "reviewed">[]>(path.join(DIR, file))) {
      if (rows.has(t.id) || SAME_AS[t.id]) continue;
      const meaning = meanings[t.id];
      if (!meaning?.en || !meaning?.kn) continue; // not drafted yet
      rows.set(t.id, { ...t, tamil: null, meaning, occasion: null, reviewed: false });
    }
  }
  return [...rows.values()];
}

// A fixed shuffle of each collection, spread evenly through the rotation so
// the three alternate: the Gita doesn't open with chapter 1's roll-call.
function rotationOrder(rows: Row[]) {
  const hash = (id: string) => createHash("sha1").update(id).digest("hex");
  const sort = new Map<string, number>();
  for (const collection of ["bg", "vs", "dp"]) {
    const ids = rows.filter((r) => r.collection === collection && !r.occasion).map((r) => r.id);
    ids.sort((a, b) => hash(a).localeCompare(hash(b)));
    ids.forEach((id, i) => sort.set(id, (i + 0.5) / ids.length));
  }
  return sort;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set in .env.local");
  const rows = collect();
  const sort = rotationOrder(rows);

  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query("begin");
    let added = 0;
    for (const r of rows) {
      const res = await client.query(
        `insert into verses (id, collection, source, text_kn, roman, tamil, meaning, occasion, sort, reviewed)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         on conflict (id) do update set sort = excluded.sort
         returning (xmax = 0) as inserted`,
        [r.id, r.collection, r.source, r.text_kn, r.roman, r.tamil, r.meaning, r.occasion, sort.get(r.id) ?? 0, r.reviewed],
      );
      if (res.rows[0].inserted) added++;
    }
    await client.query("commit");
    const { rows: counts } = await client.query(
      "select collection, count(*)::int as n, count(*) filter (where not reviewed)::int as unreviewed from verses group by 1 order by 1",
    );
    console.log(`Added ${added} new verses.`);
    for (const c of counts) console.log(`  ${c.collection}: ${c.n} (${c.unreviewed} awaiting review)`);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
