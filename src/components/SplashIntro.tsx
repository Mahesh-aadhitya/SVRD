"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { ringBell } from "@/lib/templeBell";

const STORAGE_KEY = "templeSplashShown";
const VISIBLE_MS = 4200;
const FADE_MS = 700;

// Same fixed (non-random) petal layout used on the homepage hero, just
// reused here for the full-screen entrance.
const PETALS = [
  { left: "4%", emoji: "🌸", size: 26, duration: 5.2, delay: 0, drift: 34 },
  { left: "12%", emoji: "🏵️", size: 20, duration: 6.1, delay: 0.6, drift: -24 },
  { left: "20%", emoji: "🌼", size: 24, duration: 5.6, delay: 1.4, drift: 28 },
  { left: "28%", emoji: "🌺", size: 28, duration: 6.4, delay: 0.3, drift: -32 },
  { left: "36%", emoji: "🌸", size: 18, duration: 5.0, delay: 2.1, drift: 20 },
  { left: "44%", emoji: "🌼", size: 26, duration: 6.8, delay: 1.0, drift: -26 },
  { left: "52%", emoji: "🏵️", size: 20, duration: 5.4, delay: 1.8, drift: 30 },
  { left: "60%", emoji: "🌺", size: 24, duration: 6.2, delay: 0.9, drift: -20 },
  { left: "68%", emoji: "🌸", size: 28, duration: 5.8, delay: 2.4, drift: 24 },
  { left: "76%", emoji: "🌼", size: 20, duration: 6.0, delay: 0.2, drift: -30 },
  { left: "84%", emoji: "🏵️", size: 26, duration: 5.3, delay: 1.6, drift: 28 },
  { left: "92%", emoji: "🌺", size: 18, duration: 6.6, delay: 1.1, drift: -22 },
  { left: "8%", emoji: "🌼", size: 18, duration: 6.9, delay: 3.0, drift: 18 },
  { left: "48%", emoji: "🌸", size: 20, duration: 5.7, delay: 3.4, drift: -18 },
  { left: "88%", emoji: "🏵️", size: 18, duration: 6.3, delay: 2.8, drift: 20 },
] as const;

/**
 * Full-screen entrance shown once per browser session: deity in the
 * thoranam, flanking lamps/bells/chakra/shankha, a flower shower and the
 * bell chime, covering the whole viewport before the header and page
 * content are revealed. Uses useLayoutEffect for the "have we shown this
 * already" check so a repeat visitor never sees even a one-frame flash of
 * it before it's removed.
 */
export default function SplashIntro() {
  const [mounted, setMounted] = useState(false);
  const [fading, setFading] = useState(false);
  const bellRefs = useRef<(HTMLImageElement | null)[]>([]);

  useLayoutEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    sessionStorage.setItem(STORAGE_KEY, "1");
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    document.body.style.overflow = "hidden";

    const swingBells = () => {
      for (const el of bellRefs.current) {
        if (!el) continue;
        el.classList.remove("bell-swing");
        void el.offsetWidth;
        el.classList.add("bell-swing");
      }
    };

    let ctx: AudioContext | null = null;
    const tryRing = () => {
      if (ctx) return;
      ctx = ringBell();
      swingBells();
    };
    tryRing();
    const onInteract = () => {
      if (!ctx) {
        tryRing();
      } else if (ctx.state === "suspended") {
        ctx.resume();
        swingBells();
      }
    };
    window.addEventListener("pointerdown", onInteract, { once: true });
    window.addEventListener("keydown", onInteract, { once: true });

    const fadeTimer = setTimeout(() => setFading(true), VISIBLE_MS);
    const removeTimer = setTimeout(() => {
      setMounted(false);
      document.body.style.overflow = "";
    }, VISIBLE_MS + FADE_MS);

    return () => {
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
      document.body.style.overflow = "";
    };
  }, [mounted]);

  if (!mounted) return null;

  const skip = () => {
    setFading(true);
    setTimeout(() => {
      setMounted(false);
      document.body.style.overflow = "";
    }, FADE_MS);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Skip intro"
      onClick={skip}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") skip();
      }}
      className={`fixed inset-0 z-[999] flex cursor-pointer items-center justify-center overflow-hidden bg-divine-radial transition-opacity duration-700 ease-out ${
        fading ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {PETALS.map((p, i) => (
        <span
          key={i}
          className="petal"
          style={{
            left: p.left,
            fontSize: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            ["--petal-drift" as string]: `${p.drift}px`,
          }}
        >
          {p.emoji}
        </span>
      ))}

      <Image
        src="/images/chakra-watermark.png"
        alt=""
        width={1200}
        height={1432}
        className="absolute left-0 top-0 h-[42vh] w-auto opacity-25 sm:h-[52vh]"
      />
      <Image
        src="/images/shankha-watermark.png"
        alt=""
        width={1200}
        height={1486}
        className="absolute right-0 top-0 h-[42vh] w-auto opacity-25 sm:h-[52vh]"
      />

      <div className="absolute left-[19%] top-0 hidden aspect-[280/1080] h-[38vh] -scale-x-100 sm:block sm:left-[21%] sm:h-[44vh]">
        <Image src="/images/hanging-lamp.png" alt="" fill className="object-contain object-top" />
        <span className="flame" style={{ left: "3%", top: "80%", width: "15%", height: "6.5%", animationDuration: "2.1s", animationDelay: "0s" }} />
        <span className="flame" style={{ left: "44%", top: "77%", width: "15%", height: "6.5%", animationDuration: "1.7s", animationDelay: "0.4s" }} />
        <span className="flame" style={{ left: "85%", top: "80%", width: "15%", height: "6.5%", animationDuration: "1.9s", animationDelay: "0.8s" }} />
      </div>
      <div className="absolute right-[19%] top-0 hidden aspect-[280/1080] h-[38vh] sm:block sm:right-[21%] sm:h-[44vh]">
        <Image src="/images/hanging-lamp.png" alt="" fill className="object-contain object-top" />
        <span className="flame" style={{ left: "3%", top: "80%", width: "15%", height: "6.5%", animationDuration: "2.0s", animationDelay: "0.2s" }} />
        <span className="flame" style={{ left: "44%", top: "77%", width: "15%", height: "6.5%", animationDuration: "1.6s", animationDelay: "0.6s" }} />
        <span className="flame" style={{ left: "85%", top: "80%", width: "15%", height: "6.5%", animationDuration: "1.8s", animationDelay: "1.0s" }} />
      </div>

      <div className="absolute left-[8%] top-0 hidden h-[30vh] sm:block sm:left-[10%] sm:h-[35vh]">
        <Image
          ref={(el) => {
            bellRefs.current[0] = el;
          }}
          src="/images/hanging-bell.png"
          alt=""
          width={139}
          height={601}
          className="h-full w-auto object-contain object-top"
        />
      </div>
      <div className="absolute right-[8%] top-0 hidden h-[30vh] sm:block sm:right-[10%] sm:h-[35vh]">
        <Image
          ref={(el) => {
            bellRefs.current[1] = el;
          }}
          src="/images/hanging-bell.png"
          alt=""
          width={139}
          height={601}
          className="h-full w-auto object-contain object-top"
        />
      </div>

      <div className="relative aspect-[679/947] h-[58vh] sm:h-[64vh]">
        <div className="absolute left-[20%] top-[18%] h-[81%] w-[60%]">
          <Image
            src="/images/deity-hero.png"
            alt=""
            fill
            priority
            className="object-cover drop-shadow-[0_10px_24px_rgba(122,31,31,0.3)]"
          />
        </div>
        <Image
          src="/images/makara-thoranam.png"
          alt=""
          width={679}
          height={947}
          priority
          className="relative h-full w-full object-contain [filter:drop-shadow(0_0_2px_#7a1f1f)_drop-shadow(0_0_2px_#7a1f1f)_drop-shadow(0_0_2px_#7a1f1f)_drop-shadow(0_0_3px_#7a1f1f)]"
        />
      </div>

      <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium tracking-wide text-maroon/60">
        Tap anywhere to continue
      </span>
    </div>
  );
}
