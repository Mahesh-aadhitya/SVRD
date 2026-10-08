"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import HighlightTile from "./HighlightTile";
import { openNotifications, useHighlights, useSeenHighlights } from "./useHighlights";
import type { Highlight } from "@/lib/highlight-types";

const ADVANCE_MS = 5000;

// Home page "What's new": a notification board of tiles — live darshan,
// ticket releases, messages from the temple and coming festivals — that
// updates itself as admins add things. Shown as a swipeable strip (one
// tile per view on phones, two from md up) that moves on every 5 seconds,
// pausing while the devotee is touching, hovering or focused on it.
export default function WhatsNew({ initial }: { initial: Highlight[] }) {
  const t = useTranslations("highlights");
  const items = useHighlights(initial).slice(0, 6);
  const seen = useSeenHighlights();
  const trackRef = useRef<HTMLDivElement>(null);
  const [perView, setPerView] = useState(1);
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);

  const pages = Math.max(1, Math.ceil(items.length / perView));

  // Width of one tile plus the gap, and how many tiles fit in view.
  const measure = useCallback(() => {
    const track = trackRef.current;
    const first = track?.firstElementChild as HTMLElement | null;
    if (!track || !first) return null;
    const step = first.offsetWidth + parseFloat(getComputedStyle(track).columnGap || "0");
    return { track, step, perView: Math.max(1, Math.round((track.clientWidth + 1) / step)) };
  }, []);

  const goTo = useCallback(
    (target: number) => {
      const m = measure();
      if (!m) return;
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      m.track.scrollTo({ left: target * m.perView * m.step, behavior: smooth ? "smooth" : "auto" });
    },
    [measure]
  );

  // Keep perView and the active dot in step with resizes and swipes.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const sync = () => {
      const m = measure();
      if (!m) return;
      setPerView(m.perView);
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      const count = Math.ceil(items.length / m.perView);
      setPage(atEnd ? count - 1 : Math.round(track.scrollLeft / (m.step * m.perView)));
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(track);
    track.addEventListener("scroll", sync, { passive: true });
    return () => {
      ro.disconnect();
      track.removeEventListener("scroll", sync);
    };
  }, [measure, items.length]);

  // Advance every few seconds; stop while paused, hidden or with one page.
  useEffect(() => {
    if (paused || pages <= 1) return;
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      goTo((page + 1) % pages);
    }, ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [paused, pages, page, goTo]);

  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-2 pt-6 sm:px-6" aria-labelledby="whats-new" aria-roledescription="carousel">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 id="whats-new" className="font-display text-2xl text-maroon">{t("title")}</h2>
        <button type="button" onClick={openNotifications} className="shrink-0 text-sm font-semibold text-maroon hover:underline">
          {t("viewAll")} →
        </button>
      </div>

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onPointerEnter={(e) => e.pointerType === "mouse" && setPaused(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => window.setTimeout(() => setPaused(false), ADVANCE_MS)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        {items.map((h, i) => (
          <div
            key={h.id}
            className="w-full shrink-0 snap-start md:w-[calc((100%-0.75rem)/2)]"
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${items.length}`}
          >
            <HighlightTile
              item={h}
              className="h-full"
              unseen={!!seen && h.isNew && h.kind !== "live" && !seen.has(h.id)}
            />
          </div>
        ))}
      </div>

      {pages > 1 ? (
        <div className="mt-3 flex justify-center gap-1.5">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`${i + 1} / ${pages}`}
              aria-current={i === page}
              className="grid h-6 min-w-6 place-items-center"
            >
              <span className={`block h-2 rounded-full transition-all ${i === page ? "w-6 bg-maroon" : "w-2 bg-maroon/25"}`} />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
