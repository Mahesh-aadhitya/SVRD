"use client";

import { createClient } from "@/lib/supabase/browser";

// Signed-upload flow shared by the admin's file pickers: the server hands
// out a one-time URL for a random-UUID path, and the browser PUTs the file
// straight to Storage. Returns the stored path.
export async function uploadFile(
  bucket: "gallery" | "songs" | "payment-proofs",
  request: (contentType: string) => Promise<{ path?: string; token?: string; error?: string }>,
  file: File,
) {
  const upload = await request(file.type);
  if (upload.error || !upload.path || !upload.token) throw new Error(upload.error ?? "Could not start upload");
  const { error } = await createClient()
    .storage.from(bucket)
    // Filenames are random UUIDs, so a URL's content never changes — safe
    // to cache for a full year at the CDN edge and in every browser, which
    // keeps pages with dozens of files loading instantly under crowd load.
    .uploadToSignedUrl(upload.path, upload.token, file, { cacheControl: "31536000" });
  if (error) throw new Error(error.message);
  return upload.path;
}

// Runs `task` over `items` a few at a time (uploads in parallel, but not
// so many that a phone on temple Wi-Fi chokes).
export async function eachLimited<T>(items: T[], limit: number, task: (item: T, index: number) => Promise<void>) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        await task(items[i], i);
      }
    }),
  );
}
