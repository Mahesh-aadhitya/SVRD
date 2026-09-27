import "server-only";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";

export type AdminUser = { id: string; email: string; displayName: string };

async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createClient();
  // getUser() revalidates the JWT against the Supabase Auth server rather than
  // trusting the locally-cached session, which matters since this is the
  // authoritative check every admin action relies on.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("id, email, display_name")
    .eq("id", user.id)
    .single();
  if (!adminRow) return null;

  return { id: adminRow.id, email: adminRow.email, displayName: adminRow.display_name };
}

// Server Components: redirects to the login page when there's no valid admin.
export async function requireAdmin(locale: Locale): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) {
    redirect({ href: "/admin/login", locale });
    throw new Error("unreachable");
  }
  return admin;
}

// Server Actions: throws instead of redirecting — a rejected mutation should
// surface an error to the caller, not navigate it anywhere.
export async function verifyAdminSession(): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Not authorized");
  return admin;
}
