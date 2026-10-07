import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { getVerseReviewCounts, getVersesForAdmin, VERSES_PER_PAGE, type AdminVerse, type VerseFilter } from "@/lib/data/verses";
import { saveVerse, setVerseReviewed } from "@/lib/actions/verses";

// The panchangam's verse of the day. Meanings drafted by machine wait here
// for the temple to read, correct and approve them.
export default async function AdminVersesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; collection?: string; page?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const filter: VerseFilter = {
    status: sp.status === "reviewed" || sp.status === "all" || sp.status === "flagged" ? sp.status : "unreviewed",
    collection: sp.collection === "bg" || sp.collection === "vs" || sp.collection === "dp" ? sp.collection : "all",
    page: Math.max(1, Number(sp.page) || 1),
  };
  const [{ verses, total }, counts] = await Promise.all([getVersesForAdmin(filter), getVerseReviewCounts()]);
  return <Content verses={verses} total={total} counts={counts} filter={filter} />;
}

const STATUSES = [
  ["unreviewed", "Awaiting review"],
  ["flagged", "Flagged by the check"],
  ["reviewed", "Approved"],
  ["all", "All"],
] as const;
const COLLECTIONS = [
  ["bg", "Bhagavad Gita"],
  ["vs", "Vishnu Sahasranama"],
  ["dp", "Divya Prabandham"],
  ["all", "All texts"],
] as const;

const field = "w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm leading-relaxed text-ink focus:border-maroon focus:outline-none";

function Content({
  verses,
  total,
  counts,
  filter,
}: {
  verses: AdminVerse[];
  total: number;
  counts: { total: number; unreviewed: number; flagged: number; passed: number };
  filter: VerseFilter;
}) {
  const t = useTranslations("admin");
  const pages = Math.max(1, Math.ceil(total / VERSES_PER_PAGE));
  const href = (change: Partial<VerseFilter>) => {
    const next = { ...filter, page: 1, ...change };
    return `/admin/verses?status=${next.status}&collection=${next.collection}&page=${next.page}`;
  };
  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-semibold ${active ? "bg-maroon text-cream" : "bg-black/5 text-ink/70 hover:bg-black/10"}`;

  return (
    <div>
      <AdminPageHeader title={t("nav.verses")} />
      <p className="mb-4 text-sm text-ink/65">
        {counts.total} verses in the verse of the day · <strong className="text-maroon">{counts.unreviewed} awaiting review</strong>{" "}
        — of these, <strong className="text-maroon">{counts.flagged} flagged</strong> and {counts.passed} passed the automatic check.
        Machine-drafted meanings show on the site straight away. Each was compared with published translations, and its Kannada
        translated back to English, by a second AI; please read the flagged ones first, correct them if needed, and approve.
      </p>

      <div className="mb-2 flex flex-wrap gap-2">
        {STATUSES.map(([key, name]) => (
          <Link key={key} href={href({ status: key })} className={chip(filter.status === key)}>
            {name}
          </Link>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        {COLLECTIONS.map(([key, name]) => (
          <Link key={key} href={href({ collection: key })} className={chip(filter.collection === key)}>
            {name}
          </Link>
        ))}
      </div>

      {verses.length === 0 ? (
        <p className="rounded-2xl border border-ink/10 p-6 text-center text-sm text-ink/50">Nothing here.</p>
      ) : (
        <div className="space-y-4">
          {verses.map((verse) => (
            <VerseForm key={verse.id} verse={verse} />
          ))}
        </div>
      )}

      {pages > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          {filter.page > 1 ? (
            <Link href={href({ page: filter.page - 1 })} className="font-semibold text-maroon hover:underline">
              ← Previous
            </Link>
          ) : null}
          <span className="text-ink/55">
            Page {filter.page} of {pages}
          </span>
          {filter.page < pages ? (
            <Link href={href({ page: filter.page + 1 })} className="font-semibold text-maroon hover:underline">
              Next →
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function VerseForm({ verse }: { verse: AdminVerse }) {
  return (
    <form action={saveVerse} className="rounded-2xl border border-ink/10 bg-black/[0.03] p-4">
      <input type="hidden" name="id" value={verse.id} />
      <input type="hidden" name="wasReviewed" value={String(verse.reviewed)} />
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-medium text-ink">{verse.source.en}</span>
        <span className={`rounded-full px-2 py-0.5 ${verse.reviewed ? "bg-gold/20 text-maroon" : "bg-blue-600/10 text-blue-700"}`}>
          {verse.reviewed ? "Approved" : "Awaiting review"}
        </span>
        {verse.occasion ? <span className="rounded-full bg-black/5 px-2 py-0.5 text-ink/70">For {verse.occasion}</span> : null}
        {!verse.reviewed && verse.check_status === "flagged" ? (
          <span className="rounded-full bg-red-600/10 px-2 py-0.5 text-red-700">Flagged by the check</span>
        ) : null}
        {!verse.reviewed && verse.check_status === "passed" ? (
          <span className="rounded-full bg-green-700/10 px-2 py-0.5 text-green-800">Passed the automatic check</span>
        ) : null}
      </div>
      {!verse.reviewed && verse.check_notes.length ? (
        <ul className="mt-2 list-disc space-y-0.5 rounded-xl bg-red-600/[0.06] py-2 pl-7 pr-3 text-xs text-red-800">
          {verse.check_notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-ink/50">Verse (Kannada script)</span>
          <textarea name="textKn" defaultValue={verse.text_kn} rows={3} lang="kn" className={field} />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-ink/50">Verse (romanised)</span>
          <textarea name="roman" defaultValue={verse.roman} rows={3} className={field} />
        </label>
        {verse.tamil ? (
          <p lang="ta" className="whitespace-pre-line text-xs leading-relaxed text-ink/55 md:col-span-2">
            {verse.tamil}
          </p>
        ) : null}
        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-ink/50">Meaning in Kannada</span>
          <textarea name="meaningKn" defaultValue={verse.meaning.kn} rows={5} lang="kn" className={field} />
          {verse.check_back_translation && !verse.reviewed ? (
            <span className="mt-1 block text-[11px] leading-snug text-ink/50">Read back into English: {verse.check_back_translation}</span>
          ) : null}
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-ink/50">Meaning in English</span>
          <textarea name="meaningEn" defaultValue={verse.meaning.en} rows={5} className={field} />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {verse.reviewed ? (
          <button name="intent" value="save" className="rounded-full bg-gold px-4 py-1.5 text-sm font-semibold text-maroon-dark hover:brightness-105">
            Save
          </button>
        ) : (
          <>
            <button name="intent" value="approve" className="rounded-full bg-gold px-4 py-1.5 text-sm font-semibold text-maroon-dark hover:brightness-105">
              Save &amp; approve
            </button>
            <button name="intent" value="save" className="text-xs font-semibold text-maroon hover:underline">
              Save without approving
            </button>
          </>
        )}
        {verse.reviewed ? (
          <button formAction={setVerseReviewed.bind(null, verse.id, false)} className="text-xs font-semibold text-ink/55 hover:underline">
            Mark as needing review
          </button>
        ) : null}
      </div>
    </form>
  );
}
