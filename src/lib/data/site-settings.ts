import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { SiteSettings } from "@/lib/content-types";

const EMPTY: SiteSettings = {
  backgroundAudioUrl: null,
  backgroundAudioTitle: "",
  upiId: "",
  upiNumber: "",
  upiPayeeName: "",
  upiQrUrl: null,
};

// Uncached, for the admin forms: they must show what was last saved.
export async function fetchSiteSettings(): Promise<SiteSettings> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("background_audio_url, background_audio_title, upi_id, upi_number, upi_payee_name, upi_qr_url")
    .eq("id", true)
    .maybeSingle();
  if (error) throw new Error(`getSiteSettings: ${error.message}`);
  if (!data) return EMPTY;
  return {
    backgroundAudioUrl: data.background_audio_url,
    backgroundAudioTitle: data.background_audio_title ?? "",
    upiId: data.upi_id ?? "",
    upiNumber: data.upi_number ?? "",
    upiPayeeName: data.upi_payee_name ?? "",
    upiQrUrl: data.upi_qr_url,
  };
}

export const getSiteSettings = unstable_cache(fetchSiteSettings, ["site-settings"], { tags: ["site-settings"] });
