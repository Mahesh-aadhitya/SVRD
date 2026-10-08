"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ringBellNow, scheduleBellRing } from "@/lib/templeBell";

export type PetalVariant = "marigold" | "rose" | "jasmine";

// Fixed (not random) so server and client render the same markup — avoids
// hydration mismatches while still looking organically scattered. `left`
// and the fall distance are relative to the deity/thoranam column they're
// layered over, so the shower reads as falling onto the deity and settling
// at its feet rather than scattered across the whole hero.
const PETALS: {
  left: string;
  variant: PetalVariant;
  size: number;
  duration: number;
  delay: number;
  drift: number;
}[] = [
  { left: "18%", variant: "marigold", size: 16, duration: 5.2, delay: 0, drift: 22 },
  { left: "30%", variant: "rose", size: 13, duration: 6.1, delay: 0.9, drift: -16 },
  { left: "42%", variant: "jasmine", size: 12, duration: 5.6, delay: 1.8, drift: 18 },
  { left: "54%", variant: "marigold", size: 15, duration: 6.4, delay: 0.4, drift: -20 },
  { left: "66%", variant: "rose", size: 12, duration: 5.0, delay: 2.4, drift: 14 },
  { left: "24%", variant: "jasmine", size: 11, duration: 6.8, delay: 1.2, drift: -16 },
  { left: "36%", variant: "marigold", size: 14, duration: 5.4, delay: 2.0, drift: 20 },
  { left: "48%", variant: "rose", size: 13, duration: 6.2, delay: 0.6, drift: -14 },
  { left: "60%", variant: "jasmine", size: 12, duration: 5.8, delay: 2.8, drift: 16 },
  { left: "72%", variant: "marigold", size: 15, duration: 6.0, delay: 1.5, drift: -18 },
  { left: "20%", variant: "rose", size: 12, duration: 5.3, delay: 3.2, drift: 20 },
  { left: "76%", variant: "jasmine", size: 11, duration: 6.6, delay: 0.2, drift: -12 },
  { left: "44%", variant: "marigold", size: 13, duration: 6.9, delay: 3.6, drift: 14 },
  { left: "56%", variant: "jasmine", size: 12, duration: 5.7, delay: 1.0, drift: -18 },
] as const;

/**
 * Homepage deity hero: thoranam arch, flanking lamps and bells, and a
 * marigold/rose/jasmine shower that falls over the deity and settles at
 * its feet for as long as this section is on screen — it fades out via
 * IntersectionObserver as soon as it scrolls out of view, and back in when
 * it scrolls back into view. The temple bell rings once on its own, the
 * very first time the hero appears (page load), synced with both bell
 * images swinging — and either bell can also be rung on demand by
 * clicking it, swinging just that one.
 */
export default function DivineHero() {
  const heroRef = useRef<HTMLElement | null>(null);
  const bellRefs = useRef<(HTMLImageElement | null)[]>([]);
  // Prevents the IntersectionObserver from scheduling more than one
  // auto-ring (e.g. across repeated scroll-in/out).
  const hasScheduledAutoRingRef = useRef(false);
  // True only once the auto-ring has actually struck — distinct from the
  // above, since scheduleBellRing may still be *waiting* for the page's
  // first gesture when this component sets the "scheduled" flag.
  const autoRingStruckRef = useRef(false);
  // Holds the auto-ring's cleanup until it actually strikes. If the
  // visitor's first-ever interaction on the page happens to be clicking a
  // bell, that click is itself the gesture the auto-ring was waiting for —
  // without cancelling it here, it would *also* fire, overlapping the
  // click's own manual ring.
  const pendingAutoRingRef = useRef<(() => void) | undefined>(undefined);
  const [petalsVisible, setPetalsVisible] = useState(true);

  const swingBell = useCallback((i: number) => {
    const bell = bellRefs.current[i];
    if (!bell) return;
    bell.classList.remove("bell-swing");
    void bell.offsetWidth;
    bell.classList.add("bell-swing");
  }, []);

  const swingBothBells = useCallback(() => {
    autoRingStruckRef.current = true;
    swingBell(0);
    swingBell(1);
  }, [swingBell]);

  const ringBellByClick = useCallback(
    (i: number) => {
      if (!autoRingStruckRef.current && pendingAutoRingRef.current) {
        autoRingStruckRef.current = true;
        pendingAutoRingRef.current();
        pendingAutoRingRef.current = undefined;
      }
      ringBellNow(() => swingBell(i));
    },
    [swingBell],
  );

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setPetalsVisible(entry.isIntersecting);
        if (entry.isIntersecting && !hasScheduledAutoRingRef.current) {
          hasScheduledAutoRingRef.current = true;
          pendingAutoRingRef.current = scheduleBellRing(swingBothBells);
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      pendingAutoRingRef.current?.();
    };
  }, [swingBothBells]);

  return (
    <section
      ref={heroRef}
      aria-hidden
      className="relative overflow-hidden bg-divine-radial"
    >
      <div className="relative mx-auto flex max-w-6xl justify-center px-4 pb-4 pt-6 sm:px-6">
        <Image
          src="/images/chakra-watermark.png"
          alt=""
          width={1200}
          height={1432}
          className="absolute left-0 top-0 h-[320px] w-auto opacity-25 sm:h-[440px] md:h-[520px]"
        />
        <Image
          src="/images/shankha-watermark.png"
          alt=""
          width={1200}
          height={1486}
          className="absolute right-0 top-0 h-[320px] w-auto opacity-25 sm:h-[440px] md:h-[520px]"
        />

        {/* Lamps first (inner, nearer the arch — the first thing the eye
            meets), bells next (outer, nearer the chakra/shankha). The
            source art's bird faces left, so the LEFT lamp is the one
            flipped (to face inward, toward the arch) while the right one
            is used as-is. Extra left/right offset here (vs. the bells)
            keeps a visible gap between the lamp and the thoranam. Flames
            are layered CSS glows (not emoji) positioned over the lamp's
            real wick spouts, each flickering on its own slightly-offset
            timing. */}
        <div className="absolute left-[19%] top-0 hidden aspect-[280/1080] h-[52%] -scale-x-100 sm:block sm:left-[21%] sm:h-[56%] md:left-[23%] md:h-[58%]">
          <Image src="/images/hanging-lamp.png" alt="" fill className="object-contain object-top" />
          <span
            className="flame"
            style={{ left: "3%", top: "80%", width: "15%", height: "6.5%", animationDuration: "2.1s", animationDelay: "0s" }}
          />
          <span
            className="flame"
            style={{ left: "44%", top: "77%", width: "15%", height: "6.5%", animationDuration: "1.7s", animationDelay: "0.4s" }}
          />
          <span
            className="flame"
            style={{ left: "85%", top: "80%", width: "15%", height: "6.5%", animationDuration: "1.9s", animationDelay: "0.8s" }}
          />
        </div>
        <div className="absolute right-[19%] top-0 hidden aspect-[280/1080] h-[52%] sm:block sm:right-[21%] sm:h-[56%] md:right-[23%] md:h-[58%]">
          <Image src="/images/hanging-lamp.png" alt="" fill className="object-contain object-top" />
          <span
            className="flame"
            style={{ left: "3%", top: "80%", width: "15%", height: "6.5%", animationDuration: "2.0s", animationDelay: "0.2s" }}
          />
          <span
            className="flame"
            style={{ left: "44%", top: "77%", width: "15%", height: "6.5%", animationDuration: "1.6s", animationDelay: "0.6s" }}
          />
          <span
            className="flame"
            style={{ left: "85%", top: "80%", width: "15%", height: "6.5%", animationDuration: "1.8s", animationDelay: "1.0s" }}
          />
        </div>

        <div
          className="absolute left-[8%] top-0 hidden h-[41%] cursor-pointer sm:block sm:left-[10%] sm:h-[45%] md:left-[12%] md:h-[47%]"
          onClick={() => ringBellByClick(0)}
        >
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
        <div
          className="absolute right-[8%] top-0 hidden h-[41%] cursor-pointer sm:block sm:right-[10%] sm:h-[45%] md:right-[12%] md:h-[47%]"
          onClick={() => ringBellByClick(1)}
        >
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

        {/* The deity sits behind the thoranam, sized and positioned so it
            fills the arch's opening (the opening starts ~21.6% down the
            frame and its bottom lines up with the pillar bases). */}
        <div className="relative aspect-[679/947] h-[320px] sm:h-[440px] md:h-[520px]">
          {/* Sized generously (wider/taller than the measured opening) and
              cropped with object-cover so the photo fully fills the hole
              with no gap at its edges — any overlap onto the solid gold
              gets masked automatically since the thoranam image below
              renders on top of this one. */}
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

          <div
            className={`pointer-events-none absolute inset-0 z-10 transition-opacity duration-700 ease-out ${
              petalsVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            {PETALS.map((p, i) => (
              <span
                key={i}
                className="petal"
                style={{
                  left: p.left,
                  width: p.size,
                  height: p.size,
                  animationDuration: `${p.duration}s`,
                  animationDelay: `${p.delay}s`,
                  animationPlayState: petalsVisible ? "running" : "paused",
                  ["--petal-drift" as string]: `${p.drift}px`,
                }}
              >
                <Petal variant={p.variant} size={p.size} uid={i} />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Petal({ variant, size, uid }: { variant: PetalVariant; size: number; uid: number }) {
  if (variant === "jasmine") {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} className="block drop-shadow-[0_1px_1px_rgba(122,31,31,0.25)]">
        <g fill="#fbf1de" stroke="#e8c97a" strokeWidth="0.6">
          <ellipse cx="12" cy="6.2" rx="3" ry="4.2" />
          <ellipse cx="12" cy="17.8" rx="3" ry="4.2" />
          <ellipse cx="6.2" cy="12" rx="4.2" ry="3" />
          <ellipse cx="17.8" cy="12" rx="4.2" ry="3" />
        </g>
        <circle cx="12" cy="12" r="2.3" fill="#b98a3d" />
      </svg>
    );
  }

  const gradientId = `petal-grad-${variant}-${uid}`;
  const [from, to] =
    variant === "marigold" ? (["#f7c05c", "#c05a1e"] as const) : (["#f6afc2", "#b83a58"] as const);

  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="block drop-shadow-[0_1px_1px_rgba(122,31,31,0.25)]">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <path d="M12 1.5C7.5 6.5 5.5 12.5 12 22.5c6.5-10 4.5-16 0-21Z" fill={`url(#${gradientId})`} />
      <path
        d="M12 4.5c-1.7 3-2.7 6.8-1 13"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="0.8"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
