"use client";

import Chip, { ChipRow } from "@/components/ui/Chip";
import type { FolderTree } from "@/lib/folders";

// Client-side category/subfolder chips for in-page filtering (booking,
// gallery, songs, live archive). Categories come first and "All" last; a
// chosen category's subfolders open in a tray beneath it. With `count`,
// each chip shows how many items it holds and empty ones are hidden.
export default function CategoryFilterBar({
  tree,
  categoryId,
  subfolderId,
  onChange,
  allLabel,
  label,
  count,
  className = "mt-4",
}: {
  tree: FolderTree;
  categoryId: string | null;
  subfolderId: string | null;
  onChange: (categoryId: string | null, subfolderId: string | null) => void;
  allLabel: string;
  label?: string;
  /** Items in these folders (null = everything). */
  count?: (folderIds: string[] | null) => number;
  className?: string;
}) {
  const shown = count
    ? tree
        .map((c) => ({ ...c, subfolders: c.subfolders.filter((s) => count([s.id]) > 0) }))
        .filter((c) => count([c.id, ...c.subfolders.map((s) => s.id)]) > 0)
    : tree;
  if (shown.length === 0) return null;
  const selected = shown.find((c) => c.id === categoryId);
  const idsOf = (c: FolderTree[number]) => [c.id, ...c.subfolders.map((s) => s.id)];

  return (
    <div className={className}>
      <ChipRow label={label}>
        {shown.map((category) => (
          <Chip
            key={category.id}
            active={selected?.id === category.id}
            onClick={() => onChange(category.id, null)}
            count={count?.(idsOf(category))}
          >
            {category.name}
          </Chip>
        ))}
        <Chip active={!selected} onClick={() => onChange(null, null)} count={count?.(null)}>
          {allLabel}
        </Chip>
      </ChipRow>
      {selected && selected.subfolders.length > 0 ? (
        <div className="mt-2 rounded-2xl border border-gold/25 bg-white/60 p-2 sm:inline-block">
          <ChipRow label={`↳ ${selected.name}`}>
            {selected.subfolders.map((sub) => (
              <Chip key={sub.id} small active={subfolderId === sub.id} onClick={() => onChange(selected.id, sub.id)} count={count?.([sub.id])}>
                {sub.name}
              </Chip>
            ))}
            <Chip small active={!subfolderId} onClick={() => onChange(selected.id, null)} count={count?.(idsOf(selected))}>
              {allLabel}
            </Chip>
          </ChipRow>
        </div>
      ) : null}
    </div>
  );
}
