"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { addLiveArchiveItem, deleteLiveArchiveItem } from "@/lib/actions/live";
import type { LiveArchiveItem } from "@/lib/data/live";
import { youtubeThumbnail } from "@/lib/youtube";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";
import CategorySelect from "@/components/admin/CategorySelect";
import BilingualField from "@/components/admin/BilingualField";
import { buildFolderTree, folderPath, type Folder } from "@/lib/folders";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-ink/15 bg-black/[0.03] px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-gold";

export default function LiveArchiveManager({ items, folders }: { items: LiveArchiveItem[]; folders: Folder[] }) {
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
            <li key={item.id} className="flex items-center gap-3 rounded-xl border border-ink/10 p-2">
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
              <form action={deleteLiveArchiveItem.bind(null, item.id)} className="pr-2">
                <ConfirmSubmitButton message={`Remove "${item.title.en}" from past darshans?`}>Delete</ConfirmSubmitButton>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-ink/50">No past darshans yet.</p>
      )}
    </div>
  );
}
