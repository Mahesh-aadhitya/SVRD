"use client";

import { useState } from "react";
import Image from "next/image";
import { requestImageUpload, type ImagePrefix } from "@/lib/actions/media";
import { createClient } from "@/lib/supabase/browser";

// Uploads the chosen file straight to Supabase Storage as soon as it's
// picked, then carries only the resulting public URL in a hidden input so
// the surrounding form's Server Action never receives the file bytes.
export default function ImageUploadField({
  name,
  prefix,
  defaultValue,
  label = "Cover image",
}: {
  name: string;
  prefix: ImagePrefix;
  defaultValue?: string | null;
  label?: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const upload = await requestImageUpload(prefix, file.type);
      if ("error" in upload) throw new Error(upload.error);
      const { error: uploadError } = await createClient()
        .storage.from("gallery")
        .uploadToSignedUrl(upload.path!, upload.token!, file, { cacheControl: "31536000" });
      if (uploadError) throw new Error(uploadError.message);
      setUrl(upload.publicUrl!);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <p className="text-sm font-medium text-ink/70">{label}</p>
      <input type="hidden" name={name} value={url} />
      <div className="mt-1.5 flex items-center gap-4">
        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-ink/10 bg-black/[0.03]">
          {url ? (
            <Image src={url} alt="" fill sizes="112px" className="object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-[11px] text-ink/40">No image</span>
          )}
        </div>
        <div className="flex flex-col items-start gap-2">
          <label className="cursor-pointer rounded-full bg-gold px-4 py-2 text-xs font-semibold text-maroon-dark hover:brightness-105">
            {uploading ? "Uploading…" : url ? "Replace" : "Upload"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
          {url ? (
            <button type="button" onClick={() => setUrl("")} className="text-xs font-semibold text-red-600 hover:underline">
              Remove
            </button>
          ) : null}
        </div>
      </div>
      {error ? <p className="mt-2 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
