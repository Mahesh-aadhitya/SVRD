"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Share anything — a notice, song, photo, event, festival… Opens the
 * device's share sheet where there is one (WhatsApp, Telegram, Signal…),
 * otherwise a small menu with WhatsApp and Copy link. `path` is a
 * same-site link ("/gallery?item=…") that opens the item itself.
 * Without `path` only the text is shared. `imageUrl`, when given, is shared as the picture where the device can
 * share files.
 */
export default function ShareButton({
  title,
  text,
  path,
  imageUrl,
  tone = "light",
  compact = false,
  className = "",
}: {
  title: string;
  text?: string;
  path?: string;
  imageUrl?: string;
  tone?: "light" | "dark";
  compact?: boolean;
  className?: string;
}) {
  const t = useTranslations("share");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  const url = () => (path ? new URL(path, window.location.origin).toString() : "");
  const message = () => [title, text, url()].filter(Boolean).join("\n\n");

  async function share(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      try {
        if (imageUrl) {
          const blob = await (await fetch(imageUrl)).blob();
          const file = new File([blob], `${title.slice(0, 40).replace(/[^\p{L}\p{N}]+/gu, "-") || "share"}.${blob.type.split("/")[1] ?? "jpg"}`, {
            type: blob.type,
          });
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file], title, text: message() });
            return;
          }
        }
        await navigator.share({ title, text: [title, text].filter(Boolean).join("\n\n"), ...(path ? { url: url() } : {}) });
        return;
      } catch (err) {
        if ((err as DOMException).name === "AbortError") return;
        // Fall through to the menu (e.g. Safari after a slow image fetch).
      }
    }
    setOpen((o) => !o);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(path ? url() : message());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked — the link is still in the WhatsApp option.
    }
  }

  const dark = tone === "dark";
  const buttonClass = compact
    ? `inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${
        dark ? "border-white/15 bg-white/5 text-amber-100 hover:bg-white/15" : "border-gold/40 bg-white/80 text-maroon hover:bg-gold/20"
      }`
    : `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        dark ? "border-white/20 bg-white/5 text-amber-100 hover:bg-white/15" : "border-gold/50 bg-white/80 text-maroon hover:bg-gold/20"
      }`;

  return (
    <span ref={ref} className={`relative inline-flex ${className}`}>
      <button type="button" onClick={share} className={buttonClass} aria-label={t("share")} title={t("share")}>
        <ShareIcon />
        {compact ? null : t("share")}
      </button>
      {open ? (
        <span
          className={`absolute right-0 top-full z-30 mt-1 flex min-w-[10rem] flex-col overflow-hidden rounded-xl border text-sm shadow-lg ${
            dark ? "border-white/15 bg-[#0b0820] text-white/90" : "border-gold/30 bg-white text-ink"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <a
            href={`https://wa.me/?text=${encodeURIComponent(message())}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-4 py-2.5 text-left ${dark ? "hover:bg-white/10" : "hover:bg-gold/15"}`}
          >
            {t("whatsapp")}
          </a>
          <button type="button" onClick={copy} className={`px-4 py-2.5 text-left ${dark ? "hover:bg-white/10" : "hover:bg-gold/15"}`}>
            {copied ? t("copied") : path ? t("copyLink") : t("copyText")}
          </button>
        </span>
      ) : null}
    </span>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}
