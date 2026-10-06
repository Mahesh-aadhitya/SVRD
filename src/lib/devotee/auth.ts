import "server-only";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DevoteeProfile } from "@/lib/devotee/types";

export type Devotee = { id: string; email: string; name: string; avatarUrl: string | null };

// The signed-in devotee (Google account via Supabase Auth), or null.
// getUser() checks the token with the Auth server, so this is safe to rely
// on for "whose bookings / donations are these".
export async function getDevotee(): Promise<Devotee | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? "",
    name: String(meta.full_name ?? meta.name ?? user.email ?? ""),
    avatarUrl: typeof meta.avatar_url === "string" ? meta.avatar_url : null,
  };
}

// Server Components: sends a signed-out visitor to the login page, then
// back to `next` after signing in.
export async function requireDevotee(locale: string, next: string): Promise<Devotee> {
  const devotee = await getDevotee();
  if (!devotee) {
    redirect({ href: { pathname: "/login", query: { next } }, locale });
    throw new Error("unreachable");
  }
  return devotee;
}

type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  gotram: string | null;
  nakshatram: string | null;
};

const mapProfile = (row: ProfileRow): DevoteeProfile => ({
  fullName: row.full_name,
  email: row.email,
  phone: row.phone,
  gotram: row.gotram,
  nakshatram: row.nakshatram,
});

// Creates the profile on first sign-in (name and email from Google).
export async function ensureProfile(devotee: Devotee): Promise<DevoteeProfile> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("devotee_profiles")
    .select("id, full_name, email, phone, gotram, nakshatram")
    .eq("id", devotee.id)
    .maybeSingle();
  if (error) throw new Error(`ensureProfile: ${error.message}`);
  if (data) return mapProfile(data);
  const fresh = { id: devotee.id, full_name: devotee.name.slice(0, 100), email: devotee.email };
  const { data: created, error: insertError } = await supabase
    .from("devotee_profiles")
    .upsert(fresh, { onConflict: "id" })
    .select("id, full_name, email, phone, gotram, nakshatram")
    .single();
  if (insertError) throw new Error(`ensureProfile: ${insertError.message}`);
  return mapProfile(created);
}
