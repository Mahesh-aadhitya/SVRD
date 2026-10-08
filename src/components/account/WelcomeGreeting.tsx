"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { Yatra_One } from "next/font/google";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Petal, type PetalVariant } from "@/components/DivineHero";
import CosmosCanvas from "./CosmosCanvas";
import { WELCOME_COOKIE } from "@/lib/welcome";

// The whole greeting runs this long, then fades into the page beneath.
const TOTAL_MS = 9200;
const EXIT_MS = 700;
// Never longer than this, even when a tap starts the sound late.
const MAX_MS = 10000;
// The greeting's sound: a real thiruchinnam recording — a short call, then
// the long one, with the temple bell rung underneath — swelling in and
// dying away on its own (fades are in the file, so they work on iPhones,
// which ignore script volume changes). Bump ?v= whenever the file changes.
const THIRUCHINNAM = "/sounds/thiruchinnam.m4a?v=7";
const CALL_MS = 5900;
// When the hand bell rings in that file (seconds) — rung briskly, as at aarti;
// the hanging bells shake for as long as it rings.
const BELL_RING_S: [number, number] = [0.15, 4.3];
// Skipping fades the call out over this long instead of cutting it.
const AUDIO_FADE_MS = 1200;
// The scene's timings below come after the doors open (CSS --wg-o).
const after = (s: number) => `calc(var(--wg-o) + ${s}s)`;

// Let go of the recording once it's done, so phones drop it from the
// lock screen / "Now Playing" controls.
function releaseAudio(audio: HTMLAudioElement) {
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  if ("mediaSession" in navigator) navigator.mediaSession.metadata = null;
}

const PETALS: { left: string; size: number; duration: number; delay: number; drift: number; variant: PetalVariant }[] = [
  { left: "4%", size: 16, duration: 5.2, delay: 0.6, drift: 30, variant: "marigold" },
  { left: "12%", size: 13, duration: 6.1, delay: 1.6, drift: -22, variant: "jasmine" },
  { left: "20%", size: 18, duration: 5.6, delay: 0.9, drift: 26, variant: "rose" },
  { left: "29%", size: 12, duration: 6.4, delay: 2.2, drift: -18, variant: "marigold" },
  { left: "37%", size: 15, duration: 5.0, delay: 1.2, drift: 24, variant: "jasmine" },
  { left: "46%", size: 17, duration: 5.8, delay: 0.7, drift: -28, variant: "rose" },
  { left: "54%", size: 13, duration: 6.3, delay: 1.9, drift: 20, variant: "marigold" },
  { left: "62%", size: 16, duration: 5.4, delay: 1.0, drift: -24, variant: "jasmine" },
  { left: "70%", size: 14, duration: 6.0, delay: 2.5, drift: 28, variant: "rose" },
  { left: "78%", size: 18, duration: 5.3, delay: 0.8, drift: -20, variant: "marigold" },
  { left: "86%", size: 12, duration: 6.2, delay: 1.5, drift: 22, variant: "jasmine" },
  { left: "94%", size: 15, duration: 5.7, delay: 2.0, drift: -26, variant: "rose" },
];

// Feather sparks thrown off as the wings open: [side, x%, y%, drift x, drift y, delay s].
const SPARKS: ["l" | "r", number, number, number, number, number][] = [
  ["l", 6, 14, -60, -30, 0.55],
  ["l", 2, 24, -80, 10, 0.7],
  ["l", 10, 32, -50, 40, 0.9],
  ["l", 4, 18, -70, -60, 1.6],
  ["r", 94, 14, 60, -30, 0.6],
  ["r", 98, 24, 80, 10, 0.75],
  ["r", 90, 32, 50, 40, 0.95],
  ["r", 96, 18, 70, -60, 1.7],
];

// Garuda, Periya Thiruvadi, welcoming the devotee: he flies down, spreads
// his wings wide and bows with hands joined in anjali. Built from a Belur
// stone Garuda, recast in gold, with the wings as separate layers.
function Garuda() {
  return (
    <div className="wg-deity relative" aria-hidden>
      <span className="wg-aura" />
      <div className="wg-garuda">
        <div className="wg-garuda-bow">
          <Image src="/images/garuda/garuda-wing-l.webp" alt="" width={633} height={1248} priority unoptimized className="wg-wing wg-wing-l" />
          <Image src="/images/garuda/garuda-wing-r.webp" alt="" width={633} height={1248} priority unoptimized className="wg-wing wg-wing-r" />
          <Image src="/images/garuda/garuda-body.webp" alt="" width={633} height={1248} priority unoptimized className="wg-garuda-body" />
          <span className="wg-anjali" />
        </div>
        {SPARKS.map(([side, x, y, dx, dy, delay], i) => (
          <span
            key={i}
            className="wg-spark"
            style={{ left: `${x}%`, top: `${y}%`, animationDelay: after(delay), ["--dx" as string]: `${dx}px`, ["--dy" as string]: `${dy}px` }}
            data-side={side}
          />
        ))}
      </div>
    </div>
  );
}

// The Vaikuntha Dwaram the greeting opens with: gold-clad doors (Shankha
// and Chakra medallions) in the makara thoranam, Jaya and Vijaya on guard.
function VaikunthaGate() {
  return (
    <div className="wg-gate" aria-hidden>
      <div className="wg-gate-hole">
        <span className="wg-gate-flood" />
      </div>
      <div className="wg-doors">
        <div className="wg-leaf wg-leaf-l" />
        <div className="wg-leaf wg-leaf-r" />
        <span className="wg-seam" />
      </div>
      <Image src="/images/makara-thoranam.png" alt="" width={679} height={947} priority sizes="(max-width: 640px) 150vw, 640px" className="wg-thoranam" />
      <span className="wg-guard wg-guard-l">
        <Image src="/images/gate/jaya.webp" alt="" width={427} height={803} priority unoptimized />
      </span>
      <span className="wg-guard wg-guard-r">
        <Image src="/images/gate/vijaya.webp" alt="" width={429} height={816} priority unoptimized />
      </span>
    </div>
  );
}

// The Sanskrit blessing ("may the grace of Sri Varadaraja Swamy be yours"):
// in Devanagari, then in the visitor's own script.
const BLESSING = {
  sa: "श्री वरदराज स्वामि अनुग्रह प्राप्तिरस्तु",
  kn: "ಶ್ರೀ ವರದರಾಜ ಸ್ವಾಮಿ ಅನುಗ್ರಹ ಪ್ರಾಪ್ತಿರಸ್ತು",
  en: "Sri Varadaraja Swamy Anugraha Praptirastu",
};

// The heading font's Devanagari, loaded only when a greeting plays.
const devanagari = Yatra_One({ subsets: ["devanagari"], weight: "400", preload: false, display: "swap" });

// One line of text that shrinks its font until it fits the width.
function FitLine({ children, className = "", style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = "";
      let size = parseFloat(getComputedStyle(el).fontSize);
      while (el.scrollWidth > el.clientWidth + 1 && size > 10) {
        size -= 0.5;
        el.style.fontSize = `${size}px`;
      }
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [children]);
  return (
    <p ref={ref} className={`w-full overflow-hidden whitespace-nowrap ${className}`} style={style}>
      {children}
    </p>
  );
}

function hasWelcomeCookie() {
  return document.cookie.split("; ").some((c) => c.startsWith(`${WELCOME_COOKIE}=`));
}

// Reads the name and deletes the cookie, so the greeting plays only once.
function readWelcomeCookie(): string | null {
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${WELCOME_COOKIE}=`));
  if (!match) return null;
  document.cookie = `${WELCOME_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
  let value = match.slice(WELCOME_COOKIE.length + 1);
  for (let i = 0; i < 3 && /%[0-9a-f]{2}/i.test(value); i++) {
    try {
      value = decodeURIComponent(value);
    } catch {
      break;
    }
  }
  return value.trim();
}

// Letters (grapheme clusters, so Kannada stays intact) for the reveal.
function graphemes(text: string) {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)].map((s) => s.segment);
  }
  return [text];
}

// Full-screen welcome played once, right after a devotee signs in (Google
// or email): the Vaikuntha doors open in a flood of light, then flying in through the stars to a real nebula, Garuda
// spreading his wings and bowing in anjali, a petal shower and the thiruchinnam sounding, then "Namaskaram <name> ·
// Adiyen Ramanuja Dasan" and a short blessing, fading into the page in ~8s.
// Tap, Esc or Skip ends it early.
export default function WelcomeGreeting() {
  const t = useTranslations("welcomeGreeting");
  const locale = useLocale();
  const pathname = usePathname();
  const [name, setName] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  // "blocked": the browser wants a tap before sound (e.g. after the Google
  // redirect) — the first tap then plays the thiruchinnam instead of skipping.
  const [sound, setSound] = useState<"pending" | "playing" | "blocked" | "off">("pending");
  const timers = useRef<number[]>([]);
  const startedAt = useRef(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  // True while the bell rings in the recording (the hanging bells shake).
  const [ringing, setRinging] = useState(false);

  // Email sign-in lands here by client-side navigation, Google by a full
  // load — so look for the cookie on every page change.
  useEffect(() => {
    if (!hasWelcomeCookie()) return;
    const frame = requestAnimationFrame(() => {
      const found = readWelcomeCookie();
      if (found === null) return;
      setLeaving(false);
      setSound("pending");
      setName(found);
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  const close = useCallback(() => {
    setLeaving(true);
    // Never cut the call off: fade it out where the browser allows volume
    // changes; elsewhere (iPhone) it plays on into its own fade-out.
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      const t0 = performance.now();
      const step = () => {
        const k = Math.min(1, (performance.now() - t0) / AUDIO_FADE_MS);
        audio.volume = Math.cos((k * Math.PI) / 2);
        if (k < 1) requestAnimationFrame(step);
        else if (audio.volume < 0.05) releaseAudio(audio);
      };
      requestAnimationFrame(step);
    }
    timers.current.push(window.setTimeout(() => setName(null), EXIT_MS));
  }, []);

  // Sound the thiruchinnam with the greeting. (The site speaker button only
  // mutes the background song; this is part of the greeting itself.)
  useEffect(() => {
    if (name === null) return;
    let cancelled = false;
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = THIRUCHINNAM;
    audio.volume = 1;
    audio
      .play()
      .then(() => !cancelled && setSound("playing"))
      .catch(() => !cancelled && setSound("blocked"));
    const onEnded = () => releaseAudio(audio);
    audio.addEventListener("ended", onEnded);
    return () => {
      cancelled = true;
      audio.removeEventListener("ended", onEnded);
      // Still sounding (an iPhone playing on into its fade-out)? Let it
      // finish; it lets go of itself when it ends.
      if (audio.paused) releaseAudio(audio);
      else audio.addEventListener("ended", onEnded, { once: true });
    };
  }, [name]);

  // Shake the hanging bells while the bell rings in the recording — timed
  // from when it actually starts playing (right away, or after a tap).
  useEffect(() => {
    const audio = audioRef.current;
    if (name === null || !audio) return;
    let pending: number[] = [];
    const onPlaying = () => {
      pending.forEach((id) => window.clearTimeout(id));
      const [from, to] = BELL_RING_S.map((at) => Math.max(0, (at - audio.currentTime) * 1000));
      pending = [window.setTimeout(() => setRinging(true), from), window.setTimeout(() => setRinging(false), to)];
    };
    audio.addEventListener("playing", onPlaying);
    return () => {
      audio.removeEventListener("playing", onPlaying);
      pending.forEach((id) => window.clearTimeout(id));
      setRinging(false);
    };
  }, [name]);

  useEffect(() => {
    if (name === null) return;
    startedAt.current = Date.now();
    const list = timers.current;
    list.push(window.setTimeout(close, TOTAL_MS - EXIT_MS));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      list.splice(0).forEach((id) => window.clearTimeout(id));
      window.removeEventListener("keydown", onKey);
      root.style.overflow = previous;
    };
  }, [name, close]);

  const letters = useMemo(() => graphemes(t("namaskaram")), [t]);

  // A tap while sound is blocked plays the call (and holds the greeting a
  // little longer so it isn't cut off, still finishing within 10s);
  // otherwise a tap skips.
  const onTap = () => {
    const audio = audioRef.current;
    if (sound !== "blocked" || !audio) return close();
    audio
      .play()
      .then(() => {
        setSound("playing");
        const elapsed = Date.now() - startedAt.current;
        const closeAt = Math.min(MAX_MS, Math.max(TOTAL_MS, elapsed + CALL_MS)) - EXIT_MS;
        timers.current.splice(0).forEach((id) => window.clearTimeout(id));
        timers.current.push(window.setTimeout(close, Math.max(0, closeAt - elapsed)));
      })
      .catch(() => close());
  };

  return (
    <>
      <audio ref={audioRef} preload="none" className="hidden" />
      {name === null ? null : (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("label")}
          onClick={onTap}
          className={`wg-root fixed inset-0 z-[100] flex cursor-pointer select-none flex-col items-center justify-center overflow-hidden px-5 text-center text-cream ${
            leaving ? "wg-leave" : ""
          }`}
          style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top))", paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))" }}
        >
          {/* A real nebula: Hubble's view of the Carina Nebula ("Mystic Mountain"
              region) — NASA, ESA & the Hubble 20th Anniversary Team (STScI), public
              domain. Phones get a tall crop, wider screens the full frame. */}
          <div className="wg-space" aria-hidden />
          <CosmosCanvas startDelayMs={1500} />
          <span className="wg-shooting" style={{ top: "12%", left: "6%", animationDelay: after(1.3) }} aria-hidden />
          <span className="wg-shooting" style={{ top: "30%", left: "52%", animationDelay: after(4.4) }} aria-hidden />

          {(["left-[5%] sm:left-[9%]", "right-[5%] sm:right-[9%]"] as const).map((side, i) => (
            <div key={i} className={`wg-bell pointer-events-none absolute top-0 z-30 ${side}`} aria-hidden>
              <Image
                src="/images/hanging-bell.png"
                alt=""
                width={139}
                height={601}
                className={`h-full w-auto object-contain object-top ${ringing ? "wg-bell-ringing" : "wg-bell-still"}`}
                style={{ animationDelay: i ? "-0.08s" : "0s" }}
              />
            </div>
          ))}
          <div className="wg-glow" aria-hidden />

          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {PETALS.map((p, i) => (
              <span
                key={i}
                className="petal"
                style={{
                  left: p.left,
                  width: p.size,
                  height: p.size,
                  animationDuration: `${p.duration}s`,
                  animationDelay: after(p.delay),
                  ["--petal-drift" as string]: `${p.drift}px`,
                }}
              >
                <Petal variant={p.variant} size={p.size} uid={900 + i} />
              </span>
            ))}
          </div>

          <div className="wg-stack relative flex w-full max-w-xl flex-col items-center">
            <Garuda />

            <div className="wg-text flex min-w-0 flex-col items-center">
              <p className="wg-namaskaram mt-2 font-display leading-none text-gold-light" aria-label={t("namaskaram")}>
                {letters.map((ch, i) => (
                  <span key={i} className="wg-letter" style={{ animationDelay: after(1 + i * 0.05) }} aria-hidden>
                    {ch === " " ? " " : ch}
                  </span>
                ))}
              </p>

              {name ? <p className="wg-name mt-2 max-w-full break-words font-display leading-tight [text-wrap:balance]">{name}</p> : null}

              <div className="wg-divider mt-5 flex items-center gap-3 text-gold-light" aria-hidden>
                <span className="h-px w-12 bg-gradient-to-r from-transparent to-gold-light sm:w-20" />
                <span className="text-sm">✦</span>
                <span className="h-px w-12 bg-gradient-to-l from-transparent to-gold-light sm:w-20" />
              </div>

              <FitLine className="wg-dasan wg-step mt-3 font-display" style={{ animationDelay: after(2.3) }}>
                {t("dasan")}
              </FitLine>

              {/* The Sanskrit blessing: Devanagari, then the visitor's own script. */}
              <FitLine className={`wg-blessing wg-step mt-3 leading-normal ${devanagari.className}`} style={{ animationDelay: after(3) }}>
                {BLESSING.sa}
              </FitLine>
              <FitLine
                className="wg-blessing wg-blessing-alt wg-step mt-0.5 leading-snug"
                style={{ animationDelay: after(3.35), fontFamily: locale === "kn" ? "var(--font-temple-kannada), var(--font-temple-sans), sans-serif" : undefined }}
              >
                {locale === "kn" ? BLESSING.kn : BLESSING.en}
              </FitLine>
            </div>
          </div>

          <VaikunthaGate />

          <div
            className="absolute inset-x-0 z-30 flex flex-col items-center gap-2"
            style={{ bottom: "max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem))" }}
          >
            {sound === "blocked" ? (
              <span className="wg-step flex items-center gap-2 rounded-full border border-gold-light/50 bg-black/30 px-4 py-2 text-sm font-semibold text-gold-light">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M11 5 6 9H3v6h3l5 4V5Z" strokeLinejoin="round" />
                  <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" strokeLinecap="round" />
                </svg>
                {t("soundHint")}
              </span>
            ) : null}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                close();
              }}
              className="wg-step rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide text-cream/70 hover:text-cream"
              style={{ animationDelay: "1.2s" }}
            >
              {t("skip")}
            </button>
          </div>
          <p className="wg-credit absolute right-3 z-30 text-[10px] text-cream/35" style={{ bottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
            Carina Nebula · NASA, ESA, Hubble
          </p>
          <div className="absolute inset-x-0 bottom-0 z-30 h-1 bg-white/10" aria-hidden>
            <div className="wg-progress h-full origin-left bg-gradient-to-r from-gold via-gold-light to-gold" style={{ animationDuration: `${TOTAL_MS - EXIT_MS}ms` }} />
          </div>
        </div>
      )}
    </>
  );
}
