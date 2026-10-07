"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { requestBackgroundAudioUpload, setBackgroundAudio } from "@/lib/actions/site-settings";
import { uploadFile } from "@/components/admin/uploadFile";
import { DEFAULT_BACKGROUND_AUDIO } from "@/lib/content-types";
import type { Song } from "@/lib/song-types";

const input =
  "mt-1.5 w-full rounded-xl border border-ink/15 bg-black/[0.03] px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-gold";

// The one song that plays softly in the background across the website:
// the built-in chant, a track from the Songs library, or a new upload.
export default function BackgroundSongForm({
  current,
  currentTitle,
  songs,
}: {
  current: string | null;
  currentTitle: string;
  songs: Song[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const library = songs.filter((s) => s.audioUrl);
  const playing = current ?? DEFAULT_BACKGROUND_AUDIO;
  const label = current ? currentTitle || "Uploaded song" : "Om Namo Narayanaya (built-in chant)";

  function save(url: string | null, title: string) {
    setMessage(null);
    startTransition(async () => {
      const r = await setBackgroundAudio({ url, title });
      setMessage(r.error ? { ok: false, text: r.error } : { ok: true, text: "Saved — the website now plays this song." });
      if (!r.error) router.refresh();
    });
  }

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      let publicUrl = "";
      await uploadFile(
        "songs",
        async (type) => {
          const r = await requestBackgroundAudioUpload(type);
          publicUrl = ("publicUrl" in r ? r.publicUrl : "") ?? "";
          return r;
        },
        file,
      );
      save(publicUrl, file.name.replace(/\.[^.]+$/, ""));
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : "Upload failed" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-xl rounded-2xl border border-ink/10 bg-black/[0.03] p-5 sm:p-6">
      <p className="font-medium text-ink">Website background song</p>
      <p className="text-xs text-ink/50">
        Plays softly on every page (visitors can mute it). It stops automatically on the Live page and while a song from the
        Songs page is playing.
      </p>

      <div className="mt-4 rounded-xl border border-gold/30 bg-white/70 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Now playing</p>
        <p className="mt-0.5 text-sm font-medium text-ink">{label}</p>
        <audio src={playing} controls preload="none" className="mt-2 w-full" />
      </div>

      <label className="mt-5 block text-sm font-medium text-ink/70" htmlFor="bg-library">
        Choose from the Songs library
      </label>
      <select
        id="bg-library"
        disabled={pending || !library.length}
        value={library.find((s) => s.audioUrl === current)?.id ?? ""}
        onChange={(e) => {
          const song = library.find((s) => s.id === e.target.value);
          if (song?.audioUrl) save(song.audioUrl, song.title.en);
        }}
        className={input}
      >
        <option value="">{library.length ? "— Pick a song —" : "No songs uploaded yet"}</option>
        {library.map((s) => (
          <option key={s.id} value={s.id}>
            {s.title.en}
            {s.title.kn && s.title.kn !== s.title.en ? ` · ${s.title.kn}` : ""}
          </option>
        ))}
      </select>

      <div className="mt-4 flex flex-wrap gap-2">
        <input ref={fileRef} type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/ogg,.mp3,.m4a" onChange={upload} className="hidden" />
        <button
          type="button"
          disabled={pending || uploading}
          onClick={() => fileRef.current?.click()}
          className="rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Upload a new song"}
        </button>
        {current ? (
          <button
            type="button"
            disabled={pending || uploading}
            onClick={() => save(null, "")}
            className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink/70 hover:bg-black/[0.04] disabled:opacity-50"
          >
            Use the built-in chant
          </button>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-ink/45">MP3 or M4A, up to 30 MB. A short, loop-friendly track works best.</p>

      {message ? (
        <p className={`mt-3 rounded-xl px-3 py-2 text-sm ${message.ok ? "bg-green-600/10 text-green-800" : "bg-red-500/10 text-red-700"}`}>
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
