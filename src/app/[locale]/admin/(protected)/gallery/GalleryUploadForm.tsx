"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestGalleryUpload, createGalleryItem, checkPhotoDuplicates } from "@/lib/actions/gallery";
import { imageHash, sha256 } from "@/components/admin/fingerprint";
import { extractYoutubeId } from "@/lib/youtube";
import { eachLimited, uploadFile } from "@/components/admin/uploadFile";
import FolderSelect from "@/components/admin/FolderSelect";
import type { FolderTree } from "@/lib/folders";

// createGalleryItem returns a plain result rather than redirecting (see the
// note in src/lib/actions/gallery.ts), so this form refreshes the page itself.

type Status = "checking" | "waiting" | "uploading" | "done" | "failed" | "duplicate";
type QueuedPhoto = {
  file: File;
  preview: string;
  status: Status;
  error?: string;
  contentHash?: string;
  imageHash?: string;
};
type QueuedVideo = { link: string; status: Status; error?: string };

const inputClass =
  "mt-1.5 w-full rounded-xl border border-ink/15 bg-black/[0.03] px-4 py-2.5 text-sm text-ink outline-none focus:border-gold";
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function GalleryUploadForm({ categories }: { categories: FolderTree }) {
  const router = useRouter();
  const [type, setType] = useState<"photo" | "video">("photo");
  const [folderId, setFolderId] = useState("");
  const [photos, setPhotos] = useState<QueuedPhoto[]>([]);
  const [links, setLinks] = useState("");
  const [videos, setVideos] = useState<QueuedVideo[]>([]);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fingerprint each picked photo, then hold back any that repeat one
  // already in the gallery or another in this batch (same file, or the
  // same picture resized/re-saved).
  async function addPhotos(files: FileList | null) {
    const picked = [...(files ?? [])];
    const usable = picked.filter((f) => PHOTO_TYPES.includes(f.type));
    if (usable.length < picked.length) setError(`${picked.length - usable.length} file(s) skipped — use JPG, PNG or WebP.`);
    else setError(null);
    const added = usable.map((file) => ({ file, preview: URL.createObjectURL(file), status: "checking" as const }));
    setPhotos((list) => [...list.filter((p) => p.status !== "done" && p.status !== "duplicate"), ...added]);

    const prints = await Promise.all(
      added.map(async ({ file }) => {
        try {
          return { contentHash: await sha256(file), imageHash: await imageHash(file).catch(() => undefined) };
        } catch {
          return {};
        }
      }),
    );
    let matches: Awaited<ReturnType<typeof checkPhotoDuplicates>> = [];
    try {
      matches = await checkPhotoDuplicates(prints);
    } catch {
      // The server re-checks every upload anyway.
    }
    setPhotos((list) => {
      const seen = new Set(list.filter((p) => !added.some((a) => a.preview === p.preview)).map((p) => p.contentHash));
      return list.map((p) => {
        const i = added.findIndex((a) => a.preview === p.preview);
        if (i < 0) return p;
        const print = prints[i];
        if (matches[i]) return { ...p, ...print, status: "duplicate", error: "Already in the gallery" };
        if (print.contentHash && seen.has(print.contentHash)) return { ...p, ...print, status: "duplicate", error: "Picked twice" };
        seen.add(print.contentHash);
        return { ...p, ...print, status: "waiting" };
      });
    });
  }

  function removePhoto(index: number) {
    setPhotos((list) => {
      URL.revokeObjectURL(list[index].preview);
      return list.filter((_, i) => i !== index);
    });
  }

  async function uploadPhotos() {
    const queue = photos.map((p, i) => ({ ...p, i })).filter((p) => p.status === "waiting" || p.status === "failed");
    const set = (i: number, patch: Partial<QueuedPhoto>) =>
      setPhotos((list) => list.map((p, j) => (j === i ? { ...p, ...patch } : p)));
    let failed = 0;
    await eachLimited(queue, 3, async ({ file, i, contentHash, imageHash }) => {
      set(i, { status: "uploading", error: undefined });
      try {
        const imagePath = await uploadFile("gallery", requestGalleryUpload, file);
        const result = await createGalleryItem({ type: "photo", folderId, imagePath, contentHash, imageHash });
        if (result?.error) throw new Error(result.error);
        set(i, { status: "done" });
      } catch (err) {
        failed++;
        set(i, { status: "failed", error: err instanceof Error ? err.message : "Upload failed" });
      }
    });
    return failed;
  }

  async function uploadVideos() {
    // The same video pasted twice (in any link format) is added once.
    const ids = new Set<string>();
    const list = links
      .split(/\s+/)
      .map((l) => l.trim())
      .filter(Boolean)
      .filter((l) => {
        const id = extractYoutubeId(l) ?? l;
        if (ids.has(id)) return false;
        ids.add(id);
        return true;
      });
    if (!list.length) throw new Error("Paste at least one YouTube link");
    const queue: QueuedVideo[] = list.map((link) => ({ link, status: "waiting" }));
    setVideos(queue);
    const set = (i: number, patch: Partial<QueuedVideo>) =>
      setVideos((all) => all.map((v, j) => (j === i ? { ...v, ...patch } : v)));
    // A custom thumbnail only makes sense for a single video.
    const imagePath = thumbnail && list.length === 1 ? await uploadFile("gallery", requestGalleryUpload, thumbnail) : undefined;
    const failedLinks: string[] = [];
    await eachLimited(queue, 3, async ({ link }, i) => {
      set(i, { status: "uploading" });
      const result = await createGalleryItem({ type: "video", folderId, youtubeId: link, imagePath });
      if (result?.error) {
        failedLinks.push(link);
        set(i, { status: "failed", error: result.error });
      } else set(i, { status: "done" });
    });
    // Leave only the links that didn't go through, to fix and retry.
    setLinks(failedLinks.join("\n"));
    return failedLinks.length;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!folderId) {
      setError("Choose a folder");
      return;
    }
    if (photos.some((p) => p.status === "checking")) {
      setError("Still checking the photos — one moment");
      return;
    }
    if (type === "photo" && !photos.some((p) => p.status === "waiting" || p.status === "failed")) {
      setError("Choose one or more photos");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const failed = type === "photo" ? await uploadPhotos() : await uploadVideos();
      if (failed) setError(`${failed} item(s) didn't upload — see below, then try again.`);
      if (type === "video" && !failed) setThumbnail(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setPending(false);
    }
  }

  const waiting = photos.filter((p) => p.status === "waiting" || p.status === "failed").length;
  const duplicates = photos.filter((p) => p.status === "duplicate").length;
  const linkCount = links.split(/\s+/).filter(Boolean).length;

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-4">
      <div className="flex gap-4 text-sm">
        {(["photo", "video"] as const).map((value) => (
          <label key={value} className="flex items-center gap-1.5 text-ink/80">
            <input type="radio" name="type" value={value} checked={type === value} onChange={() => setType(value)} />
            {value === "photo" ? "Photos" : "YouTube videos"}
          </label>
        ))}
      </div>

      <div className="max-w-xl">
        <label className="text-sm font-medium text-ink/70" htmlFor="folderId">
          Folder
        </label>
        <FolderSelect id="folderId" categories={categories} value={folderId} onChange={setFolderId} className={inputClass} />
      </div>

      {type === "photo" ? (
        <div>
          <label
            htmlFor="files"
            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gold/50 bg-gold/5 px-6 py-8 text-center hover:bg-gold/10"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void addPhotos(e.dataTransfer.files);
            }}
          >
            <span className="text-sm font-semibold text-maroon">Choose photos or drop them here</span>
            <span className="mt-1 text-xs text-ink/50">Select as many as you like — JPG, PNG or WebP</span>
          </label>
          <input
            id="files"
            type="file"
            multiple
            accept={PHOTO_TYPES.join(",")}
            className="sr-only"
            onChange={(e) => {
              void addPhotos(e.target.files);
              e.target.value = "";
            }}
          />
          {photos.length ? (
            <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
              {photos.map((p, i) => (
                <li key={p.preview} className="relative overflow-hidden rounded-xl border border-ink/10">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
                  <img src={p.preview} alt="" className="aspect-square w-full object-cover" />
                  <span className={`absolute inset-x-0 bottom-0 px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[p.status]}`}>
                    {p.status === "duplicate" ? p.error : STATUS_LABEL[p.status]}
                  </span>
                  {p.status === "waiting" || p.status === "failed" || p.status === "duplicate" ? (
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      disabled={pending}
                      className="absolute right-1 top-1 h-6 w-6 rounded-full bg-black/60 text-sm leading-none text-white"
                      aria-label="Remove"
                      title={p.error}
                    >
                      ×
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          {duplicates ? (
            <p className="mt-2 text-xs text-amber-800">
              {duplicates} duplicate photo{duplicates === 1 ? "" : "s"} won&rsquo;t be uploaded.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="max-w-xl space-y-4">
          <div>
            <label className="text-sm font-medium text-ink/70" htmlFor="links">
              YouTube links — one per line
            </label>
            <textarea
              id="links"
              rows={4}
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              placeholder={"https://youtu.be/…\nhttps://youtu.be/…"}
              className={inputClass}
            />
          </div>
          {linkCount <= 1 ? (
            <div>
              <label className="text-sm font-medium text-ink/70" htmlFor="thumb">
                Custom thumbnail (optional — YouTube&rsquo;s is used otherwise)
              </label>
              <input
                id="thumb"
                type="file"
                accept={PHOTO_TYPES.join(",")}
                onChange={(e) => setThumbnail(e.target.files?.[0] ?? null)}
                className="mt-1.5 w-full text-sm text-ink/80 file:mr-3 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-2 file:text-sm file:font-semibold file:text-maroon-dark"
              />
            </div>
          ) : null}
          {videos.length ? (
            <ul className="space-y-1 text-xs">
              {videos.map((v, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 font-semibold ${STATUS_STYLE[v.status]}`}>{STATUS_LABEL[v.status]}</span>
                  <span className="truncate text-ink/70">{v.link}</span>
                  {v.error ? <span className="text-red-600">{v.error}</span> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      {error ? <p className="max-w-xl rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-maroon-dark hover:brightness-105 disabled:opacity-60"
      >
        {pending
          ? "Uploading…"
          : type === "photo"
            ? waiting > 1
              ? `Upload ${waiting} photos`
              : "Upload"
            : linkCount > 1
              ? `Add ${linkCount} videos`
              : "Add video"}
      </button>
    </form>
  );
}

const STATUS_LABEL: Record<Status, string> = {
  checking: "Checking…",
  waiting: "Ready",
  uploading: "Uploading…",
  done: "✓ Added",
  failed: "Failed",
  duplicate: "Duplicate",
};
const STATUS_STYLE: Record<Status, string> = {
  checking: "bg-black/50 text-white",
  duplicate: "bg-amber-600/90 text-white",
  waiting: "bg-black/50 text-white",
  uploading: "bg-amber-500/90 text-white",
  done: "bg-green-600/90 text-white",
  failed: "bg-red-600/90 text-white",
};
