"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/browser";
import { finishSignIn } from "@/lib/actions/auth";

// The temple's Google OAuth client (public — it's in every sign-in URL).
const GOOGLE_CLIENT_ID = "611669338779-9pp4el1jdncvo4m7utdq6ntit9rirmrf.apps.googleusercontent.com";
// The client's "Authorized JavaScript origins" in Google Cloud. Anywhere
// else Google refuses its button (it would render blank), so other
// addresses — localhost, previews, a phone on the LAN — keep the redirect
// sign-in. Add an origin here only after adding it in Google Cloud.
const GOOGLE_ORIGINS = ["https://varadaraja.vercel.app"];

type GoogleId = {
  initialize(options: Record<string, unknown>): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
};
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

let gsi: Promise<GoogleId> | null = null;
function loadGoogle() {
  gsi ??= new Promise<GoogleId>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => (window.google ? resolve(window.google.accounts.id) : reject(new Error("gsi")));
    script.onerror = () => {
      gsi = null;
      reject(new Error("gsi"));
    };
    document.head.appendChild(script);
  });
  return gsi;
}

async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// "Continue with Google". Google's own button signs the devotee in right on
// this page and hands back an ID token, which Supabase turns into a session
// — so Google names this site, not the Supabase project, on its screens and
// in its "you signed in" email. If Google's script can't load, the button
// falls back to the Supabase redirect (Google → /api/auth/callback). `next`
// is a path without the locale prefix, e.g. "/booking".
export default function GoogleSignInButton({ next }: { next: string }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const holder = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!GOOGLE_ORIGINS.includes(window.location.origin)) return;
    let cancelled = false;
    (async () => {
      const id = await loadGoogle();
      // Google signs the hash into the token; Supabase checks it against the raw value.
      const nonce = crypto.randomUUID();
      id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        nonce: await sha256Hex(nonce),
        ux_mode: "popup",
        itp_support: true,
        use_fedcm_for_button: true,
        callback: async ({ credential }: { credential: string }) => {
          setBusy(true);
          setFailed(false);
          const { error } = await createClient().auth.signInWithIdToken({ provider: "google", token: credential, nonce });
          if (error) {
            console.error("google sign-in:", error.message);
            setFailed(true);
            setBusy(false);
            return;
          }
          await finishSignIn(locale, next);
        },
      });
      if (cancelled || !holder.current) return;
      id.renderButton(holder.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        logo_alignment: "center",
        width: Math.min(320, holder.current.offsetWidth || 320),
        locale,
      });
      setReady(true);
    })().catch(() => {
      // Blocked or offline: the redirect button below stays.
    });
    return () => {
      cancelled = true;
    };
  }, [locale, next]);

  async function redirectSignIn() {
    setBusy(true);
    setFailed(false);
    const localized = locale === "en" ? next : `/${locale}${next === "/" ? "" : next}`;
    const redirectTo = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(localized)}`;
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, queryParams: { prompt: "select_account" } },
    });
    if (error) {
      setFailed(true);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative w-full max-w-xs ${busy ? "pointer-events-none opacity-60" : ""}`}>
        <div ref={holder} className={`flex min-h-[44px] w-full justify-center ${ready ? "" : "absolute inset-0 opacity-0"}`} />
        {ready ? null : (
          <button
            type="button"
            onClick={redirectSignIn}
            disabled={busy}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-ink/15 bg-white px-6 py-3 text-sm font-semibold text-ink shadow-sm transition hover:shadow disabled:opacity-60"
          >
            <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
            </svg>
            {busy ? t("redirecting") : t("google")}
          </button>
        )}
      </div>
      {busy && ready ? <p className="text-xs text-ink/55">{t("signingIn")}</p> : null}
      {failed ? <p className="text-xs text-red-700">{t("failed")}</p> : null}
    </div>
  );
}
