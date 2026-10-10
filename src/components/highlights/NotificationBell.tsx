"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import HighlightTile from "./HighlightTile";
import {
  canClear,
  clearHighlights,
  markHighlightsSeen,
  OPEN_NOTIFICATIONS_EVENT,
  restoreHighlights,
  useClearedHighlights,
  useHighlights,
  useSeenHighlights,
} from "./useHighlights";

// The temple's notices as a notification bell: a count of what's new and
// unread, and a panel that slides in from the side with every update as a
// tile. Opening a tile reads it; the devotee can also mark all as read,
// clear one (×) or all, and bring cleared ones back.
export default function NotificationBell() {
  const t = useTranslations("highlights");
  const items = useHighlights();
  const seen = useSeenHighlights();
  const cleared = useClearedHighlights();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  // The panel is portalled to <body>: inside the header it would share the
  // header's stacking layer and sit under the phone tab bar.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const shown = cleared ? items.filter((h) => !cleared.has(h.id)) : items;
  const hidden = items.length - shown.length;
  const isUnseen = (h: (typeof items)[number]) =>
    !!seen && h.isNew && h.kind !== "live" && !seen.has(h.id);
  const unseen = shown.filter(isUnseen);
  const live = items.some((h) => h.kind === "live");
  const clearable = shown.filter(canClear);

  const close = () => setOpen(false);

  // "All updates" buttons elsewhere open this panel. (The header renders a
  // bell for desktop and one for phones.)
  useEffect(() => {
    // Only the bell actually on screen answers.
    const show = () => button.current?.offsetParent && setOpen(true);
    window.addEventListener(OPEN_NOTIFICATIONS_EVENT, show);
    return () => window.removeEventListener(OPEN_NOTIFICATIONS_EVENT, show);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  });

  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={
          unseen.length
            ? t("drawer.openCount", { count: unseen.length })
            : t("drawer.open")
        }
        aria-expanded={open}
        className="relative grid h-9 w-9 place-items-center rounded-full text-maroon transition hover:bg-maroon/5"
      >
        <svg
          viewBox="0 0 24 24"
          className={`h-[22px] w-[22px] ${unseen.length ? "origin-top animate-[bell-swing_2s_ease-out_1]" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden
        >
          <path
            d="M6 9a6 6 0 1 1 12 0c0 4.5 1.6 6.4 2.4 7.2a.5.5 0 0 1-.36.8H3.96a.5.5 0 0 1-.36-.8C4.4 15.4 6 13.5 6 9z"
            strokeLinejoin="round"
          />
          <path d="M10 20.5a2.2 2.2 0 0 0 4 0" strokeLinecap="round" />
        </svg>
        {unseen.length ? (
          <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-cream">
            {unseen.length > 9 ? "9+" : unseen.length}
          </span>
        ) : live ? (
          <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-cream" />
        ) : null}
      </button>

      {/* Slide-in panel */}
      {mounted
        ? createPortal(
            <div
              className={`fixed inset-0 z-[70] ${open ? "" : "pointer-events-none"}`}
              aria-hidden={!open}
            >
              <div
                onClick={close}
                className={`absolute inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
              />
              <aside
                role="dialog"
                aria-modal="true"
                aria-label={t("drawer.title")}
                className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-hidden bg-cream shadow-2xl transition-transform duration-300 ease-out ${
                  open ? "translate-x-0" : "translate-x-full"
                }`}
              >
                <Image
                  src="/images/shankha-watermark.png"
                  alt=""
                  width={1200}
                  height={1486}
                  className="pointer-events-none absolute -right-10 top-10 h-56 w-auto opacity-[0.06]"
                />
                <div className="relative flex items-center justify-between border-b border-gold/30 px-5 py-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gold">
                      {t("popup.eyebrow")}
                    </p>
                    <h2 className="font-display text-2xl text-maroon">
                      {t("drawer.title")}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    aria-label={t("drawer.close")}
                    className="rounded-full p-2 text-ink/50 hover:bg-black/5 hover:text-ink"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                {unseen.length || clearable.length ? (
                  <div className="relative flex items-center justify-end gap-1 border-b border-gold/20 px-3 py-1.5 text-sm">
                    {unseen.length ? (
                      <button
                        type="button"
                        onClick={() => markHighlightsSeen(unseen.map((h) => h.id))}
                        className="rounded-full px-3 py-1.5 font-semibold text-maroon hover:bg-maroon/5"
                      >
                        {t("drawer.markAllRead")}
                      </button>
                    ) : null}
                    {clearable.length ? (
                      <button
                        type="button"
                        onClick={() => clearHighlights(clearable.map((h) => h.id))}
                        className="rounded-full px-3 py-1.5 font-semibold text-ink/60 hover:bg-black/5 hover:text-ink"
                      >
                        {t("drawer.clearAll")}
                      </button>
                    ) : null}
                  </div>
                ) : null}
                <div className="relative flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
                  {shown.length === 0 ? (
                    <p className="py-16 text-center text-sm text-ink/55">
                      {t("drawer.empty")}
                    </p>
                  ) : (
                    shown.map((h) => (
                      <div key={h.id} className="group/tile relative">
                        <HighlightTile
                          item={h}
                          compact
                          unseen={isUnseen(h)}
                          onOpen={() => {
                            markHighlightsSeen([h.id]);
                            close();
                          }}
                        />
                        {/* Outside the tile: a button can't sit inside its link.
                            Always visible on touch; on hover/focus with a mouse. */}
                        {canClear(h) ? (
                          <button
                            type="button"
                            onClick={() => clearHighlights([h.id])}
                            aria-label={t("drawer.dismiss")}
                            title={t("drawer.dismiss")}
                            className="absolute -left-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full border border-gold/40 bg-white text-ink/55 shadow-sm transition hover:text-maroon focus:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/tile:opacity-100"
                          >
                            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
                            </svg>
                          </button>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
                <div className="relative flex items-center justify-between gap-3 border-t border-gold/30 px-5 py-3">
                  <Link
                    href="/notices"
                    onClick={close}
                    className="text-sm font-semibold text-maroon hover:underline"
                  >
                    {t("drawer.allNotices")} →
                  </Link>
                  {hidden ? (
                    <button
                      type="button"
                      onClick={() => restoreHighlights(items.map((h) => h.id))}
                      className="text-sm text-ink/55 hover:text-maroon hover:underline"
                    >
                      {t("drawer.restore", { count: hidden })}
                    </button>
                  ) : null}
                </div>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
