"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/browser";
import { useSessionUser } from "./useSessionUser";

// Header account entry: the devotee's Google avatar (or a sign-in link),
// with a one-tap sign-out beside it. `compact` shows just the avatar, for
// the desktop nav row.
export default function AccountButton({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("auth");
  const user = useSessionUser();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  // Signs out everywhere (global scope, like the account page's button) —
  // in the browser, so every header hears it at once — then goes home.
  const signOut = async () => {
    setSigningOut(true);
    await createClient().auth.signOut().catch(() => undefined);
    router.replace("/");
    router.refresh();
    setSigningOut(false);
  };

  if (user === undefined) return <span className={`inline-block h-8 ${compact ? "w-8" : "w-20"}`} aria-hidden />;

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
    <span className="flex items-center gap-1">
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
      <button
        type="button"
        onClick={signOut}
        disabled={signingOut}
        title={t("signOut")}
        aria-label={t("signOut")}
        className="grid h-8 w-8 place-items-center rounded-full text-maroon/80 transition hover:bg-maroon/5 hover:text-maroon disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5M21 12H9" />
        </svg>
      </button>
    </span>
  );
}
