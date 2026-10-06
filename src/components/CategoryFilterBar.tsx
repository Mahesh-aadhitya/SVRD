"use client";

import Chip from "@/components/ui/Chip";
import type { FolderTree } from "@/lib/folders";

// Client-side category/subfolder chips for in-page filtering (booking seva
// list, live archive) where navigating would reset other on-page state.
export default function CategoryFilterBar({
  tree,
  categoryId,
  subfolderId,
  onChange,
  allLabel,
}: {
  tree: FolderTree;
  categoryId: string | null;
  subfolderId: string | null;
  onChange: (categoryId: string | null, subfolderId: string | null) => void;
  allLabel: string;
}) {
  if (tree.length === 0) return null;
  const selected = tree.find((c) => c.id === categoryId);

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        <Chip active={!selected} onClick={() => onChange(null, null)}>
          {allLabel}
        </Chip>
        {tree.map((category) => (
          <Chip key={category.id} active={selected?.id === category.id} onClick={() => onChange(category.id, null)}>
            {category.name}
          </Chip>
        ))}
      </div>
      {selected && selected.subfolders.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <Chip active={!subfolderId} onClick={() => onChange(selected.id, null)} small>
            {allLabel}
          </Chip>
          {selected.subfolders.map((sub) => (
            <Chip key={sub.id} active={subfolderId === sub.id} onClick={() => onChange(selected.id, sub.id)} small>
              {sub.name}
            </Chip>
          ))}
        </div>
      ) : null}
    </div>
  );
}
