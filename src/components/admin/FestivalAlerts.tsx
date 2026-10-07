"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import type { PanchangLocation } from "@/lib/panchang/compute";
import { observanceName } from "@/lib/panchang/observance-text";
import { scanDays } from "@/lib/panchang/year";
import { todayInIndia } from "@/lib/dates";

const LEAD_DAYS = 3;
const SEEN_KEY = "admin-festival-alerts-shown";

type Alert = { date: string; inDays: number; name: string; kind: "tirunakshatram" | "utsava" };

function addDays(iso: string, n: number) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

// Reminders across the admin panel for every Alwar/Acharya tirunakshatram
// (and our own utsavas): from three days before through the day itself,
// so the office can plan the seva, alankara and prasadam. Once allowed,
// the browser also shows a notification for each, once.
export default function FestivalAlerts({ location }: { location: PanchangLocation }) {
  const [today] = useState(todayInIndia);
  const alerts = useMemo<Alert[]>(
    () =>
      scanDays(today, addDays(today, LEAD_DAYS), location).flatMap((d, inDays) =>
        d.observances.flatMap((o) =>
          o.kind === "tirunakshatram" || o.kind === "utsava" ? [{ date: d.date, inDays, name: observanceName(o, "en"), kind: o.kind }] : [],
        ),
      ),
    [today, location],
  );
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    setPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  // One notification per alert per day it's shown.
  useEffect(() => {
    if (permission !== "granted" || !alerts.length) return;
    let seen: string[] = [];
    try {
      seen = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]");
    } catch {
      // Storage blocked: notify anyway, at worst twice.
    }
    const fresh = alerts.filter((a) => !seen.includes(`${today}|${a.date}|${a.name}`));
    for (const a of fresh) {
      new Notification(a.inDays === 0 ? `Today: ${a.name}` : `${when(a.inDays)}: ${a.name}`, {
        body: `${fmt(a.date)} — Sri Varadaraja Swamy Devasthaanam`,
        icon: "/icon-192.png",
        tag: `${a.date}|${a.name}`,
      });
    }
    try {
      const keep = [...seen, ...fresh.map((a) => `${today}|${a.date}|${a.name}`)].filter((k) => k >= addDays(today, -7));
      localStorage.setItem(SEEN_KEY, JSON.stringify(keep));
    } catch {
      // See above.
    }
  }, [alerts, permission, today]);

  if (!alerts.length) return null;

  return (
    <div className="border-b border-amber-300/50 bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 px-4 py-2.5 text-sm sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1.5">
        <span className="font-semibold text-maroon">🔔 Coming up</span>
        {alerts.map((a) => (
          <Link
            key={`${a.date}-${a.name}`}
            href={`/panchangam?date=${a.date}`}
            className={`rounded-full px-3 py-0.5 ${a.inDays === 0 ? "bg-maroon text-cream" : "bg-white/80 text-maroon-dark"} hover:brightness-105`}
          >
            <b>{when(a.inDays)}</b> · {a.name}
          </Link>
        ))}
        {permission === "default" ? (
          <button
            type="button"
            onClick={() => Notification.requestPermission().then(setPermission)}
            className="ml-auto text-xs font-semibold text-maroon underline underline-offset-2"
          >
            Turn on notifications
          </button>
        ) : null}
      </div>
    </div>
  );
}

const when = (inDays: number) => (inDays === 0 ? "Today" : inDays === 1 ? "Tomorrow" : `In ${inDays} days`);
const fmt = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
