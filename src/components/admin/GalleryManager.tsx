"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { deleteGalleryItems, moveGalleryItems, requestGalleryUpload, updateGalleryItem } from "@/lib/actions/gallery";
import { buildFolderTree, folderPath, type Folder } from "@/lib/folders";
import type { GalleryItem } from "@/lib/gallery-types";
import { uploadFile } from "./uploadFile";
import { imageHash, sha256 } from "./fingerprint";
import FolderSelect from "./FolderSelect";
import { BulkBar, useSelection } from "./BulkSelect";

const inputClass =
  "w-full rounded-xl border border-ink/15 bg-black/[0.03] px-3 py-2 text-sm text-ink outline-none focus:border-gold";

// The gallery's items: tick any number to move or delete together, or
// edit one (folder, picture, YouTube link).
export default function GalleryManager({ items, folders }: { items: GalleryItem[]; folders: Folder[] }) {
  const router = useRouter();
  const tree = buildFolderTree(folders);
  const selection = useSelection(items.map((i) => i.id));
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  const shown = filter ? items.filter((i) => i.folderId === filter) : items;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <FolderSelect
          categories={tree}
          value={filter}
          onChange={setFilter}
          placeholder="All folders"
          className={`${inputClass} w-auto`}
        />
        {filter ? (
          <button type="button" onClick={() => setFilter("")} className="text-xs text-ink/50 hover:underline">
            Show all
          </button>
        ) : null}
      </div>

      <BulkBar
        selection={selection}
        visibleIds={shown.map((i) => i.id)}
        tree={tree}
        noun="item"
        onMove={(ids, folderId) => moveGalleryItems(ids, folderId)}
        onDelete={(ids) => deleteGalleryItems(ids)}
        onDone={() => router.refresh()}
      />

      {shown.length === 0 ? <p className="text-sm text-ink/50">Nothing here yet.</p> : null}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((item) => {
          const checked = selection.has(item.id);
          return (
            <div
              key={item.id}
              className={`overflow-hidden rounded-xl border ${checked ? "border-gold ring-2 ring-gold/60" : "border-ink/10"}`}
            >
              <button
                type="button"
                onClick={() => selection.toggle(item.id)}
                className="relative block aspect-square w-full"
                aria-pressed={checked}
                aria-label={checked ? "Unselect" : "Select"}
              >
                <Image src={item.image} alt="" fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover" />
                <span
                  className={`absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-md border-2 text-sm font-bold ${
                    checked ? "border-gold bg-gold text-maroon-dark" : "border-white bg-black/30 text-transparent"
                  }`}
                >
                  ✓
                </span>
                {item.type === "video" ? (
                  <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
                    ▶ Video
                  </span>
                ) : null}
              </button>
              <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                <span className="truncate text-ink/60">{folderPath(folders, item.folderId) ?? "—"}</span>
                <button type="button" onClick={() => setEditing(editing === item.id ? null : item.id)} className="text-maroon hover:underline">
                  {editing === item.id ? "Close" : "Edit"}
                </button>
              </div>
              {editing === item.id ? (
                <EditItem
                  item={item}
                  tree={tree}
                  onSaved={() => {
                    setEditing(null);
                    router.refresh();
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EditItem({
  item,
  tree,
  onSaved,
}: {
  item: GalleryItem;
  tree: ReturnType<typeof buildFolderTree>;
  onSaved: () => void;
}) {
  const [folderId, setFolderId] = useState(item.folderId);
  const [youtube, setYoutube] = useState(item.youtubeId ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        const prints = file ? { contentHash: await sha256(file), imageHash: await imageHash(file).catch(() => undefined) } : {};
        const imagePath = file ? await uploadFile("gallery", requestGalleryUpload, file) : undefined;
        const result = await updateGalleryItem({
          id: item.id,
          folderId,
          imagePath,
          ...prints,
          youtubeId: item.type === "video" ? youtube : undefined,
        });
        if (result.error) setError(result.error);
        else onSaved();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't save");
      }
    });
  }

  return (
    <div className="space-y-2 border-t border-ink/10 bg-black/[0.02] p-3">
      <FolderSelect categories={tree} value={folderId} onChange={setFolderId} className={inputClass} />
      {item.type === "video" ? (
        <input value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="YouTube link" className={inputClass} />
      ) : null}
      <label className="block text-[11px] text-ink/55">
        {item.type === "video" ? "New thumbnail (optional)" : "Replace photo (optional)"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 w-full text-[11px] file:mr-2 file:rounded-full file:border-0 file:bg-gold/70 file:px-3 file:py-1 file:text-[11px] file:font-semibold"
        />
      </label>
      {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="rounded-full bg-gold px-4 py-1.5 text-xs font-semibold text-maroon-dark disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
