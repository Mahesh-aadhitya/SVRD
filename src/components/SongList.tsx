"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { songs } from "@/lib/placeholder-data";
import type { Locale } from "@/i18n/routing";

export default function SongList() {
  const t = useTranslations("songs");
  const locale = useLocale() as Locale;
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-gold/25 bg-white/70">
      {songs.map((song, index) => {
        const isActive = activeId === song.id;
        return (
          <button
            key={song.id}
            type="button"
            onClick={() => setActiveId(isActive ? null : song.id)}
            className={`flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors ${
              index !== 0 ? "border-t border-gold/15" : ""
            } ${isActive ? "bg-cream-dark" : "hover:bg-cream-dark/60"}`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                isActive ? "bg-maroon text-cream" : "bg-maroon/10 text-maroon"
              }`}
            >
              {isActive ? (
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
                  <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 translate-x-0.5 fill-current">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-base text-ink">
                {song.title[locale]}
              </span>
              <span className="block text-xs text-ink/55">{song.category}</span>
            </span>
            <span className="shrink-0 text-xs text-ink/50">{song.duration}</span>
          </button>
        );
      })}
      {activeId ? (
        <p className="border-t border-gold/15 bg-cream-dark px-4 py-2 text-xs text-ink/55">
          Audio source will be added by the temple admin — preview only.
        </p>
      ) : null}
    </div>
  );
}
