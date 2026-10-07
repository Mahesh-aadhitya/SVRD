"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { DEFAULT_BACKGROUND_AUDIO } from "@/lib/content-types";

const MUTE_KEY = "siteAudioMuted";

// Pages with their own sound (the live darshan stream) silence the
// background song while they're open.
const QUIET_PATHS = ["/live"];

// Module-level (not state): survives a client-side route change — such as
// switching language, which remounts this component along with the rest of
// the [locale] segment — so the chant picks up where it left off instead
// of jumping back to 0:00, which reads as a glitch. Resets on a real page
// reload, which is fine since there's nothing to resume from anyway.
let savedTime = 0;
let savedSrc = "";

/**
 * Looping background song (the admin's choice, or the built-in chant),
 * present on every page, on by default. It stops on the Live page and
 * whenever another audio or video on the page starts playing (a song from
 * the Songs page, an archived stream), and picks up again afterwards. Most
 * browsers block unmuted autoplay outright, so this tries to play with
 * sound immediately and only falls back to a muted start (unmuting on the
 * visitor's first tap/click/keypress) when the browser actively refuses —
 * unless they previously used the icon to mute it on purpose, in which
 * case that choice is remembered (localStorage) and respected.
 */
export default function SiteAudio({ src }: { src?: string | null }) {
  const track = src || DEFAULT_BACKGROUND_AUDIO;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(false);
  const pathname = usePathname();
  const quiet = QUIET_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  // Other media currently playing on the page.
  const [othersPlaying, setOthersPlaying] = useState(0);
  const silenced = quiet || othersPlaying > 0;
  const silencedRef = useRef(silenced);
  useEffect(() => {
    silencedRef.current = silenced;
  }, [silenced]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // A different song since last time: start it from the beginning.
    if (savedSrc !== track) {
      savedSrc = track;
      savedTime = 0;
    }

    const restoreTime = () => {
      try {
        audio.currentTime = savedTime;
      } catch {
        // Not seekable yet — the loadedmetadata listener below retries.
      }
    };
    restoreTime();
    audio.addEventListener("loadedmetadata", restoreTime);

    let removeInteractListeners: (() => void) | undefined;

    if (silencedRef.current) {
      // Opened straight onto a quiet page: stay paused (muted state still
      // follows the visitor's choice for when it resumes).
      const stored = localStorage.getItem(MUTE_KEY) === "true";
      audio.muted = stored;
      setMuted(stored);
    } else if (localStorage.getItem(MUTE_KEY) === "true") {
      audio.muted = true;
      audio.play()
        .catch(() => {})
        .finally(() => setMuted(true));
    } else {
      audio.muted = false;
      audio
        .play()
        .then(() => setMuted(false))
        .catch(() => {
          // Browser refused unmuted autoplay — fall back to a muted start
          // and unlock sound on the first user gesture, same as before.
          audio.muted = true;
          setMuted(true);
          audio.play().catch(() => {});
          const onInteract = () => {
            audio.muted = false;
            setMuted(false);
            if (!silencedRef.current) audio.play().catch(() => {});
          };
          window.addEventListener("pointerdown", onInteract, { once: true });
          window.addEventListener("keydown", onInteract, { once: true });
          removeInteractListeners = () => {
            window.removeEventListener("pointerdown", onInteract);
            window.removeEventListener("keydown", onInteract);
          };
        });
    }

    return () => {
      audio.removeEventListener("loadedmetadata", restoreTime);
      removeInteractListeners?.();
      if (Number.isFinite(audio.currentTime)) savedTime = audio.currentTime;
    };
  }, [track]);

  // Pause for the Live page and for other media; resume after.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (silenced) audio.pause();
    else if (audio.paused) audio.play().catch(() => {});
  }, [silenced]);

  // Any other <audio>/<video> starting or stopping (media events don't
  // bubble, so listen in the capture phase).
  useEffect(() => {
    const playing = new Set<EventTarget>();
    const update = () => setOthersPlaying(playing.size);
    const onPlay = (e: Event) => {
      if (e.target === audioRef.current || !(e.target instanceof HTMLMediaElement)) return;
      playing.add(e.target);
      update();
    };
    const onStop = (e: Event) => {
      if (e.target === audioRef.current) return;
      if (playing.delete(e.target as EventTarget)) update();
    };
    // A player removed from the page mid-song fires no pause event: sweep
    // up ones that are gone or stopped.
    const sweep = setInterval(() => {
      for (const el of playing) {
        const media = el as HTMLMediaElement;
        if (!media.isConnected || media.paused) playing.delete(el);
      }
      update();
    }, 2000);
    document.addEventListener("play", onPlay, true);
    document.addEventListener("pause", onStop, true);
    document.addEventListener("ended", onStop, true);
    document.addEventListener("emptied", onStop, true);
    return () => {
      clearInterval(sweep);
      document.removeEventListener("play", onPlay, true);
      document.removeEventListener("pause", onStop, true);
      document.removeEventListener("ended", onStop, true);
      document.removeEventListener("emptied", onStop, true);
    };
  }, []);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !muted;
    audio.muted = next;
    setMuted(next);
    localStorage.setItem(MUTE_KEY, String(next));
    if (!next && !silenced) audio.play().catch(() => {});
  };

  return (
    <>
      <audio ref={audioRef} src={track} loop preload="auto" />
      {/* No speaker button where the song is switched off for the page. */}
      <button
        hidden={quiet}
        type="button"
        onClick={toggleMute}
        aria-label={muted ? "Unmute background song" : "Mute background song"}
        aria-pressed={!muted}
        className="fixed bottom-20 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-cream/90 text-maroon shadow-md backdrop-blur transition hover:bg-cream lg:bottom-4"
      >
        {muted ? <MutedIcon /> : <SpeakerIcon />}
      </button>
    </>
  );
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M4 9.5v5h3.5L13 19V5L7.5 9.5H4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MutedIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M4 9.5v5h3.5L13 19V5L7.5 9.5H4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m16.5 9.5 4 4m0-4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
