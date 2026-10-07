"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { label } from "@/lib/panchang/names";
import { CHANNELS, type Recording } from "@/lib/panchang/recordings";

// Recitations on YouTube (Amutham Music, STD Pathasala). Each loads YouTube's
// player only when tapped, so the page stays light; while one is open the
// site's background song pauses (SiteAudio listens for "embedded-media").
export default function YouTubeRecordings({
  recordings,
  locale,
  tone = "light",
  title,
  className = "",
}: {
  recordings: Recording[];
  locale: string;
  tone?: "light" | "dark";
  title?: string;
  className?: string;
}) {
  const t = useTranslations("panchangam.acharya");
  const [open, setOpen] = useState<string | null>(null);

  // Tell SiteAudio which player (if any) is open.
  useEffect(() => {
    if (!open) return;
    const announce = (isOpen: boolean) => {
      window.dispatchEvent(new CustomEvent("embedded-media", { detail: { id: `yt-${open}`, open: isOpen } }));
    };
    announce(true);
    return () => announce(false);
  }, [open]);

  if (recordings.length === 0) return null;
  const dark = tone === "dark";
  const channels = [...new Set(recordings.map((r) => r.channel))];

  return (
    <section className={className}>
      <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${dark ? "text-amber-200/80" : "text-saffron"}`}>
        🎧 {title ?? t("recitations")}
      </p>
      <ul className="mt-2 space-y-2">
        {recordings.map((r) => {
          const isOpen = open === r.id;
          return (
            <li
              key={r.id}
              className={`overflow-hidden rounded-2xl border ${
                dark ? "border-amber-200/20 bg-white/5" : "border-gold/35 bg-white/85"
              } ${isOpen ? (dark ? "border-amber-300/50" : "border-maroon/40") : ""}`}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : r.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    dark ? "bg-gradient-to-br from-amber-300 to-orange-400 text-[#1a0f05]" : "bg-maroon text-cream"
                  }`}
                  aria-hidden
                >
                  {isOpen ? (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <path d="M6 6l12 12M18 6 6 18" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="ml-0.5 h-3.5 w-3.5" fill="currentColor">
                      <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" />
                    </svg>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-semibold leading-snug ${dark ? "text-amber-50" : "text-maroon"}`}>{label(r.title, locale)}</span>
                  <span className={`block truncate text-[11px] ${dark ? "text-white/55" : "text-ink/50"}`}>
                    {CHANNELS[r.channel].name}
                    {r.artist ? ` · ${r.artist}` : ""}
                  </span>
                </span>
              </button>
              {isOpen ? (
                <div className="px-3 pb-3">
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
                    <iframe
                      className="absolute inset-0 h-full w-full"
                      src={`https://www.youtube-nocookie.com/embed/${r.id}?autoplay=1&rel=0`}
                      title={label(r.title, locale)}
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <a
                    href={`https://www.youtube.com/watch?v=${r.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-1.5 inline-block text-[11px] underline-offset-2 hover:underline ${dark ? "text-white/50" : "text-ink/50"}`}
                  >
                    {t("watchOnYouTube")} ↗
                  </a>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className={`mt-2 text-[11px] ${dark ? "text-white/45" : "text-ink/45"}`}>
        {t("recitationsCredit")}{" "}
        {channels.map((c, i) => (
          <span key={c}>
            {i ? " · " : ""}
            <a href={CHANNELS[c].url} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
              {CHANNELS[c].name}
            </a>
          </span>
        ))}
      </p>
    </section>
  );
}
