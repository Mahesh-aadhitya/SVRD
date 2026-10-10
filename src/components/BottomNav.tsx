"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import NavBeacon from "./highlights/NavBeacon";
import { sectionOf, useHighlights, useSeenHighlights } from "./highlights/useHighlights";

// Phone/tablet tab bar: the four things devotees come for, one tap away —
// Book, Sevas, Live and Visit (temple, hours, map) — and More for the rest.
const tabs = [
  { href: "/booking", key: "book", icon: TicketIcon },
  { href: "/sevas", key: "sevas", icon: FlameIcon },
  { href: "/live", key: "live", icon: PlayIcon },
  { href: "/about", key: "visit", icon: MapPinIcon },
] as const;

const more = [
  { href: "/", key: "home", icon: HomeIcon },
  { href: "/panchangam", key: "panchangam", icon: SunIcon },
  { href: "/gallery", key: "gallery", icon: ImageIcon },
  { href: "/songs", key: "songs", icon: MusicIcon },
  { href: "/events", key: "events", icon: CalendarIcon },
  { href: "/notices", key: "notices", icon: BellIcon },
  { href: "/donate", key: "donate", icon: LotusIcon },
] as const;

const isActive = (href: string, pathname: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

export default function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  // The sheet belongs to the page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const tab = "flex min-w-0 flex-1 flex-col items-center gap-1 px-0.5 py-2 text-[10px] font-medium min-[360px]:text-[11px]";
  const moreActive = more.some((m) => isActive(m.href, pathname));

  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-[52] bg-ink/40 backdrop-blur-[2px] lg:hidden" onClick={() => setOpenOn(null)} aria-hidden />
      ) : null}
      <div
        id="more-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={t("more")}
        hidden={!open}
        className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] z-[55] mx-3 rounded-3xl border border-gold/40 bg-cream p-3 shadow-2xl lg:hidden"
      >
        <ul className="grid grid-cols-3 gap-2 min-[400px]:grid-cols-4">
          {more.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, pathname);
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  onClick={() => setOpenOn(null)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl px-1 py-3 text-center text-xs font-medium ${
                    active ? "bg-maroon/10 text-maroon" : "text-ink/75 hover:bg-gold/10"
                  }`}
                >
                  <span className="relative">
                    <Icon className="h-6 w-6 text-maroon" />
                    <span className="absolute -top-1.5 left-full -ml-1.5 flex whitespace-nowrap [&>*]:ml-0">
                      <NavBeacon href={item.href} />
                    </span>
                  </span>
                  <span className="line-clamp-2 leading-tight">{t(item.key)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/30 bg-cream/95 backdrop-blur supports-[backdrop-filter]:bg-cream/85 lg:hidden">
        <div className="mx-auto flex max-w-6xl items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom,0px)]">
          {tabs.map((item) => {
            const active = isActive(item.href, pathname);
            const Icon = item.icon;
            return (
              <Link key={item.key} href={item.href} className={tab}>
                {/* The beacon sits on the icon's corner, like an app badge, so
                    it never pushes narrow or Kannada labels into each other. */}
                <span className="relative">
                  <Icon className={`h-5 w-5 ${active ? "text-maroon" : "text-ink/45"}`} />
                  <span className="absolute -top-1.5 left-full -ml-1.5 flex whitespace-nowrap [&>*]:ml-0">
                    <NavBeacon href={item.href} />
                  </span>
                </span>
                <span className={`line-clamp-2 w-full text-center leading-tight ${active ? "text-maroon" : "text-ink/55"}`}>{t(item.key)}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setOpenOn(open ? null : pathname)}
            aria-expanded={open}
            aria-controls="more-sheet"
            className={tab}
          >
            <span className="relative">
              <GridIcon className={`h-5 w-5 ${open || moreActive ? "text-maroon" : "text-ink/45"}`} />
              <MoreDot />
            </span>
            <span className={`line-clamp-2 w-full text-center leading-tight ${open || moreActive ? "text-maroon" : "text-ink/55"}`}>{t("more")}</span>
          </button>
        </div>
      </nav>
    </>
  );
}

// A small lit dot on More when something new waits behind it.
function MoreDot() {
  const items = useHighlights();
  const seen = useSeenHighlights();
  const hrefs: string[] = more.map((m) => m.href);
  if (!seen || !items.some((h) => h.isNew && !seen.has(h.id) && hrefs.includes(sectionOf(h)))) return null;
  return <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-saffron ring-2 ring-cream" aria-hidden />;
}

type IconProps = { className?: string };
const stroke = { stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function TicketIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4V7.5Z" {...stroke} />
      <path d="M14 6.5v11" {...stroke} strokeDasharray="1.5 2" />
    </svg>
  );
}

function FlameIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 3c1 3-3 4-3 8a3 3 0 0 0 6 0c0-1.2-.6-2-1.2-2.8C14.6 9.7 15 11 15 12a5 5 0 1 1-9-3c0-3 2-4 3-6 0 1.5.5 2.3 1 3.5.4-1 1.4-2 2-3.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 8.5 16 12l-6 3.5v-7Z" fill="currentColor" />
    </svg>
  );
}

function MapPinIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" {...stroke} />
      <circle cx="12" cy="9.5" r="2.3" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function GridIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      {[
        [5, 5],
        [13.5, 5],
        [5, 13.5],
        [13.5, 13.5],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="5.5" height="5.5" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
      ))}
    </svg>
  );
}

function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M4 11.5 12 4l8 7.5M6 9.5V20h12V9.5" {...stroke} />
    </svg>
  );
}

function SunIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="4" {...stroke} />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" {...stroke} />
    </svg>
  );
}

function ImageIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="m4 17 5-5 3 3 3.5-4L20 16" {...stroke} />
    </svg>
  );
}

function MusicIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M9 18V6l10-2v12" {...stroke} />
      <circle cx="6.5" cy="18" r="2.5" {...stroke} />
      <circle cx="16.5" cy="16" r="2.5" {...stroke} />
    </svg>
  );
}

function CalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="4" y="5.5" width="16" height="14.5" rx="2" {...stroke} />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" {...stroke} />
    </svg>
  );
}

function BellIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15L6 16.5Z" {...stroke} />
      <path d="M10 20.5a2 2 0 0 0 4 0" {...stroke} />
    </svg>
  );
}

function LotusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 5c2 2.2 3 4.5 3 7s-1.3 4.5-3 6c-1.7-1.5-3-3.5-3-6s1-4.8 3-7Z" {...stroke} />
      <path d="M9.2 9.5C7.4 8.6 5.4 8.4 3.5 8.8c.3 3.6 2.7 7.4 8.5 9.2M14.8 9.5c1.8-.9 3.8-1.1 5.7-.7-.3 3.6-2.7 7.4-8.5 9.2" {...stroke} />
    </svg>
  );
}
