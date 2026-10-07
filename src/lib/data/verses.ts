import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminSession } from "@/lib/admin/dal";
import { OCCASION, VERSES, verseForDay, type OccasionKey, type Verse } from "@/lib/panchang/verses";

type VerseRow = {
  id: string;
  source: Verse["source"];
  text_kn: string;
  roman: string;
  tamil: string | null;
  meaning: Verse["meaning"];
};

/**
 * The day's verse from the full collection (verse_for_day never repeats a
 * verse until every other one has been shown). Falls back to the built-in
 * verses if the database can't be reached.
 */
export async function getVerseForDay(date: string, occasion: OccasionKey | null): Promise<Verse> {
  const { data, error } = await createPublicClient().rpc("verse_for_day", { d: date, occasion_key: occasion });
  const row = (data as VerseRow[] | null)?.[0];
  if (error || !row) {
    if (error) console.error(`getVerseForDay: ${error.message}`);
    return occasion ? VERSES.find((v) => v.id === OCCASION[occasion])! : verseForDay(date, []);
  }
  return { id: row.id, source: row.source, kn: row.text_kn, roman: row.roman, tamil: row.tamil ?? undefined, meaning: row.meaning };
}

// ── Admin: reviewing machine-drafted meanings ───────────────────────────

export type AdminVerse = VerseRow & {
  collection: "bg" | "vs" | "dp";
  occasion: string | null;
  reviewed: boolean;
  check_status: "unchecked" | "passed" | "flagged";
  check_notes: string[];
  check_back_translation: string | null;
};
export type VerseFilter = {
  status: "unreviewed" | "flagged" | "reviewed" | "all";
  collection: "all" | "bg" | "vs" | "dp";
  page: number;
};
export const VERSES_PER_PAGE = 20;

export async function getVersesForAdmin({ status, collection, page }: VerseFilter) {
  await verifyAdminSession();
  let query = createAdminClient()
    .from("verses")
    .select("id, collection, source, text_kn, roman, tamil, meaning, occasion, reviewed, check_status, check_notes, check_back_translation", {
      count: "exact",
    });
  if (status === "flagged") query = query.eq("reviewed", false).eq("check_status", "flagged");
  else if (status !== "all") query = query.eq("reviewed", status === "reviewed");
  if (collection !== "all") query = query.eq("collection", collection);
  const from = (page - 1) * VERSES_PER_PAGE;
  // Flagged verses first: "flagged" < "passed" < "unchecked".
  const { data, error, count } = await query
    .order("check_status")
    .order("collection")
    .order("sort")
    .range(from, from + VERSES_PER_PAGE - 1);
  if (error) throw new Error(`getVersesForAdmin: ${error.message}`);
  return { verses: (data ?? []) as AdminVerse[], total: count ?? 0 };
}

export async function getVerseReviewCounts() {
  await verifyAdminSession();
  const supabase = createAdminClient();
  const count = (status?: string) => {
    let q = supabase.from("verses").select("id", { count: "exact", head: true });
    if (status) q = q.eq("reviewed", false).eq("check_status", status);
    return q;
  };
  const [all, pending, flagged, passed] = await Promise.all([
    count(),
    supabase.from("verses").select("id", { count: "exact", head: true }).eq("reviewed", false),
    count("flagged"),
    count("passed"),
  ]);
  return { total: all.count ?? 0, unreviewed: pending.count ?? 0, flagged: flagged.count ?? 0, passed: passed.count ?? 0 };
}
