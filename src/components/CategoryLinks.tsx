import { Link } from "@/i18n/navigation";
import { ChipCount, ChipRow, chipClass } from "@/components/ui/Chip";
import type { FolderTree } from "@/lib/folders";

// Server-rendered category/subfolder filter: plain links (?cat=…&sub=…), so
// filtered views are shareable and work without client JS. Categories come
// first and "All" last; `query` keeps other filters on the page in the links.
export default function CategoryLinks({
  pathname,
  tree,
  categoryId,
  subfolderId,
  allLabel,
  label,
  counts,
  query = {},
}: {
  pathname: string;
  tree: FolderTree;
  categoryId?: string;
  subfolderId?: string;
  allLabel: string;
  label?: string;
  /** Items per folder id, plus "_all" for everything. Empty categories are hidden. */
  counts?: Record<string, number>;
  query?: Record<string, string>;
}) {
  const total = (ids: string[]) => ids.reduce((sum, id) => sum + (counts?.[id] ?? 0), 0);
  const idsOf = (c: FolderTree[number]) => [c.id, ...c.subfolders.map((s) => s.id)];
  const shown = counts
    ? tree.map((c) => ({ ...c, subfolders: c.subfolders.filter((s) => total([s.id]) > 0) })).filter((c) => total(idsOf(c)) > 0)
    : tree;
  if (shown.length === 0) return null;
  const selected = shown.find((c) => c.id === categoryId);

  return (
    <div className="mt-6">
      <ChipRow label={label}>
        {shown.map((category) => {
          const active = selected?.id === category.id;
          return (
            <Link key={category.id} href={{ pathname, query: { ...query, cat: category.id } }} scroll={false} className={chipClass(active)}>
              {category.name}
              {counts ? <ChipCount count={total(idsOf(category))} active={active} /> : null}
            </Link>
          );
        })}
        <Link href={{ pathname, query }} scroll={false} className={chipClass(!selected)}>
          {allLabel}
          {counts ? <ChipCount count={counts._all ?? 0} active={!selected} /> : null}
        </Link>
      </ChipRow>
      {selected && selected.subfolders.length > 0 ? (
        <div className="mt-2 rounded-2xl border border-gold/25 bg-white/60 p-2 sm:inline-block">
          <ChipRow label={`↳ ${selected.name}`}>
            {selected.subfolders.map((sub) => {
              const active = subfolderId === sub.id;
              return (
                <Link
                  key={sub.id}
                  href={{ pathname, query: { ...query, cat: selected.id, sub: sub.id } }}
                  scroll={false}
                  className={chipClass(active, true)}
                >
                  {sub.name}
                  {counts ? <ChipCount count={total([sub.id])} active={active} /> : null}
                </Link>
              );
            })}
            <Link href={{ pathname, query: { ...query, cat: selected.id } }} scroll={false} className={chipClass(!subfolderId, true)}>
              {allLabel}
              {counts ? <ChipCount count={total(idsOf(selected))} active={!subfolderId} /> : null}
            </Link>
          </ChipRow>
        </div>
      ) : null}
    </div>
  );
}
