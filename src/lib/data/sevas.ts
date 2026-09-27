import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Seva } from "@/lib/seva-types";

type SevaRow = {
  id: string;
  name: { en: string; kn: string };
  description: { en: string; kn: string };
  price: number;
  capacity_per_slot: number;
  is_active: boolean;
  release_start_date: string | null;
  release_end_date: string | null;
};

const SEVA_COLUMNS =
  "id, name, description, price, capacity_per_slot, is_active, release_start_date, release_end_date";

function mapRow(row: SevaRow): Seva {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    capacityPerSlot: row.capacity_per_slot,
    isActive: row.is_active,
    releaseStartDate: row.release_start_date,
    releaseEndDate: row.release_end_date,
  };
}

// Devotee-facing: only active sevas (matches the sevas_public_read RLS
// policy, which already filters on is_active — this stays cached/fast).
export const getActiveSevas = unstable_cache(
  async (): Promise<Seva[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase.from("sevas").select(SEVA_COLUMNS).order("sort_order");
    if (error) throw new Error(`getActiveSevas: ${error.message}`);
    return (data ?? []).map(mapRow);
  },
  ["sevas-active"],
  { tags: ["sevas"] },
);

// Admin-facing: every seva including inactive ones, so the admin can
// reactivate a closed seva. Bypasses RLS via the service-role client, so it
// must never be exposed to a non-admin caller — always call after (or via a
// function that itself calls) verifyAdminSession().
export async function getAllSevasForAdmin(): Promise<Seva[]> {
  await verifyAdminSession();
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("sevas").select(SEVA_COLUMNS).order("sort_order");
  if (error) throw new Error(`getAllSevasForAdmin: ${error.message}`);
  return (data ?? []).map(mapRow);
}

export async function getSevaByIdForAdmin(id: string): Promise<Seva | null> {
  const sevas = await getAllSevasForAdmin();
  return sevas.find((s) => s.id === id) ?? null;
}
