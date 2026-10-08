"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { useSessionUser } from "@/components/account/useSessionUser";
import HighlightTile from "./HighlightTile";
import { markHighlightsSeen, openNotifications, sectionOf, useHighlights, useSeenHighlights } from "./useHighlights";

const SHOWN_KEY = "temple-whatsnew-popup";
const noop = () => () => {};

function readShown(): string | null {
  try {
    return sessionStorage.getItem(SHOWN_KEY);
  } catch {
    return "blocked";
  }
}

// Once per visit — and again right after a devotee signs in — a small
// notification panel greets them with what's live and what's new since
// they last looked. Never on pages where they're filling a form.
export default function WhatsNewPopup() {
  const t = useTranslations("highlights");
  const items = useHighlights();
  const seen = useSeenHighlights();
  const pathname = usePathname();
  const user = useSessionUser();
  const [closedFor, setClosedFor] = useState<string | null>(null);
  // What this tab has already been shown: "<user id or guest>". null on the server.
  const shown = useSyncExternalStore(noop, readShown, () => "server");

  // Opening a section counts as having seen what's new in it (the menu
  // lamp beside it goes out).
  useEffect(() => {
    const ids = items.filter((h) => sectionOf(h) === pathname && h.isNew).map((h) => h.id);
    if (seen && ids.some((id) => !seen.has(id))) markHighlightsSeen(ids);
  }, [pathname, items, seen]);

  const who = user ? user.id : "guest";
  const fresh = seen ? items.filter((h) => h.kind === "live" || h.kind === "alert" || (h.isNew && !seen.has(h.id))).slice(0, 4) : [];
  const busyPage = /^\/(login|booking|donate|ticket)(\/|$)/.test(pathname);
  const open = user !== undefined && shown !== "server" && shown !== who && closedFor !== who && !busyPage && fresh.length > 0;

  function close() {
    try {
      sessionStorage.setItem(SHOWN_KEY, who);
    } catch {
      // Storage blocked — closing still hides it for this page view.
    }
    markHighlightsSeen(fresh.map((h) => h.id));
    setClosedFor(who);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!open) return null;
  const name = user ? String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? "").split(" ")[0] : "";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="whatsnew-title"
        onClick={(e) => e.stopPropagation()}
        className="animate-divine-fade-up relative w-full max-w-lg overflow-hidden rounded-t-3xl border border-gold/40 bg-cream shadow-2xl sm:rounded-3xl"
      >
        {/* Shankha — the conch that announces — watermarking the message */}
        <Image
          src="/images/shankha-watermark.png"
          alt=""
          width={1200}
          height={1486}
          className="pointer-events-none absolute -right-8 -top-6 h-44 w-auto opacity-[0.07]"
        />
        <div className="relative px-5 pb-3 pt-5 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-gold">{name ? t("popup.greeting", { name }) : t("popup.eyebrow")}</p>
          <h2 id="whatsnew-title" className="font-display text-2xl text-maroon">{t("popup.title")}</h2>
        </div>
        <div className="relative max-h-[60vh] space-y-2.5 overflow-y-auto px-4 pb-2 sm:px-5">
          {fresh.map((h) => (
            <HighlightTile key={h.id} item={h} compact unseen={h.isNew && h.kind !== "live"} onOpen={close} />
          ))}
        </div>
        <div className="relative flex items-center justify-between gap-3 border-t border-gold/25 px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => {
              close();
              openNotifications();
            }}
            className="text-sm font-semibold text-maroon hover:underline"
          >
            {t("viewAll")} →
          </button>
          <button type="button" onClick={close} className="rounded-full bg-maroon px-5 py-2 text-sm font-semibold text-cream hover:bg-maroon-dark">
            {t("popup.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
