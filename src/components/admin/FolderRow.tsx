"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateFolder } from "@/lib/actions/folders";
import type { FolderSection } from "@/lib/folders";

const inputClass =
  "rounded-xl border border-ink/15 bg-black/[0.03] px-3 py-1.5 text-sm text-ink outline-none focus:border-gold";

// One folder in the categories panel: rename it, move a subfolder to
// another category, or delete it.
export default function FolderRow({
  section,
  folder,
  categories,
  onDelete,
}: {
  section: FolderSection;
  folder: { id: string; name: string; parentId: string | null };
  // Categories it may be moved under (empty: it can't be moved).
  categories: { id: string; name: string }[];
  onDelete: () => Promise<void>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(folder.name);
  const [parentId, setParentId] = useState(folder.parentId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateFolder(section, { id: folder.id, name, parentId: parentId || null });
      if (result.error) setError(result.error);
      else {
        setEditing(false);
        router.refresh();
      }
    });
  }

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2 py-1">
        <input value={name} onChange={(e) => setName(e.target.value)} className={`${inputClass} w-52`} autoFocus />
        {categories.length ? (
          <select value={parentId} onChange={(e) => setParentId(e.target.value)} className={inputClass}>
            <option value="">— Top-level category —</option>
            {categories
              .filter((c) => c.id !== folder.id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  Under &ldquo;{c.name}&rdquo;
                </option>
              ))}
          </select>
        ) : null}
        <button
          type="button"
          onClick={save}
          disabled={pending || !name.trim()}
          className="rounded-full bg-gold px-3 py-1.5 text-xs font-semibold text-maroon-dark disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setName(folder.name);
            setParentId(folder.parentId ?? "");
            setError(null);
          }}
          className="text-xs text-ink/50 hover:underline"
        >
          Cancel
        </button>
        {error ? <p className="w-full text-xs text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-ink/80">{folder.name}</span>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setEditing(true)} className="text-xs text-maroon hover:underline">
          Edit
        </button>
        <form action={onDelete}>
          <button type="submit" className="text-xs text-red-600 hover:underline">
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}
