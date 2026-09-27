import Image from "next/image";

// Fixed (not random) so server and client render the same markup — avoids
// hydration mismatches while still looking organically scattered.
const PETALS = [
  { left: "4%", emoji: "🌸", size: 22, duration: 5.2, delay: 0, drift: 30 },
  { left: "12%", emoji: "🏵️", size: 18, duration: 6.1, delay: 0.6, drift: -20 },
  { left: "20%", emoji: "🌼", size: 20, duration: 5.6, delay: 1.4, drift: 24 },
  { left: "28%", emoji: "🌺", size: 24, duration: 6.4, delay: 0.3, drift: -28 },
  { left: "36%", emoji: "🌸", size: 16, duration: 5.0, delay: 2.1, drift: 18 },
  { left: "44%", emoji: "🌼", size: 22, duration: 6.8, delay: 1.0, drift: -22 },
  { left: "52%", emoji: "🏵️", size: 18, duration: 5.4, delay: 1.8, drift: 26 },
  { left: "60%", emoji: "🌺", size: 20, duration: 6.2, delay: 0.9, drift: -18 },
  { left: "68%", emoji: "🌸", size: 24, duration: 5.8, delay: 2.4, drift: 20 },
  { left: "76%", emoji: "🌼", size: 18, duration: 6.0, delay: 0.2, drift: -26 },
  { left: "84%", emoji: "🏵️", size: 22, duration: 5.3, delay: 1.6, drift: 24 },
  { left: "92%", emoji: "🌺", size: 16, duration: 6.6, delay: 1.1, drift: -20 },
  { left: "8%", emoji: "🌼", size: 16, duration: 6.9, delay: 3.0, drift: 16 },
  { left: "48%", emoji: "🌸", size: 18, duration: 5.7, delay: 3.4, drift: -16 },
  { left: "88%", emoji: "🏵️", size: 16, duration: 6.3, delay: 2.8, drift: 18 },
] as const;

// The bell/petal/chime entrance plays once, full-screen, in <SplashIntro>
// before this section is ever seen — here the bells and flames are static
// (well, the flame flicker keeps looping) so the homepage doesn't re-ring
// the chime every time this section scrolls into view.
export default function DivineHero() {
  return (
    <section aria-hidden className="relative overflow-hidden bg-divine-radial">
      <div className="relative mx-auto flex max-w-6xl justify-center px-4 pb-4 pt-6 sm:px-6">
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

        <div className="absolute left-[8%] top-0 hidden h-[41%] sm:block sm:left-[10%] sm:h-[45%] md:left-[12%] md:h-[47%]">
          <Image
            src="/images/hanging-bell.png"
            alt=""
            width={139}
            height={601}
            className="h-full w-auto object-contain object-top"
          />
        </div>
        <div className="absolute right-[8%] top-0 hidden h-[41%] sm:block sm:right-[10%] sm:h-[45%] md:right-[12%] md:h-[47%]">
          <Image
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
        </div>
      </div>
    </section>
  );
}
