"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { requestGalleryUpload, createGalleryItem } from "@/lib/actions/gallery";
import { createClient } from "@/lib/supabase/browser";
import type { FolderTree } from "@/lib/folders";

export default function GalleryUploadForm({ categories }: { categories: FolderTree }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<"photo" | "video">("photo");
  const [youtubeId, setYoutubeId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const folderId = String(formData.get("folderId") ?? "");
    const file = formData.get("file") as File | null;
    if (!folderId) {
      setError("Choose a folder");
      return;
    }
    const hasFile = !!file && file.size > 0;
    if (type === "photo" && !hasFile) {
      setError("Choose an image");
      return;
    }
    if (type === "video" && !youtubeId.trim()) {
      setError("Paste the YouTube link");
      return;
    }

    setPending(true);
    setError(null);
    try {
      let imagePath: string | undefined;
      if (file && hasFile) {
        const upload = await requestGalleryUpload(file.type);
        if ("error" in upload) throw new Error(upload.error);

        const supabase = createClient();
        const { error: uploadError } = await supabase.storage
          .from("gallery")
          // Filenames are random UUIDs (see requestGalleryUpload) so a URL's
          // content never changes — safe to cache for a full year at the CDN
          // edge and in every visitor's browser, which is what keeps a page
          // with dozens of images loading instantly under crowd load.
          .uploadToSignedUrl(upload.path!, upload.token!, file, { cacheControl: "31536000" });
        if (uploadError) throw new Error(uploadError.message);
        imagePath = upload.path!;
      }

      const result = await createGalleryItem({
        type,
        folderId,
        imagePath,
        youtubeId: type === "video" ? youtubeId : undefined,
      });
      if (result?.error) throw new Error(result.error);

      formRef.current?.reset();
      setType("photo");
      setYoutubeId("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className="max-w-xl space-y-4">
      <div className="flex gap-4 text-sm">
        {(["photo", "video"] as const).map((value) => (
          <label key={value} className="flex items-center gap-1.5 text-ink/80">
            <input
              type="radio"
              name="type"
              value={value}
              checked={type === value}
              onChange={() => setType(value)}
            />
            {value === "photo" ? "Photo" : "Video (with thumbnail)"}
          </label>
        ))}
      </div>

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

      {type === "video" ? (
        <div>
          <label className="text-sm font-medium text-ink/70" htmlFor="youtubeId">
            YouTube link or video ID
          </label>
          <input
            id="youtubeId"
            value={youtubeId}
            onChange={(e) => setYoutubeId(e.target.value)}
            placeholder="https://youtu.be/…"
            className="mt-1.5 w-full rounded-xl border border-ink/15 bg-black/[0.03] px-4 py-2.5 text-sm text-ink outline-none focus:border-gold"
          />
        </div>
      ) : null}

      <div>
        <label className="text-sm font-medium text-ink/70" htmlFor="file">
          {type === "photo" ? "Image" : "Custom thumbnail (optional — YouTube's is used otherwise)"}
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required={type === "photo"}
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
