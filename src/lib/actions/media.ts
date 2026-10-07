"use server";

import { randomUUID } from "crypto";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const PREFIXES = ["sevas", "events", "acharyas"] as const;
export type ImagePrefix = (typeof PREFIXES)[number];

// Seva/event cover images share the public "gallery" bucket under their own
// prefix. Same signed-upload flow as gallery items: the browser PUTs the file
// straight to Storage, then the form submits only the resulting public URL.
export async function requestImageUpload(prefix: ImagePrefix, contentType: string) {
  await verifyAdminSession();
  if (!PREFIXES.includes(prefix)) return { error: "Invalid upload target" };
  const ext = EXT_BY_MIME[contentType];
  if (!ext) return { error: "Use a JPG, PNG or WebP image" };

  const path = `${prefix}/${randomUUID()}.${ext}`;
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from("gallery").createSignedUploadUrl(path);
  if (error || !data) return { error: error?.message ?? "Could not start upload" };

  const { data: pub } = supabase.storage.from("gallery").getPublicUrl(data.path);
  return { path: data.path, token: data.token, publicUrl: pub.publicUrl };
}
