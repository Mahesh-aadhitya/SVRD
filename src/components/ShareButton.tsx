"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  // Where the menu opens (viewport coordinates), or null when closed. The
  // menu is portalled to <body> so cards with overflow-hidden can't clip it.
  const [menuAt, setMenuAt] = useState<{ top: number; right: number } | null>(null);
  const open = menuAt !== null;
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      const target = e.target as Node;
      if (!ref.current?.contains(target) && !menuRef.current?.contains(target)) setMenuAt(null);
    };
    const dismiss = () => setMenuAt(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismiss();
    document.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", dismiss, { passive: true });
    window.addEventListener("resize", dismiss);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", dismiss);
      window.removeEventListener("resize", dismiss);
    };
  }, [open]);

  function toggleMenu() {
    if (open) return setMenuAt(null);
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    // Below the button, right-aligned with it; above it when near the bottom.
    const below = rect.bottom + 6;
    const top = below + 110 > window.innerHeight ? Math.max(8, rect.top - 6 - 104) : below;
    setMenuAt({ top, right: Math.max(8, window.innerWidth - rect.right) });
  }

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
    toggleMenu();
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
    ? `inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
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
      {menuAt
        ? createPortal(
            <span
              ref={menuRef}
              role="menu"
              style={{ position: "fixed", top: menuAt.top, right: menuAt.right }}
              className={`z-[60] flex min-w-[11rem] flex-col overflow-hidden rounded-xl border text-sm shadow-xl ${
                dark ? "border-white/15 bg-[#0b0820] text-white/90" : "border-gold/30 bg-white text-ink"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <a
                role="menuitem"
                href={`https://wa.me/?text=${encodeURIComponent(message())}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuAt(null)}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-left ${dark ? "hover:bg-white/10" : "hover:bg-gold/15"}`}
              >
                <WhatsAppIcon />
                {t("whatsapp")}
              </a>
              <button
                role="menuitem"
                type="button"
                onClick={copy}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-left ${dark ? "hover:bg-white/10" : "hover:bg-gold/15"}`}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
                {copied ? t("copied") : path ? t("copyLink") : t("copyText")}
              </button>
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="18" cy="5" r="2.6" />
      <circle cx="6" cy="12" r="2.6" />
      <circle cx="18" cy="19" r="2.6" />
      <path d="m8.3 13.3 7.4 4.4M15.7 6.3 8.3 10.7" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-[#25D366]" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}
