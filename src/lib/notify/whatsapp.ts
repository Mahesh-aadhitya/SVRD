import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// WhatsApp alerts to the temple priest's phone, through CallMeBot's free
// API (https://www.callmebot.com/blog/free-api-whatsapp-messages/). The
// receiving phone opts in once by WhatsApp-ing the bot "I allow callmebot
// to send me messages" and gets back an API key.
//
// The phone (with country code, e.g. 917019106741) and key are entered in
// Admin → Payments (notification_settings); WHATSAPP_NOTIFY_PHONE and
// CALLMEBOT_API_KEY fill in whatever is left empty there. Without both,
// development prints the message instead.

export async function getWhatsappSettings() {
  const { data } = await createAdminClient()
    .from("notification_settings")
    .select("whatsapp_phone, callmebot_api_key")
    .eq("id", 1)
    .maybeSingle();
  return {
    phone: data?.whatsapp_phone || process.env.WHATSAPP_NOTIFY_PHONE || "",
    apikey: data?.callmebot_api_key || process.env.CALLMEBOT_API_KEY || "",
  };
}

export async function whatsappOffice(text: string) {
  const { phone, apikey } = await getWhatsappSettings();
  if (!phone || !apikey) {
    if (process.env.NODE_ENV !== "production") console.warn(`[dev] WhatsApp to office:\n${text}`);
    return;
  }
  const url = new URL("https://api.callmebot.com/whatsapp.php");
  url.search = new URLSearchParams({ phone, text, apikey }).toString();
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
  const body = await res.text();
  // CallMeBot answers 200 even for some failures; its page then says so.
  if (!res.ok || /error|invalid|not (been )?activated|apikey is not/i.test(body)) {
    throw new Error(`CallMeBot ${res.status}: ${body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200)}`);
  }
}
