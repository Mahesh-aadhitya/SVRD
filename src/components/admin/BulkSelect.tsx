"use client";

import { useState, useTransition } from "react";
import type { FolderTree } from "@/lib/folders";
import FolderSelect from "./FolderSelect";

// Tick-to-select for admin item lists, pruned to ids that still exist
// (so a refresh after deleting doesn't leave ghosts selected).
export function useSelection(allIds: string[]) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const ids = new Set([...picked].filter((id) => allIds.includes(id)));
  return {
    ids: [...ids],
    has: (id: string) => ids.has(id),
    toggle: (id: string) =>
      setPicked((s) => {
        const next = new Set(s);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    set: (list: string[]) => setPicked(new Set(list)),
    clear: () => setPicked(new Set()),
  };
}

export type Selection = ReturnType<typeof useSelection>;

export function BulkBar({
  selection,
  visibleIds,
  tree,
  noun,
  onMove,
  onDelete,
  onDone,
}: {
  selection: Selection;
  visibleIds: string[];
  tree: FolderTree;
  noun: string;
  onMove: (ids: string[], folderId: string) => Promise<{ error?: string }>;
  onDelete: (ids: string[]) => Promise<{ error?: string }>;
  onDone: () => void;
}) {
  const [target, setTarget] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const count = selection.ids.length;
  const allShown = visibleIds.length > 0 && visibleIds.every((id) => selection.has(id));
  const plural = `${count} ${noun}${count === 1 ? "" : "s"}`;

  function run(action: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      else {
        selection.clear();
        setTarget("");
        onDone();
      }
    });
  }

  return (
    <div className="sticky top-0 z-10 mb-3 flex flex-wrap items-center gap-3 rounded-2xl border border-ink/10 bg-white/95 px-4 py-2.5 text-sm shadow-sm backdrop-blur">
      <label className="flex items-center gap-2 text-ink/70">
        <input
          type="checkbox"
          checked={allShown}
          onChange={() => selection.set(allShown ? [] : visibleIds)}
          disabled={!visibleIds.length}
        />
        Select all
      </label>
      {count ? (
        <>
          <span className="font-semibold text-maroon">{plural} selected</span>
          <FolderSelect
            categories={tree}
            value={target}
            onChange={setTarget}
            placeholder="Move to folder…"
            className="rounded-xl border border-ink/15 bg-black/[0.03] px-3 py-1.5 text-sm text-ink outline-none focus:border-gold"
          />
          <button
            type="button"
            disabled={!target || pending}
            onClick={() => run(() => onMove(selection.ids, target))}
            className="rounded-full bg-gold px-3 py-1.5 text-xs font-semibold text-maroon-dark disabled:opacity-50"
          >
            Move
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (confirm(`Delete ${plural}? This can't be undone.`)) run(() => onDelete(selection.ids));
            }}
            className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            Delete
          </button>
          <button type="button" onClick={selection.clear} className="text-xs text-ink/50 hover:underline">
            Clear
          </button>
        </>
      ) : (
        <span className="text-xs text-ink/45">Tick {noun}s to move or delete several at once.</span>
      )}
      {pending ? <span className="text-xs text-ink/50">Working…</span> : null}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
