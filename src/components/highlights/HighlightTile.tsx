"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useHighlightText } from "./useHighlights";
import type { Highlight, HighlightKind } from "@/lib/highlight-types";

// The emblem that marks each kind of update: the shankha announces a
// message, the chakram a ticket release, the Lord's own image a live
// darshan, a lamp a festival.
const ART: Record<HighlightKind, { src: string; w: number; h: number; photo?: boolean }> = {
  live: { src: "/images/deity-hero.png", w: 900, h: 1200, photo: true },
  live_scheduled: { src: "/images/deity-hero.png", w: 900, h: 1200, photo: true },
  alert: { src: "/images/shankha-watermark.png", w: 1200, h: 1486 },
  notice: { src: "/images/shankha-watermark.png", w: 1200, h: 1486 },
  tickets: { src: "/images/chakra-watermark.png", w: 1200, h: 1432 },
  event: { src: "/images/hanging-lamp.png", w: 280, h: 1080 },
};

const ACCENT: Record<HighlightKind, { bar: string; label: string }> = {
  live: { bar: "bg-red-600", label: "text-red-700" },
  live_scheduled: { bar: "bg-maroon", label: "text-maroon" },
  alert: { bar: "bg-red-600", label: "text-red-700" },
  tickets: { bar: "bg-maroon", label: "text-maroon" },
  notice: { bar: "bg-gold", label: "text-[#8a6420]" },
  event: { bar: "bg-saffron", label: "text-[#a14a0c]" },
};

// One notification tile: emblem on the left, kind · when, title, a line
// of detail, and a NEW dot until the devotee has seen it.
export default function HighlightTile({ item, unseen = false, compact = false, onOpen }: {
  item: Highlight;
  unseen?: boolean;
  compact?: boolean;
  onOpen?: () => void;
}) {
  const t = useTranslations("highlights");
  const d = useHighlightText()(item);
  const art = item.kind === "event" && item.image ? { src: item.image, w: 400, h: 400, photo: true } : ART[item.kind];
  const accent = ACCENT[item.kind];
  const live = item.kind === "live";

  return (
    <Link
      href={item.href}
      onClick={onOpen}
      className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-gold/25 bg-white/90 shadow-sm transition hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-md ${
        compact ? "p-3 pl-4" : "p-4 pl-5"
      }`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${accent.bar}`} aria-hidden />

      <span
        className={`relative grid shrink-0 place-items-center overflow-hidden rounded-xl ${compact ? "h-12 w-12" : "h-14 w-14"} ${
          art.photo ? "" : "bg-[#f7ecd6] ring-1 ring-gold/30"
        } ${live ? "ring-2 ring-red-600 ring-offset-2 ring-offset-white" : ""}`}
      >
        {art.photo ? (
          <Image src={art.src} alt="" fill sizes="56px" className="object-cover object-[50%_15%]" />
        ) : (
          <Image src={art.src} alt="" width={art.w} height={art.h} className={`${compact ? "h-9" : "h-10"} w-auto`} />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide">
          {live ? (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
            </span>
          ) : null}
          <span className={accent.label}>{d.badge}</span>
          {d.when ? <span className="font-medium normal-case tracking-normal text-ink/45">· {d.when}</span> : null}
        </span>
        <span className={`mt-0.5 block font-display leading-snug text-maroon ${compact ? "line-clamp-1 text-base" : "line-clamp-2 text-lg"}`}>
          {d.title}
        </span>
        {d.body ? <span className="mt-0.5 line-clamp-1 block text-sm text-ink/60">{d.body}</span> : null}
      </span>

      {unseen ? (
        <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white" aria-label={t("badges.new")} />
      ) : null}
      <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-ink/25 transition group-hover:translate-x-0.5 group-hover:text-maroon" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M8 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
