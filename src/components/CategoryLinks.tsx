import { Link } from "@/i18n/navigation";
import type { FolderTree } from "@/lib/folders";

const chipClass = (active: boolean, small?: boolean) =>
  `rounded-full border font-medium transition-colors ${small ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"} ${
    active ? "border-maroon bg-maroon text-cream" : "border-gold/40 text-ink/70 hover:border-maroon/50"
  }`;

// Server-rendered category/subfolder filter: plain links (?cat=…&sub=…), so
// filtered views are shareable and work without client JS.
export default function CategoryLinks({
  pathname,
  tree,
  categoryId,
  subfolderId,
  allLabel,
}: {
  pathname: string;
  tree: FolderTree;
  categoryId?: string;
  subfolderId?: string;
  allLabel: string;
}) {
  if (tree.length === 0) return null;
  const selected = tree.find((c) => c.id === categoryId);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        <Link href={pathname} scroll={false} className={chipClass(!selected)}>
          {allLabel}
        </Link>
        {tree.map((category) => (
          <Link
            key={category.id}
            href={{ pathname, query: { cat: category.id } }}
            scroll={false}
            className={chipClass(selected?.id === category.id)}
          >
            {category.name}
          </Link>
        ))}
      </div>
      {selected && selected.subfolders.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <Link
            href={{ pathname, query: { cat: selected.id } }}
            scroll={false}
            className={chipClass(!subfolderId, true)}
          >
            {allLabel}
          </Link>
          {selected.subfolders.map((sub) => (
            <Link
              key={sub.id}
              href={{ pathname, query: { cat: selected.id, sub: sub.id } }}
              scroll={false}
              className={chipClass(subfolderId === sub.id, true)}
            >
              {sub.name}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
