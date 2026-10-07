"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { requestSongUpload, createSong, checkSongDuplicates } from "@/lib/actions/songs";
import { sha256 } from "@/components/admin/fingerprint";
import { translateToKannada } from "@/lib/actions/translate";
import { eachLimited, uploadFile } from "@/components/admin/uploadFile";
import FolderSelect from "@/components/admin/FolderSelect";
import type { FolderTree } from "@/lib/folders";

// createSong returns a plain result rather than redirecting (see the note
// in src/lib/actions/gallery.ts), so this form refreshes the page itself.

type Status = "waiting" | "uploading" | "done" | "failed" | "duplicate";
type Track = {
  key: string;
  file: File;
  titleEn: string;
  titleKn: string;
  duration: string;
  translating: boolean;
  contentHash?: string;
  status: Status;
  error?: string;
};

const AUDIO_TYPES = ["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/wav", "audio/x-wav", "audio/ogg"];
const cell =
  "w-full rounded-lg border border-ink/15 bg-black/[0.03] px-2.5 py-1.5 text-sm text-ink outline-none focus:border-gold";

// "01_sri-venkatesa_suprabhatam.mp3" → "Sri Venkatesa Suprabhatam"
function titleFromFilename(name: string) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/^\d+[\s._-]+/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\p{Ll}/gu, (c) => c.toUpperCase());
}

// m:ss (or h:mm:ss) read from the file's own metadata.
function readDuration(file: File) {
  return new Promise<string>((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";
    const done = (value: string) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    audio.onloadedmetadata = () => {
      const total = Math.round(audio.duration);
      if (!Number.isFinite(total)) return done("");
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      const s = String(total % 60).padStart(2, "0");
      done(h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`);
    };
    audio.onerror = () => done("");
    audio.src = url;
  });
}

export default function SongUploadForm({ categories }: { categories: FolderTree }) {
  const router = useRouter();
  const [folderId, setFolderId] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Latest tracks, for async checks that run after several updates.
  const tracksRef = useRef(tracks);
  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  const update = (key: string, patch: Partial<Track>) =>
    setTracks((list) => list.map((t) => (t.key === key ? { ...t, ...patch } : t)));

  async function addFiles(files: FileList | null) {
    const picked = [...(files ?? [])];
    const usable = picked.filter((f) => AUDIO_TYPES.includes(f.type) || /\.(mp3|m4a|wav|ogg)$/i.test(f.name));
    setError(usable.length < picked.length ? `${picked.length - usable.length} file(s) skipped — use MP3, M4A, WAV or OGG.` : null);
    const added: Track[] = usable.map((file) => ({
      key: `${file.name}-${file.size}-${Math.random()}`,
      file,
      titleEn: titleFromFilename(file.name),
      titleKn: "",
      duration: "",
      translating: true,
      status: "waiting",
    }));
    setTracks((list) => [...list.filter((t) => t.status !== "done"), ...added]);
    // Fill in each track's fingerprint, duration and a Kannada title in
    // the background.
    await eachLimited(added, 2, async (track) => {
      const [contentHash, duration, kn] = await Promise.all([
        sha256(track.file).catch(() => undefined),
        readDuration(track.file),
        track.titleEn ? translateToKannada(track.titleEn).catch(() => null) : null,
      ]);
      setTracks((list) =>
        list.map((t) =>
          t.key === track.key
            ? { ...t, contentHash, duration: t.duration || duration, titleKn: t.titleKn || (kn?.ok ? kn.text : ""), translating: false }
            : t,
        ),
      );
    });
    void findDuplicates();
  }

  // Marks tracks that repeat a song already in the library or another track
  // in this batch — by audio file, or by title. Returns the tracks to upload.
  async function findDuplicates() {
    // Let the latest updates render (and reach the ref) first.
    await new Promise((resolve) => setTimeout(resolve, 0));
    const open = tracksRef.current.filter((t) => t.status !== "done" && t.status !== "uploading");
    let reasons: (string | null)[] = [];
    try {
      reasons = await checkSongDuplicates(open.map((t) => ({ contentHash: t.contentHash, titleEn: t.titleEn, titleKn: t.titleKn })));
    } catch {
      // The server re-checks every upload anyway.
    }
    const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
    const marks = new Map<string, string | null>();
    open.forEach((t, i) => {
      const earlier = open.slice(0, i).filter((o) => !marks.get(o.key));
      const twin = earlier.find(
        (o) =>
          (t.contentHash && o.contentHash === t.contentHash) ||
          norm(o.titleEn) === norm(t.titleEn) ||
          (t.titleKn && norm(o.titleKn) === norm(t.titleKn)),
      );
      marks.set(t.key, reasons[i] ?? (twin ? `Same as "${twin.titleEn}" above` : null));
    });
    setTracks((list) =>
      list.map((t) =>
        marks.has(t.key)
          ? marks.get(t.key)
            ? { ...t, status: "duplicate", error: marks.get(t.key)! }
            : t.status === "duplicate"
              ? { ...t, status: "waiting", error: undefined }
              : t
          : t,
      ),
    );
    return open.filter((t) => !marks.get(t.key));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!folderId) return setError("Choose a folder");
    if (tracks.some((t) => t.translating)) return setError("Still reading the files — one moment");
    const pendingTracks = tracks.filter((t) => t.status !== "done");
    if (!pendingTracks.length) return setError("Choose one or more audio files");
    if (pendingTracks.some((t) => !t.titleEn.trim() || !t.titleKn.trim() || !t.duration.trim())) {
      return setError("Every track needs an English title, a Kannada title and a duration");
    }
    setPending(true);
    setError(null);
    // Titles may have been edited since the files were picked.
    const queue = await findDuplicates();
    if (!queue.length) {
      setPending(false);
      return setError("Every track here is already in the library.");
    }
    let failed = 0;
    await eachLimited(queue, 2, async (track) => {
      update(track.key, { status: "uploading", error: undefined });
      try {
        const audioPath = await uploadFile("songs", requestSongUpload, track.file);
        const result = await createSong({
          titleEn: track.titleEn,
          titleKn: track.titleKn,
          folderId,
          duration: track.duration,
          audioPath,
          contentHash: track.contentHash ?? "",
        });
        if (result?.error) throw new Error(result.error);
        update(track.key, { status: "done" });
      } catch (err) {
        failed++;
        update(track.key, { status: "failed", error: err instanceof Error ? err.message : "Upload failed" });
      }
    });
    if (failed) setError(`${failed} track(s) didn't upload — check them below and try again.`);
    setPending(false);
    router.refresh();
  }

  const waiting = tracks.filter((t) => t.status === "waiting" || t.status === "failed").length;

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-4">
      <div className="max-w-xl">
        <label className="text-sm font-medium text-ink/70" htmlFor="folderId">
          Folder
        </label>
        <FolderSelect id="folderId" categories={categories} value={folderId} onChange={setFolderId} className={`${cell} mt-1.5 py-2.5`} />
      </div>

      <label
        htmlFor="audioFiles"
        className="flex max-w-xl cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gold/50 bg-gold/5 px-6 py-8 text-center hover:bg-gold/10"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void addFiles(e.dataTransfer.files);
        }}
      >
        <span className="text-sm font-semibold text-maroon">Choose songs or drop them here</span>
        <span className="mt-1 text-xs text-ink/50">
          Select as many as you like. Titles come from the file names, durations from the files, and Kannada titles are suggested — check them before uploading.
        </span>
      </label>
      <input
        id="audioFiles"
        type="file"
        multiple
        accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/ogg"
        className="sr-only"
        onChange={(e) => {
          void addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {tracks.length ? (
        <div className="overflow-x-auto rounded-2xl border border-ink/10">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-black/[0.03] text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-3 py-2 font-medium">Title (English)</th>
                <th className="px-3 py-2 font-medium">Title (Kannada)</th>
                <th className="w-24 px-3 py-2 font-medium">Duration</th>
                <th className="w-28 px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((t) => {
                const locked = t.status === "done" || t.status === "uploading";
                return (
                  <tr key={t.key} className="border-t border-ink/10 align-top">
                    <td className="px-3 py-2">
                      <input
                        value={t.titleEn}
                        disabled={locked}
                        onChange={(e) => update(t.key, { titleEn: e.target.value })}
                        onBlur={() => void findDuplicates()}
                        className={cell}
                      />
                      <p className="mt-0.5 truncate text-[10px] text-ink/40">{t.file.name}</p>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={t.titleKn}
                        disabled={locked}
                        placeholder={t.translating ? "Translating…" : ""}
                        onChange={(e) => update(t.key, { titleKn: e.target.value })}
                        onBlur={() => void findDuplicates()}
                        className={cell}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={t.duration}
                        disabled={locked}
                        placeholder="6:15"
                        onChange={(e) => update(t.key, { duration: e.target.value })}
                        className={cell}
                      />
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <span className={STATUS_STYLE[t.status]}>{STATUS_LABEL[t.status]}</span>
                      {t.error ? <p className={`mt-0.5 ${t.status === "duplicate" ? "text-amber-800" : "text-red-600"}`}>{t.error}</p> : null}
                      {!locked ? (
                        <button
                          type="button"
                          onClick={() => setTracks((list) => list.filter((x) => x.key !== t.key))}
                          className="mt-1 block text-ink/45 hover:text-red-600"
                        >
                          Remove
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {error ? <p className="max-w-xl rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={pending || !waiting}
        className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-maroon-dark hover:brightness-105 disabled:opacity-60"
      >
        {pending ? "Uploading…" : waiting > 1 ? `Upload ${waiting} songs` : "Upload"}
      </button>
    </form>
  );
}

const STATUS_LABEL: Record<Status, string> = {
  waiting: "Ready",
  uploading: "Uploading…",
  done: "✓ Added",
  failed: "Failed",
  duplicate: "Duplicate — skipped",
};
const STATUS_STYLE: Record<Status, string> = {
  duplicate: "font-semibold text-amber-700",
  waiting: "text-ink/50",
  uploading: "font-semibold text-amber-700",
  done: "font-semibold text-green-700",
  failed: "font-semibold text-red-600",
};
