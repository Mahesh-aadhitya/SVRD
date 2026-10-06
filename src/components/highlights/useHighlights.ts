"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatIso } from "@/lib/dates";
import type { Highlight } from "@/lib/highlight-types";

const POLL_MS = 60_000;
const EMPTY: Highlight[] = [];

// ── One shared, self-refreshing list for the whole page ─────────────────
// The ribbon, every nav lamp and the home carousel read the same store, so
// there is one request a minute (plus one when the tab comes back into
// view) however many of them are on screen.

let current: Highlight[] = EMPTY;
let started = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

async function load() {
  try {
    const res = await fetch("/api/highlights", { cache: "no-store" });
    const data = res.ok ? ((await res.json()) as Highlight[]) : null;
    if (Array.isArray(data)) {
      current = data;
      emit();
    }
  } catch {
    // Offline — keep showing what we have.
  }
}

function start() {
  if (started) return;
  started = true;
  load();
  setInterval(load, POLL_MS);
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && load());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useHighlights(initial: Highlight[] = EMPTY) {
  useEffect(start, []);
  // Until the first fetch lands, show the server-rendered copy (home page)
  // so nothing flashes.
  return useSyncExternalStore(subscribe, () => (current === EMPTY ? initial : current), () => initial);
}

// ── What this browser has already looked at ─────────────────────────────

const SEEN_KEY = "temple-seen-highlights";
const SEEN_EVENT = "temple-seen-highlights-change";

function readSeenRaw(): string {
  try {
    return localStorage.getItem(SEEN_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function subscribeSeen(onChange: () => void) {
  window.addEventListener(SEEN_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SEEN_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// null on the server and during hydration, so "new" markers only appear
// once we know what this browser has seen (no flash of lit lamps).
export function useSeenHighlights(): Set<string> | null {
  const raw = useSyncExternalStore(subscribeSeen, readSeenRaw, () => null);
  return useMemo(() => {
    if (raw === null) return null;
    try {
      return new Set(JSON.parse(raw) as string[]);
    } catch {
      return new Set();
    }
  }, [raw]);
}

export function markHighlightsSeen(ids: string[]) {
  if (!ids.length) return;
  try {
    const seen = (JSON.parse(readSeenRaw()) as string[]).filter((x) => !ids.includes(x));
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, ...ids].slice(-80)));
  } catch {
    // Storage blocked — the lamp just stays lit.
  }
  window.dispatchEvent(new Event(SEEN_EVENT));
}

// "All updates" anywhere on the page opens the notification panel.
export const OPEN_NOTIFICATIONS_EVENT = "temple-open-notifications";
export function openNotifications() {
  window.dispatchEvent(new Event(OPEN_NOTIFICATIONS_EVENT));
}

// Which menu section each kind of highlight belongs to.
export function sectionOf(h: Highlight): string {
  switch (h.kind) {
    case "live":
    case "live_scheduled":
      return "/live";
    case "tickets":
      return "/booking";
    case "event":
      return "/events";
    default:
      return "/notices";
  }
}

// ── Display strings ─────────────────────────────────────────────────────

export function useHighlightText() {
  const t = useTranslations("highlights");
  const locale = useLocale() as "en" | "kn";
  const text = (v: { en: string; kn: string } | null) => (v ? v[locale] || v.en : "");
  const day = (iso: string | null) => (iso ? formatIso(iso, locale, { weekday: "short", day: "numeric", month: "short" }) : "");

  // "Today", "2 days ago" for messages; the day itself for tickets and events.
  const when = (h: Highlight) => {
    if (!h.date || h.kind === "live") return "";
    if (h.kind === "tickets") return t("when.from", { date: day(h.date) });
    if (h.kind === "event") return day(h.date);
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
    const days = Math.round((Date.parse(today) - Date.parse(h.date)) / 86_400_000);
    return days <= 0 ? t("when.today") : days === 1 ? t("when.yesterday") : days < 7 ? t("when.daysAgo", { days }) : day(h.date);
  };

  return (h: Highlight) => ({ ...describe(h), when: when(h) });

  function describe(h: Highlight) {
    switch (h.kind) {
      case "live":
        return { badge: t("badges.live"), title: t("live.title"), body: t("live.body"), cta: t("cta.live") };
      case "live_scheduled":
        return { badge: t("badges.live_scheduled"), title: t("liveScheduled.title"), body: h.detail ?? "", cta: t("cta.notice") };
      case "tickets":
        return {
          badge: t("badges.tickets"),
          title: text(h.title),
          body: text(h.body) || (h.date ? t("tickets.body", { date: day(h.date) }) : ""),
          cta: t("cta.tickets"),
        };
      case "event":
        return { badge: t("badges.event"), title: text(h.title), body: day(h.date), cta: t("cta.event") };
      default:
        return { badge: t(`badges.${h.kind}`), title: text(h.title), body: text(h.body), cta: t("cta.notice") };
    }
  }
}
