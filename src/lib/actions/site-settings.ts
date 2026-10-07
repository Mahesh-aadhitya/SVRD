"use server";

import { z } from "zod";
import { randomUUID } from "crypto";
import { updateTag } from "next/cache";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";

const AUDIO_EXT: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/ogg": "ogg",
};

const IMAGE_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

async function signedUpload(bucket: "songs" | "gallery", path: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) return { error: error?.message ?? "Could not start upload" };
  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return { path: data.path, token: data.token, publicUrl: pub.publicUrl };
}

async function saveSettings(update: Record<string, unknown>) {
  const { error } = await createAdminClient().from("site_settings").update(update).eq("id", true);
  if (error) return { error: error.message };
  updateTag("site-settings");
  return { success: true as const };
}

// ── Background song ──────────────────────────────────────────────────────

export async function requestBackgroundAudioUpload(contentType: string) {
  await verifyAdminSession();
  const ext = AUDIO_EXT[contentType];
  if (!ext) return { error: "Use an MP3, M4A, WAV or OGG file" };
  return signedUpload("songs", `background/${randomUUID()}.${ext}`);
}

const audioSchema = z.object({
  // Our own Storage (an uploaded file or a song from the library), or null
  // for the built-in chant.
  url: z
    .string()
    .trim()
    .max(1000)
    .refine((u) => u.startsWith(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`), "Choose an uploaded song")
    .nullable(),
  title: z.string().trim().max(150),
});

export async function setBackgroundAudio(input: { url: string | null; title: string }) {
  await verifyAdminSession();
  const parsed = audioSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid song" };
  return saveSettings({ background_audio_url: parsed.data.url, background_audio_title: parsed.data.url ? parsed.data.title : "" });
}

// ── UPI payment details ──────────────────────────────────────────────────

export async function requestUpiQrUpload(contentType: string) {
  await verifyAdminSession();
  const ext = IMAGE_EXT[contentType];
  if (!ext) return { error: "Use a JPG, PNG or WebP image" };
  return signedUpload("gallery", `payments/${randomUUID()}.${ext}`);
}

const upiSchema = z.object({
  // name@bank — the virtual payment address.
  upiId: z.union([z.literal(""), z.string().regex(/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.]{1,63}$/, "Enter a valid UPI ID, like templename@okaxis")]),
  upiNumber: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .pipe(z.union([z.literal(""), z.string().regex(/^(\+91)?[6-9][0-9]{9}$/, "Enter the 10-digit mobile number linked to UPI")])),
  upiPayeeName: z.string().trim().max(100),
  upiQrUrl: z
    .string()
    .trim()
    .max(1000)
    .refine((u) => !u || u.startsWith(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`), "Upload the QR image")
    .transform((u) => u || null),
});

export type UpiSettingsState = { error?: string; success?: boolean } | undefined;

export async function updateUpiSettings(_prev: UpiSettingsState, formData: FormData): Promise<UpiSettingsState> {
  await verifyAdminSession();
  const parsed = upiSchema.safeParse({
    upiId: String(formData.get("upiId") ?? "").trim(),
    upiNumber: formData.get("upiNumber") ?? "",
    upiPayeeName: formData.get("upiPayeeName") ?? "",
    upiQrUrl: formData.get("upiQrUrl") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the details" };
  return saveSettings({
    upi_id: parsed.data.upiId,
    upi_number: parsed.data.upiNumber,
    upi_payee_name: parsed.data.upiPayeeName,
    upi_qr_url: parsed.data.upiQrUrl,
  });
}
