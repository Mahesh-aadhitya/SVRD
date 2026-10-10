"use client";

import { useActionState, useState } from "react";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { requestAcharyaAudioUpload, saveAcharyaMedia } from "@/lib/actions/acharyas";
import { createClient } from "@/lib/supabase/browser";

export default function AcharyaImageForm({
  slug,
  imageUrl,
  audioUrl,
  bundledAudio,
}: {
  slug: string;
  imageUrl: string | null;
  audioUrl: string | null;
  /** The recording that ships with the site, played when none is uploaded. */
  bundledAudio: string | null;
}) {
  const [state, action, pending] = useActionState(saveAcharyaMedia.bind(null, slug), undefined);
  const [audio, setAudio] = useState(audioUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  async function uploadAudio(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setAudioError(null);
    try {
      const upload = await requestAcharyaAudioUpload(file.type);
      if ("error" in upload) throw new Error(upload.error);
      const { error } = await createClient().storage.from("songs").uploadToSignedUrl(upload.path!, upload.token!, file, { cacheControl: "31536000" });
      if (error) throw new Error(error.message);
      setAudio(upload.publicUrl!);
    } catch (err) {
      setAudioError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const playing = audio || bundledAudio;
  return (
    <form action={action} className="flex flex-wrap items-end gap-4">
      <ImageUploadField name="image" prefix="acharyas" defaultValue={imageUrl} label="Picture" aspect={3 / 4} shapeLabel="3 : 4 portrait" />
      <div className="min-w-56">
        <p className="text-sm font-medium text-ink/70">Recording of the composition</p>
        <input type="hidden" name="audio" value={audio} />
        {playing ? <audio controls preload="none" src={playing} className="mt-1.5 h-9 w-56" /> : <p className="mt-1.5 text-xs text-ink/45">No recording yet</p>}
        <p className="mt-0.5 text-[11px] text-ink/45">{audio ? "Your upload" : bundledAudio ? "Built-in (freely licensed) recording" : ""}</p>
        <div className="mt-1 flex items-center gap-2">
          <label className="cursor-pointer rounded-full bg-gold px-3 py-1.5 text-xs font-semibold text-maroon-dark hover:brightness-105">
            {uploading ? "Uploading…" : audio ? "Replace" : "Upload"}
            <input type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/wav" className="sr-only" onChange={(e) => uploadAudio(e.target.files?.[0])} />
          </label>
          {audio ? (
            <button type="button" onClick={() => setAudio("")} className="text-xs font-semibold text-red-600 hover:underline">
              Remove
            </button>
          ) : null}
        </div>
        {audioError ? <p className="mt-1 text-xs text-red-600">{audioError}</p> : null}
      </div>
      <button
        type="submit"
        disabled={pending || uploading}
        className="rounded-full bg-maroon px-4 py-2 text-xs font-semibold text-cream hover:bg-maroon-dark disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      {state?.saved ? <span className="text-xs text-emerald-700">Saved</span> : null}
      {state?.error ? <span className="text-xs text-red-600">{state.error}</span> : null}
    </form>
  );
}
