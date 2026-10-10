"use server";

import { getCurrentAdmin } from "@/lib/admin/dal";

// Whether the signed-in user is a temple admin (an admin_users row) — lets
// public pages show the staff link only to staff.
export async function isSignedInAdmin(): Promise<boolean> {
  return (await getCurrentAdmin()) !== null;
}
