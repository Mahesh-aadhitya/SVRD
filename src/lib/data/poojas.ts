import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Pooja } from "@/lib/placeholder-data";

type PoojaRow = {
  id: string;
  name: { en: string; kn: string };
  description: { en: string; kn: string };
  timing: string;
  is_bookable: boolean;
  image_url: string | null;
  sort_order: number;
};

function mapRow(row: PoojaRow): Pooja {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    timing: row.timing,
    isBookable: row.is_bookable,
    image: row.image_url ?? "/images/placeholder-pooja-1.svg",
  };
}

export const getPoojas = unstable_cache(
  async (): Promise<Pooja[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("poojas")
      .select("id, name, description, timing, is_bookable, image_url, sort_order")
      .order("sort_order");
    if (error) throw new Error(`getPoojas: ${error.message}`);
    return (data ?? []).map(mapRow);
  },
  ["poojas"],
  { tags: ["poojas"] },
);

export async function getPoojaById(id: string): Promise<Pooja | null> {
  const poojas = await getPoojas();
  return poojas.find((p) => p.id === id) ?? null;
}
