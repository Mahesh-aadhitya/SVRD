import "server-only";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";

// Everyone who has made an account on the site (temple staff excluded), for
// the admin Devotees page and its CSV export. Mobile numbers come from the
// devotee's profile, or else the latest seva booking they made — the
// sign-up forms don't ask for one.

export type DevoteeAccount = {
  id: string;
  name: string;
  email: string;
  phone: string;
  method: "google" | "email";
  verified: boolean;
  createdAt: string;
  joinedThisWeek: boolean;
  lastSignInAt: string | null;
  bookings: number;
};

export async function getDevoteesForAdmin(q?: string): Promise<DevoteeAccount[]> {
  await verifyAdminSession();
  const supabase = createAdminClient();

  const users = [];
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`getDevoteesForAdmin: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }

  const [profiles, admins, bookings] = await Promise.all([
    supabase.from("devotee_profiles").select("id, full_name, phone"),
    supabase.from("admin_users").select("id"),
    supabase.from("bookings").select("user_id, phone, created_at").not("user_id", "is", null).order("created_at", { ascending: false }),
  ]);
  for (const r of [profiles, admins, bookings]) if (r.error) throw new Error(`getDevoteesForAdmin: ${r.error.message}`);

  const profile = new Map((profiles.data ?? []).map((p) => [p.id, p]));
  const staff = new Set((admins.data ?? []).map((a) => a.id));
  const booked = new Map<string, { phone: string; count: number }>();
  for (const b of bookings.data ?? []) {
    const seen = booked.get(b.user_id);
    if (seen) seen.count++;
    else booked.set(b.user_id, { phone: b.phone, count: 1 });
  }

  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const devotees = users
    .filter((u) => !staff.has(u.id))
    .map((u): DevoteeAccount => {
      const meta = u.user_metadata ?? {};
      const p = profile.get(u.id);
      return {
        id: u.id,
        name: p?.full_name || String(meta.full_name ?? meta.name ?? ""),
        email: u.email ?? "",
        phone: p?.phone || booked.get(u.id)?.phone || "",
        method: u.app_metadata?.provider === "google" ? "google" : "email",
        verified: !!u.email_confirmed_at,
        createdAt: u.created_at,
        joinedThisWeek: u.created_at >= weekAgo,
        lastSignInAt: u.last_sign_in_at ?? null,
        bookings: booked.get(u.id)?.count ?? 0,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const needle = q?.trim().toLowerCase();
  if (!needle) return devotees;
  return devotees.filter((d) => [d.name, d.email, d.phone].some((v) => v.toLowerCase().includes(needle)));
}
