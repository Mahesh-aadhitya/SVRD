import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { TempleInfo } from "@/lib/content-types";

export const getTempleInfo = unstable_cache(
  async (): Promise<TempleInfo> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("temple_info")
      .select("address_line1, address_line2, phone, email, maps_query, about, timings")
      .eq("id", true)
      .single();
    if (error) throw new Error(`getTempleInfo: ${error.message}`);
    return {
      addressLine1: data.address_line1,
      addressLine2: data.address_line2,
      phone: data.phone,
      email: data.email,
      mapsQuery: data.maps_query,
      about: data.about,
      timings: data.timings ?? [],
    };
  },
  ["temple-info"],
  { tags: ["temple-info"] },
);
