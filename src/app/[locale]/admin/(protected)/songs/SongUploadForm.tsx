"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { requestSongUpload, createSong } from "@/lib/actions/songs";
import { createClient } from "@/lib/supabase/browser";
import type { FolderTree } from "@/lib/folders";

export default function SongUploadForm({ categories }: { categories: FolderTree }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const folderId = String(formData.get("folderId") ?? "");
    const titleEn = String(formData.get("titleEn") ?? "").trim();
    const titleKn = String(formData.get("titleKn") ?? "").trim();
    const duration = String(formData.get("duration") ?? "").trim();
    const file = formData.get("file") as File | null;
    if (!folderId || !titleEn || !titleKn || !duration) {
      setError("Fill in every field");
      return;
    }
    if (!file || file.size === 0) {
      setError("Choose an audio file");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const upload = await requestSongUpload(file.type);
      if ("error" in upload) throw new Error(upload.error);

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("songs")
        // Random UUID filename -> content at this URL never changes, so a
        // year-long cache is safe and keeps repeat playback instant.
        .uploadToSignedUrl(upload.path!, upload.token!, file, { cacheControl: "31536000" });
      if (uploadError) throw new Error(uploadError.message);

      const result = await createSong({
        titleEn,
        titleKn,
        folderId,
        duration,
        audioPath: upload.path!,
      });
      if (result?.error) throw new Error(result.error);

      formRef.current?.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className="max-w-xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title (English)" name="titleEn" required />
        <Field label="Title (Kannada)" name="titleKn" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-ink/70" htmlFor="folderId">
            Folder
          </label>
          <select
            id="folderId"
            name="folderId"
            required
            defaultValue=""
            className="mt-1.5 w-full rounded-xl border border-ink/15 bg-black/[0.03] px-4 py-2.5 text-sm text-ink outline-none focus:border-gold"
          >
            <option value="" disabled>
              Select a folder…
            </option>
            {categories.map((category) => (
              <optgroup key={category.id} label={category.name}>
                <option value={category.id}>{category.name}</option>
                {category.subfolders.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {category.name} / {sub.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <Field label="Duration" name="duration" placeholder="e.g. 6:15" required />
      </div>

      <div>
        <label className="text-sm font-medium text-ink/70" htmlFor="file">
          Audio file
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept="audio/mpeg,audio/mp4,audio/wav,audio/ogg"
          required
          className="mt-1.5 w-full text-sm text-ink/80 file:mr-3 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-2 file:text-sm file:font-semibold file:text-maroon-dark"
        />
      </div>

      {error ? <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-maroon-dark hover:brightness-105 disabled:opacity-60"
      >
        {pending ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-ink/70" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        placeholder={placeholder}
        required={required}
        className="mt-1.5 w-full rounded-xl border border-ink/15 bg-black/[0.03] px-4 py-2.5 text-sm text-ink outline-none focus:border-gold"
      />
    </div>
  );
}
