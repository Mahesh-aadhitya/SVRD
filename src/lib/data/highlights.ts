import "server-only";
import { getLiveConfig } from "@/lib/data/live";
import { getActiveNotices } from "@/lib/data/notices";
import { getActiveSevas } from "@/lib/data/sevas";
import { getEvents } from "@/lib/data/events";
import { nowInIndia, todayInIndia } from "@/lib/dates";
import { isReleasedOn, todayStillBookable, type Seva } from "@/lib/seva-types";
import type { Highlight } from "@/lib/highlight-types";

const NEW_FOR_DAYS = 3;
const EVENT_WINDOW_DAYS = 14;

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// The first date from `from` on that a seva can still be booked — the same
// rule as booking itself: released, not closed by the temple, and today
// only before 3 PM and while a time slot is still to start.
function nextBookable(s: Seva, from: string, today: string, now: string): string | null {
  if (!s.releaseEndDate) return null;
  for (let d = s.releaseStartDate && s.releaseStartDate > from ? s.releaseStartDate : from; d <= s.releaseEndDate; d = addDays(d, 1)) {
    if (!isReleasedOn(s, d) || d in s.blockedDates) continue;
    if (d === today && !todayStillBookable(s, now)) continue;
    return d;
  }
  return null;
}

// Everything worth leading a devotee to right now, most important first:
// sevas that can be booked for today lead (or, once today's last slot has
// started, for tomorrow), then a live stream, an alert,
// freshly opened tickets, other notices and upcoming events. Built entirely from what admins add (each
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

  const now = nowInIndia();
  const tomorrow = addDays(today, 1);
  const openSevas = new Set(sevas.map((s) => s.id));
  // Each seva's next bookable date: today leads ("Open today"), tomorrow
  // follows close behind ("For tomorrow").
  const nextOpen = new Map(sevas.map((s) => [s.id, nextBookable(s, today, today, now)]));
  const OPEN_TODAY_SCORE = 1100;
  const OPEN_TOMORROW_SCORE = 900;
  const openDetail = (date: string | null | undefined) => (date === today ? "open-today" : date === tomorrow ? "open-tomorrow" : null);
  const openScore = (date: string | null | undefined) => (date === today ? OPEN_TODAY_SCORE : date === tomorrow ? OPEN_TOMORROW_SCORE : null);
  const noticedSevas = new Set<string>();
  for (const n of notices) {
    const sevaId = n.linkUrl?.match(/[?&]seva=([a-z0-9-]+)/)?.[1];
    // "Tickets open" for a seva that's since been paused or closed would
    // send devotees to a booking they can't make.
    if (n.kind === "ticket_release" && sevaId && !openSevas.has(sevaId)) continue;
    if (n.kind === "ticket_release" && sevaId) noticedSevas.add(sevaId);
    const isNew = n.publishOn >= recent;
    const opens = n.kind === "ticket_release" && sevaId ? nextOpen.get(sevaId) : null;
    const score = openScore(opens) ?? (n.kind === "alert" ? 800 : n.kind === "ticket_release" ? 600 : 400) + (n.isPinned ? 100 : 0) + (isNew ? 50 : 0);
    scored.push({
      score,
      item: {
        ...base,
        id: `notice-${n.id}`,
        kind: n.kind === "alert" ? "alert" : n.kind === "ticket_release" ? "tickets" : "notice",
        href: n.linkUrl || `/notices#${n.id}`,
        title: n.title,
        body: n.body,
        // For tickets, the day they can next be booked for ("from Mon, 12 Oct").
        date: opens ?? n.publishOn,
        detail: openDetail(opens),
        isNew,
      },
    });
  }

  // Sevas open for booking that no release notice already announces
  // (sevas on request are always open — not news).
  for (const s of sevas) {
    if (s.frequency === "request") continue;
    const firstOpen = nextOpen.get(s.id);
    if (noticedSevas.has(s.id) || !firstOpen) continue;
    const isNew = !!s.releaseStartDate && s.releaseStartDate >= recent;
    scored.push({
      score: openScore(firstOpen) ?? 500 + (isNew ? 50 : 0),
      item: {
        ...base,
        id: `seva-${s.id}-${s.releaseEndDate}`,
        kind: "tickets",
        href: `/booking?seva=${s.id}`,
        title: s.name,
        date: firstOpen,
        detail: openDetail(firstOpen),
        isNew,
      },
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
