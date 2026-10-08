"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { usePathname } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/browser";

// The signed-in devotee, read from the session cookie in the browser so
// site pages stay statically rendered. undefined while checking.
//
// Sign-in (the Google callback) and sign-out (a Server Action) change the
// cookie on the server, which the browser client's onAuthStateChange never
// hears about — and the header stays mounted across those navigations — so
// the session is also re-read on every page change and when the tab comes
// back into view.
export function useSessionUser() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    const read = () => supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    read();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    const onVisible = () => document.visibilityState === "visible" && read();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      data.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname]);

  return user;
}
