import "server-only";
import { getLiveConfig } from "@/lib/data/live";
import { getActiveNotices } from "@/lib/data/notices";
import { getActiveSevas } from "@/lib/data/sevas";
import { getEvents } from "@/lib/data/events";
import { todayInIndia } from "@/lib/dates";
import { isReleasedOn } from "@/lib/seva-types";
import type { Highlight } from "@/lib/highlight-types";

const NEW_FOR_DAYS = 3;
const EVENT_WINDOW_DAYS = 14;

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Everything worth leading a devotee to right now, most important first:
// a live stream beats an alert beats freshly opened tickets beats other
// notices and upcoming events. Built entirely from what admins add (each
// source is tag-cached and refreshed when they save), so the home page and
// the site-wide spotlight change by themselves.
export async function getHighlights(): Promise<Highlight[]> {
  const [live, notices, sevas, events] = await Promise.all([
    getLiveConfig().catch(() => null),
    getActiveNotices().catch(() => []),
    getActiveSevas().catch(() => []),
    getEvents().catch(() => []),
  ]);
  const today = todayInIndia();
  const recent = addDays(today, -NEW_FOR_DAYS);
  const scored: { score: number; item: Highlight }[] = [];
  const base = { title: null, body: null, date: null, image: null, detail: null, isNew: false };

  if (live?.isLive) {
    scored.push({ score: 1000, item: { ...base, id: "live", kind: "live", href: "/live", isNew: true } });
  } else if (live?.scheduledAt) {
    scored.push({
      score: 300,
      item: { ...base, id: `live-scheduled-${live.scheduledAt}`, kind: "live_scheduled", href: "/live", detail: live.scheduledAt },
    });
  }

  const noticedSevas = new Set<string>();
  for (const n of notices) {
    const sevaId = n.linkUrl?.match(/[?&]seva=([a-z0-9-]+)/)?.[1];
    if (n.kind === "ticket_release" && sevaId) noticedSevas.add(sevaId);
    const isNew = n.publishOn >= recent;
    const score =
      (n.kind === "alert" ? 800 : n.kind === "ticket_release" ? 600 : 400) + (n.isPinned ? 100 : 0) + (isNew ? 50 : 0);
    scored.push({
      score,
      item: {
        ...base,
        id: `notice-${n.id}`,
        kind: n.kind === "alert" ? "alert" : n.kind === "ticket_release" ? "tickets" : "notice",
        href: n.linkUrl || `/notices#${n.id}`,
        title: n.title,
        body: n.body,
        date: n.publishOn,
        isNew,
      },
    });
  }

  // Sevas open for booking that no release notice already announces.
  for (const s of sevas) {
    if (noticedSevas.has(s.id) || !s.releaseEndDate || s.releaseEndDate < today) continue;
    let firstOpen: string | null = null;
    for (let d = s.releaseStartDate && s.releaseStartDate > today ? s.releaseStartDate : today; d <= s.releaseEndDate; d = addDays(d, 1)) {
      if (isReleasedOn(s, d)) {
        firstOpen = d;
        break;
      }
    }
    if (!firstOpen) continue;
    const isNew = !!s.releaseStartDate && s.releaseStartDate >= recent;
    scored.push({
      score: 500 + (isNew ? 50 : 0),
      item: { ...base, id: `seva-${s.id}-${s.releaseEndDate}`, kind: "tickets", href: `/booking?seva=${s.id}`, title: s.name, date: firstOpen, isNew },
    });
  }

  const eventCutoff = addDays(today, EVENT_WINDOW_DAYS);
  for (const e of events) {
    if (e.date < today || e.date > eventCutoff) continue;
    const daysAway = Math.round((Date.parse(e.date) - Date.parse(today)) / 86_400_000);
    scored.push({
      score: 450 - daysAway * 10,
      item: { ...base, id: `event-${e.id}`, kind: "event", href: "/events", title: e.title, date: e.date, image: e.image, isNew: daysAway <= 2 },
    });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((s) => s.item);
}
