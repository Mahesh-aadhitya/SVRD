"use client";

import { useEffect, useRef } from "react";

// Star layer over the greeting's real nebula photograph (.wg-space):
//  • a short "arrival": stars streak past (warp) for about a second, as if
//    flying in toward the Lord, while the photograph fades up behind;
//  • then a slow drift forward, with nearby stars gently twinkling — the
//    photo supplies the deep field, so this layer stays sparse and quiet.
// Transparent canvas; stars are tiny sprites, so phones keep 60fps.

type Star = { x: number; y: number; z: number; mag: number; tint: number; phase: number };

const STAR_TINTS = ["#c4d4ff", "#e4ebff", "#ffffff", "#fff4dc", "#ffdcae"];
const STAR_COUNT = 420;
const DRIFT = 0.025; // depth units per second once settled
const WARP = 1.5; // depth units per second at the very start

// Seeded PRNG so every greeting gets the same, composed sky.
function prng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function glowSprite(color: string) {
  const s = 48;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.15, color);
  grad.addColorStop(0.4, `${color}40`);
  grad.addColorStop(1, `${color}00`);
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  return c;
}

export default function CosmosCanvas({ focusY = 0.38, startDelayMs = 0 }: { focusY?: number; startDelayMs?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const sprites = STAR_TINTS.map(glowSprite);
    const rand = prng(97);
    const spawn = (z = 0.05 + rand() * 0.95): Star => ({
      x: (rand() * 2 - 1) * 1.6,
      y: (rand() * 2 - 1) * 1.6,
      z,
      mag: rand() ** 4, // few bright, many faint
      tint: Math.floor(rand() * STAR_TINTS.length),
      phase: rand() * Math.PI * 2,
    });
    const stars = Array.from({ length: STAR_COUNT }, () => spawn());

    let raf = 0;
    // The warp waits for the doors to open (nothing is drawn until then).
    const t0 = performance.now() + (still ? 0 : startDelayMs);
    let last = performance.now();

    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      if (t < 0) {
        last = now;
        raf = requestAnimationFrame(frame);
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const speed = still ? 0 : DRIFT + (WARP - DRIFT) * Math.exp(-t / 0.32);
      const cx = w / 2;
      const cy = h * focusY;
      const scale = Math.max(w, h) * 0.55;
      // Settled stars are quieter than the warp: the photo is the sky.
      const calm = Math.min(1, Math.max(0.45, 1 - (t - 0.6) * 0.6));

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const prevZ = s.z;
        s.z -= speed * dt;
        if (s.z <= 0.04) {
          stars[i] = spawn(1);
          continue;
        }
        const px = cx + (s.x / s.z) * scale;
        const py = cy + (s.y / s.z) * scale;
        if (px < -40 || px > w + 40 || py < -40 || py > h + 40) {
          if (s.z < 0.5) stars[i] = spawn(1);
          continue;
        }
        const near = 1 - s.z;
        const twinkle = 0.7 + 0.3 * Math.sin(t * (1.5 + s.mag * 3) + s.phase);
        const bright = Math.min(1, (0.35 + s.mag * 0.8 + near * 0.45) * twinkle);
        const radius = 0.5 + s.mag * 2 + near * 1.8;
        const tint = STAR_TINTS[s.tint];

        if (speed > 0.25) {
          // Warp streak from where the star was a moment ago.
          const back = Math.min(1.3, prevZ + speed * 0.14);
          ctx.strokeStyle = tint;
          ctx.globalAlpha = Math.min(1, bright * 1.3) * Math.min(1, speed / WARP + 0.35);
          ctx.lineWidth = Math.max(1, radius * 0.9);
          ctx.beginPath();
          ctx.moveTo(cx + (s.x / back) * scale, cy + (s.y / back) * scale);
          ctx.lineTo(px, py);
          ctx.stroke();
          continue;
        }

        if (s.mag > 0.35) {
          const g = radius * 6;
          ctx.globalAlpha = bright * calm;
          ctx.drawImage(sprites[s.tint], px - g / 2, py - g / 2, g, g);
        } else {
          ctx.globalAlpha = bright * calm * 0.8;
          ctx.fillStyle = tint;
          ctx.beginPath();
          ctx.arc(px, py, radius * 0.55, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      if (!still) raf = requestAnimationFrame(frame);
    };
    if (still) frame(t0 + 3000);
    else raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [focusY, startDelayMs]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
}
