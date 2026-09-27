import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// A plain, cookie-free anon-key client for public content reads (poojas,
// events, gallery, songs, live config/archive). Safe to call from inside
// unstable_cache — unlike src/lib/supabase/server.ts, it never touches
// next/headers cookies(), which unstable_cache scopes forbid.
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
