"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { User } from "@supabase/supabase-js";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/browser";

// Header account entry: the devotee's Google avatar (or a sign-in link).
// Reads the session in the browser so site pages stay statically rendered.
// `compact` shows just the avatar, for the desktop nav row.
export default function AccountButton({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("auth");
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!ready) return <span className={`inline-block h-8 ${compact ? "w-8" : "w-20"}`} aria-hidden />;

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-full border border-maroon/30 px-3 py-1 text-xs font-semibold text-maroon hover:bg-maroon/5"
      >
        {t("signIn")}
      </Link>
    );
  }

  const meta = user.user_metadata ?? {};
  const name = String(meta.full_name ?? meta.name ?? user.email ?? "");
  const avatar = typeof meta.avatar_url === "string" ? meta.avatar_url : null;
  return (
    <Link
      href="/account"
      title={`${t("myAccount")} · ${name}`}
      aria-label={t("myAccount")}
      className={`flex items-center gap-2 rounded-full text-xs font-semibold text-maroon hover:bg-maroon/5 ${compact ? "p-0.5" : "py-0.5 pl-0.5 pr-3"}`}
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar}
          alt=""
          width={32}
          height={32}
          referrerPolicy="no-referrer"
          className="h-8 w-8 rounded-full border-2 border-gold/60 object-cover"
        />
      ) : (
        <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-gold/60 bg-maroon text-sm text-cream">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      {compact ? null : t("myAccount")}
    </Link>
  );
}
