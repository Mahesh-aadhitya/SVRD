"use client";

import { createBrowserClient } from "@supabase/ssr";

// Anon-key client for the browser — only ever used to PUT a file straight to
// Supabase Storage via a signed upload URL/token minted server-side after
// verifyAdminSession(). It never touches any table directly.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
