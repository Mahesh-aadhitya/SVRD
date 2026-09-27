"use client";

import { useActionState } from "react";
import type { FolderFormState } from "@/lib/actions/folders";
import type { FolderTree } from "@/lib/folders";

export default function FolderForm({
  categories,
  action,
}: {
  categories: FolderTree;
  action: (state: FolderFormState, formData: FormData) => Promise<FolderFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="text-xs font-medium text-ink/60" htmlFor="folder-name">
          Folder name
        </label>
        <input
          id="folder-name"
          name="name"
          required
          placeholder="e.g. Brahmotsavam 2026"
          className="mt-1 block w-56 rounded-xl border border-ink/15 bg-black/[0.03] px-3 py-2 text-sm text-ink outline-none focus:border-gold"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-ink/60" htmlFor="folder-parent">
          Category
        </label>
        <select
          id="folder-parent"
          name="parentId"
          defaultValue=""
          className="mt-1 block w-56 rounded-xl border border-ink/15 bg-black/[0.03] px-3 py-2 text-sm text-ink outline-none focus:border-gold"
        >
          <option value="">— New top-level category —</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              Subfolder under &ldquo;{category.name}&rdquo;
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-maroon-dark hover:brightness-105 disabled:opacity-60"
      >
        {pending ? "Adding…" : "+ Add folder"}
      </button>
      {state?.error ? <p className="w-full text-xs text-red-600">{state.error}</p> : null}
    </form>
  );
}
