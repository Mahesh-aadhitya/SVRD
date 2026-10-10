"use server";

import { z } from "zod";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { whatsappOffice } from "@/lib/notify/whatsapp";

export type WhatsappSettingsState = { error?: string; success?: string } | undefined;

const schema = z.object({
  // Digits with country code; a 10-digit Indian mobile gets 91 in front.
  phone: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .transform((v) => (v.length === 10 ? `91${v}` : v))
    .refine((v) => v === "" || /^\d{11,15}$/.test(v), "Enter the mobile number with country code, e.g. 917019106741"),
  apikey: z.string().trim().max(100),
});

// Saves the phone and, if one was typed, a new API key (an empty key field
// keeps the saved one; "Remove key" clears it).
export async function updateWhatsappSettings(_prev: WhatsappSettingsState, formData: FormData): Promise<WhatsappSettingsState> {
  await verifyAdminSession();
  const parsed = schema.safeParse({ phone: String(formData.get("phone") ?? ""), apikey: String(formData.get("apikey") ?? "") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the details" };
  const clear = formData.get("clearKey") === "1";
  const { error } = await createAdminClient()
    .from("notification_settings")
    .upsert({
      id: 1,
      whatsapp_phone: parsed.data.phone,
      ...(clear ? { callmebot_api_key: "" } : parsed.data.apikey ? { callmebot_api_key: parsed.data.apikey } : {}),
      updated_at: new Date().toISOString(),
    });
  if (error) return { error: "Couldn't save. Please try again." };
  return { success: clear ? "Key removed." : "Saved." };
}

export async function sendWhatsappTest(): Promise<{ ok: boolean; message: string }> {
  await verifyAdminSession();
  try {
    await whatsappOffice("🛕 ಶ್ರೀ ವರದ ಸಂದೇಶ — ಪರೀಕ್ಷಾ ಸಂದೇಶ.\nಹೊಸ ಸೇವಾ ಬುಕಿಂಗ್‌ಗಳ ವಿವರ ಇನ್ನು ಮುಂದೆ ಇಲ್ಲಿ ಬರುತ್ತದೆ.\n(Test message from the temple website.)");
    return { ok: true, message: "Test message sent — check WhatsApp on that phone." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Sending failed" };
  }
}
