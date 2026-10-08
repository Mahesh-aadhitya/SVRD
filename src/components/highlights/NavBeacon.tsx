"use client";

import { useTranslations } from "next-intl";
import { sectionOf, useHighlights, useSeenHighlights } from "./useHighlights";

// A small lit diya beside a menu item when something new waits there —
// it goes out once the devotee has visited. While the temple is streaming,
// the Live item shows a pulsing LIVE tag instead.
export default function NavBeacon({ href, onDark = false }: { href: string; onDark?: boolean }) {
  const t = useTranslations("highlights");
  const items = useHighlights();
  const seen = useSeenHighlights();
  if (!seen) return null;

  const here = items.filter((h) => sectionOf(h) === href);
  if (href === "/live" && here.some((h) => h.kind === "live")) {
    return (
      <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-red-600 px-1.5 py-px align-middle text-[10px] font-bold uppercase leading-4 tracking-wider text-white">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-80" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
        </span>
        {t("liveTag")}
      </span>
    );
  }
  if (!here.some((h) => h.isNew && !seen.has(h.id))) return null;
  return (
    <span className="nav-diya ml-1 inline-block align-[-1px]" aria-label={t("badges.new")} title={t("badges.new")}>
      <svg viewBox="0 0 16 20" className="h-3.5 w-3" aria-hidden>
        <path className="nav-diya__flame" d="M8 1c2.6 3.2 4 5.6 4 7.6A4 4 0 0 1 8 12.6a4 4 0 0 1-4-4C4 6.6 5.4 4.2 8 1z" fill="url(#diya-flame)" />
        <path d="M1 13.5h14c-.6 3.2-3.4 5.5-7 5.5s-6.4-2.3-7-5.5z" fill={onDark ? "#f2d78a" : "#b98a3d"} />
        <defs>
          <linearGradient id="diya-flame" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#e8590c" />
            <stop offset="0.6" stopColor="#fab005" />
            <stop offset="1" stopColor="#fff3bf" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}
