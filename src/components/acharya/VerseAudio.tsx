"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

const clock = (s: number) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");

// A compact player for a verse's recording. Playing it pauses the site's
// background song (SiteAudio listens for any media starting to play).
export default function VerseAudio({
  src,
  title,
  credit,
  tone = "light",
  className = "",
}: {
  src: string;
  title?: string;
  /** "Recited by … · CC BY 4.0", linked to its source. */
  credit?: { text: string; href: string } | null;
  tone?: "light" | "dark";
  className?: string;
}) {
  const t = useTranslations("panchangam.acharya");
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setPlaying(false); // eslint-disable-line react-hooks/set-state-in-effect
    setTime(0);
  }, [src]);

  function toggle() {
    const audio = ref.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => setPlaying(false));
    else audio.pause();
  }

  const dark = tone === "dark";
  const pct = duration ? (time / duration) * 100 : 0;
  return (
    <div
      className={`min-w-0 max-w-full overflow-hidden rounded-2xl border px-3 py-2.5 ${dark ? "border-amber-200/25 bg-white/5" : "border-gold/40 bg-white/80"} ${className}`}
    >
      <audio
        ref={ref}
        src={src}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? t("pause") : t("listen")}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow ${
            dark ? "bg-gradient-to-br from-amber-300 to-orange-400 text-[#1a0f05]" : "bg-maroon text-cream hover:bg-maroon-dark"
          }`}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" />
            </svg>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-xs font-semibold ${dark ? "text-amber-100" : "text-maroon"}`}>🎧 {title ?? t("listen")}</p>
          <div
            role="slider"
            tabIndex={0}
            aria-label={t("listen")}
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(time)}
            onClick={(e) => {
              const audio = ref.current;
              if (!audio || !duration) return;
              const rect = e.currentTarget.getBoundingClientRect();
              audio.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
            }}
            onKeyDown={(e) => {
              const audio = ref.current;
              if (!audio) return;
              if (e.key === "ArrowRight") audio.currentTime = Math.min(duration, audio.currentTime + 5);
              if (e.key === "ArrowLeft") audio.currentTime = Math.max(0, audio.currentTime - 5);
            }}
            className={`mt-1.5 h-1.5 cursor-pointer overflow-hidden rounded-full ${dark ? "bg-white/15" : "bg-maroon/10"}`}
          >
            <div className={`h-full rounded-full ${dark ? "bg-amber-300" : "bg-maroon"}`} style={{ width: `${pct}%` }} />
          </div>
          <p className={`mt-1 flex justify-between text-[10px] tabular-nums ${dark ? "text-white/50" : "text-ink/45"}`}>
            <span>{clock(time)}</span>
            <span>{duration ? clock(duration) : ""}</span>
          </p>
        </div>
      </div>
      {credit ? (
        <a
          href={credit.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-1 block truncate text-[10px] underline-offset-2 hover:underline ${dark ? "text-white/40" : "text-ink/40"}`}
        >
          {credit.text}
        </a>
      ) : null}
    </div>
  );
}
