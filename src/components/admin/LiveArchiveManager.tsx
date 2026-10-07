"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { addLiveArchiveItem, deleteLiveArchiveItem, updateLiveArchiveItem } from "@/lib/actions/live";
import type { LiveArchiveItem } from "@/lib/data/live";
import { youtubeThumbnail } from "@/lib/youtube";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";
import CategorySelect from "@/components/admin/CategorySelect";
import BilingualField from "@/components/admin/BilingualField";
import { buildFolderTree, folderPath, type Folder, type FolderTree } from "@/lib/folders";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-ink/15 bg-black/[0.03] px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-gold";

export default function LiveArchiveManager({ items, folders }: { items: LiveArchiveItem[]; folders: Folder[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  // Remounts (clears) the controlled title fields after each successful
  // add; React resets the form's other, uncontrolled inputs itself.
  const [resetKey, setResetKey] = useState(0);
  const [state, formAction, pending] = useActionState(
    async (prev: Awaited<ReturnType<typeof addLiveArchiveItem>>, formData: FormData) => {
      const result = await addLiveArchiveItem(prev, formData);
      if (result?.success) setResetKey((k) => k + 1);
      return result;
    },
    undefined,
  );

  return (
    <div className="max-w-xl">
      <form action={formAction} className="space-y-4 rounded-2xl border border-ink/10 bg-black/[0.03] p-6">
        <BilingualField key={resetKey} label="Title" enName="titleEn" knName="titleKn" required />
        <div>
          <label className="text-sm font-medium text-ink/70" htmlFor="archiveYoutube">
            YouTube link
          </label>
          <input id="archiveYoutube" name="youtube" required placeholder="https://youtu.be/…" className={inputClass} />
        </div>
        <CategorySelect categories={buildFolderTree(folders)} />
        {state?.error ? (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-600">{state.error}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-maroon-dark hover:brightness-105 disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add past darshan"}
        </button>
      </form>

      {items.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-ink/10 p-2">
              <div className="flex items-center gap-3">
              <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-black">
                <Image src={youtubeThumbnail(item.youtubeId)} alt="" fill sizes="96px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{item.title.en}</p>
                <p className="truncate text-xs text-ink/50">
                  {item.title.kn}
                  {item.folderId ? ` · ${folderPath(folders, item.folderId)}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(editing === item.id ? null : item.id)}
                className="text-xs font-semibold text-maroon hover:underline"
              >
                {editing === item.id ? "Close" : "Edit"}
              </button>
              <form action={deleteLiveArchiveItem.bind(null, item.id)} className="pr-2">
                <ConfirmSubmitButton message={`Remove "${item.title.en}" from past darshans?`}>Delete</ConfirmSubmitButton>
              </form>
              </div>
              {editing === item.id ? (
                <EditArchiveItem item={item} categories={buildFolderTree(folders)} onSaved={() => setEditing(null)} />
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-ink/50">No past darshans yet.</p>
      )}
    </div>
  );
}

function EditArchiveItem({
  item,
  categories,
  onSaved,
}: {
  item: LiveArchiveItem;
  categories: FolderTree;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (prev: Awaited<ReturnType<typeof addLiveArchiveItem>>, formData: FormData) => {
      const result = await updateLiveArchiveItem(item.id, prev, formData);
      if (result?.success) onSaved();
      return result;
    },
    undefined,
  );
  return (
    <form action={formAction} className="mt-3 space-y-4 border-t border-ink/10 px-2 pb-2 pt-4">
      <BilingualField label="Title" enName="titleEn" knName="titleKn" defaultEn={item.title.en} defaultKn={item.title.kn} required />
      <div>
        <label className="text-sm font-medium text-ink/70" htmlFor={`yt-${item.id}`}>
          YouTube link
        </label>
        <input
          id={`yt-${item.id}`}
          name="youtube"
          required
          defaultValue={`https://youtu.be/${item.youtubeId}`}
          className={inputClass}
        />
      </div>
      <CategorySelect categories={categories} defaultValue={item.folderId} />
      {state?.error ? <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-600">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-maroon-dark hover:brightness-105 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
