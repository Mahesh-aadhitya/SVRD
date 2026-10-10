import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { TempleInfo } from "@/lib/content-types";
import { tidyAddress } from "@/lib/tidy";

// Uncached, for the admin form: it must show what was last saved.
export async function fetchTempleInfo(): Promise<TempleInfo> {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("temple_info")
      .select("address_line1, address_line2, phone, email, maps_query, maps_url, maps_place, maps_place_id, lat, lon, about, timings")
      .eq("id", true)
      .single();
    if (error) throw new Error(`getTempleInfo: ${error.message}`);
    return {
      addressLine1: tidyAddress(data.address_line1 ?? ""),
      addressLine2: tidyAddress(data.address_line2 ?? ""),
      phone: data.phone,
      email: data.email,
      mapsQuery: data.maps_query,
      mapsUrl: data.maps_url ?? "",
      mapsPlace: data.maps_place ?? "",
      mapsPlaceId: data.maps_place_id ?? "",
      lat: data.lat,
      lon: data.lon,
      about: data.about,
      timings: data.timings ?? [],
    };
}

export const getTempleInfo = unstable_cache(fetchTempleInfo, ["temple-info"], { tags: ["temple-info"] });
