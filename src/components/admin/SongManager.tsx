"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSongs, moveSongs, requestSongUpload, updateSong } from "@/lib/actions/songs";
import { buildFolderTree, folderPath, type Folder } from "@/lib/folders";
import type { Song } from "@/lib/song-types";
import BilingualField from "./BilingualField";
import FolderSelect from "./FolderSelect";
import { BulkBar, useSelection } from "./BulkSelect";
import { uploadFile } from "./uploadFile";
import { sha256 } from "./fingerprint";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-ink/15 bg-black/[0.03] px-4 py-2.5 text-sm text-ink outline-none focus:border-gold";

// The song library: tick tracks to move or delete together, or edit one.
export default function SongManager({ songs, folders, locale }: { songs: Song[]; folders: Folder[]; locale: "en" | "kn" }) {
  const router = useRouter();
  const tree = buildFolderTree(folders);
  const selection = useSelection(songs.map((s) => s.id));
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div>
      <BulkBar
        selection={selection}
        visibleIds={songs.map((s) => s.id)}
        tree={tree}
        noun="track"
        onMove={moveSongs}
        onDelete={deleteSongs}
        onDone={() => router.refresh()}
      />
      <div className="overflow-x-auto rounded-2xl border border-ink/10">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-black/[0.03] text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="w-10 px-4 py-3" />
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Folder</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 text-right font-medium">Edit</th>
            </tr>
          </thead>
          <tbody>
            {songs.map((song) => (
              <Fragment key={song.id}>
                <tr className={`border-t border-ink/10 ${selection.has(song.id) ? "bg-gold/10" : ""}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selection.has(song.id)} onChange={() => selection.toggle(song.id)} aria-label="Select" />
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">
                    {song.title[locale]}
                    <p className="text-xs font-normal text-ink/45">{song.title[locale === "en" ? "kn" : "en"]}</p>
                  </td>
                  <td className="px-4 py-3 text-ink/70">{folderPath(folders, song.folderId) ?? "—"}</td>
                  <td className="px-4 py-3 text-ink/70">{song.duration}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setEditing(editing === song.id ? null : song.id)}
                      className="text-xs font-semibold text-maroon hover:underline"
                    >
                      {editing === song.id ? "Close" : "Edit"}
                    </button>
                  </td>
                </tr>
                {editing === song.id ? (
                  <tr className="border-t border-ink/10 bg-black/[0.02]">
                    <td colSpan={5} className="px-4 py-4">
                      <EditSong
                        song={song}
                        tree={tree}
                        onSaved={() => {
                          setEditing(null);
                          router.refresh();
                        }}
                      />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditSong({ song, tree, onSaved }: { song: Song; tree: ReturnType<typeof buildFolderTree>; onSaved: () => void }) {
  const [folderId, setFolderId] = useState(song.folderId);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const file = formData.get("audio") as File | null;
        const hasFile = !!file && file.size > 0;
        const contentHash = hasFile ? await sha256(file) : undefined;
        const audioPath = hasFile ? await uploadFile("songs", requestSongUpload, file) : undefined;
        const result = await updateSong({
          id: song.id,
          titleEn: String(formData.get("titleEn") ?? ""),
          titleKn: String(formData.get("titleKn") ?? ""),
          duration: String(formData.get("duration") ?? ""),
          folderId,
          audioPath,
          contentHash,
        });
        if (result.error) setError(result.error);
        else onSaved();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't save");
      }
    });
  }

  return (
    <form action={save} className="max-w-3xl space-y-4">
      <BilingualField label="Title" enName="titleEn" knName="titleKn" defaultEn={song.title.en} defaultKn={song.title.kn} required />
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <span className="text-sm font-medium text-ink/70">Folder</span>
          <FolderSelect categories={tree} value={folderId} onChange={setFolderId} className={inputClass} />
        </div>
        <div>
          <label className="text-sm font-medium text-ink/70" htmlFor={`dur-${song.id}`}>
            Duration
          </label>
          <input id={`dur-${song.id}`} name="duration" defaultValue={song.duration} required className={inputClass} />
        </div>
        <div>
          <label className="text-sm font-medium text-ink/70" htmlFor={`audio-${song.id}`}>
            Replace audio (optional)
          </label>
          <input
            id={`audio-${song.id}`}
            name="audio"
            type="file"
            accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/ogg"
            className="mt-2 w-full text-xs file:mr-2 file:rounded-full file:border-0 file:bg-gold/70 file:px-3 file:py-1.5 file:text-xs file:font-semibold"
          />
        </div>
      </div>
      {error ? <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-600">{error}</p> : null}
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
