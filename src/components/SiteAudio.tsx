"use client";

import { useEffect, useRef, useState } from "react";

const MUTE_KEY = "siteAudioMuted";
const TRACK_SRC = "/audio/om-namo-narayanaya.mp3";

// Module-level (not state): survives a client-side route change — such as
// switching language, which remounts this component along with the rest of
// the [locale] segment — so the chant picks up where it left off instead
// of jumping back to 0:00, which reads as a glitch. Resets on a real page
// reload, which is fine since there's nothing to resume from anyway.
let savedTime = 0;

/**
 * Looping background chant, present on every page, on by default. Most
 * browsers block unmuted autoplay outright, so this tries to play with
 * sound immediately and only falls back to a muted start (unmuting on the
 * visitor's first tap/click/keypress) when the browser actively refuses —
 * unless they previously used the icon to mute it on purpose, in which
 * case that choice is remembered (localStorage) and respected.
 */
export default function SiteAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

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

    if (localStorage.getItem(MUTE_KEY) === "true") {
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
  }, []);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !muted;
    audio.muted = next;
    setMuted(next);
    localStorage.setItem(MUTE_KEY, String(next));
    if (!next) audio.play().catch(() => {});
  };

  return (
    <>
      <audio ref={audioRef} src={TRACK_SRC} loop preload="auto" />
      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? "Unmute background chant" : "Mute background chant"}
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
