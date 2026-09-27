import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Bound to the request's session cookie: reads/writes go through Postgres RLS
// as whoever is signed in (an admin, a devotee via Google, or anonymous).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component render (no response to attach
            // cookies to) — safe to ignore since middleware refreshes the
            // session on the next request.
          }
        },
      },
    },
  );
}
