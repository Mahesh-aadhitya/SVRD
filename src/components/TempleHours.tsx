"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import type { TempleTiming } from "@/lib/content-types";
import { formatTime } from "@/lib/seva-types";
import { hoursStatus, istMinutes, istWeekday, minutes, sessionsFor } from "@/lib/temple-hours";

// The current minute, ticking; 0 on the server (the home page is cached, so
// "now" — and so today's hours — are only known in the browser).
const subscribe = (tick: () => void) => {
  const id = window.setInterval(tick, 30_000);
  return () => window.clearInterval(id);
};
const nowMinute = () => Math.floor(Date.now() / 60_000);

// "Closing soon" / "Opening soon" inside this many minutes.
const SOON = 30;

// Status colours follow Google Maps, which most visitors already read at a
// glance: green open, amber about to change, red closed.
const TONE = {
  open: { text: "text-green-800", dot: "bg-green-600", ping: "bg-green-500" },
  soon: { text: "text-amber-800", dot: "bg-amber-500", ping: "bg-amber-400" },
  closed: { text: "text-kumkum", dot: "bg-kumkum", ping: "" },
};

// Home page: is darshan open right now, today's sessions on a day timeline
// with a "now" marker, and the way there.
export default function TempleHours({ timings, mapsUrl, locale }: { timings: TempleTiming[]; mapsUrl: string; locale: string }) {
  const t = useTranslations("home");
  const minute = useSyncExternalStore(subscribe, nowMinute, () => 0);
  const now = minute ? new Date(minute * 60_000) : null;
  const sessions = now ? sessionsFor(timings, istWeekday(now)) : null;
  const status = now ? hoursStatus(timings, now) : null;
  const nowMin = now ? istMinutes(now) : 0;
  const time = (hhmm: string) => formatTime(hhmm, locale);

  let tone = TONE.closed;
  let label = "";
  let detail = "";
  if (status?.state === "open") {
    const soon = minutes(status.until) - nowMin <= SOON;
    tone = soon ? TONE.soon : TONE.open;
    label = soon ? t("closingSoon") : t("openNow");
    detail = soon ? t("closesAt", { time: time(status.until) }) : t("openUntil", { time: time(status.until) });
  } else if (status?.state === "closed") {
    const soon = !status.tomorrow && minutes(status.opensAt) - nowMin <= SOON;
    tone = soon ? TONE.soon : TONE.closed;
    label = soon ? t("openingSoon") : t("closedNow");
    detail = status.tomorrow ? t("opensTomorrow", { time: time(status.opensAt) }) : t("opensAt", { time: time(status.opensAt) });
  } else if (status) {
    label = t("closedToday");
  }

  // The timeline spans whole hours around the day's sessions.
  const start = sessions?.length ? Math.floor(minutes(sessions[0].open) / 60) * 60 : 0;
  const end = sessions?.length ? Math.ceil(minutes(sessions[sessions.length - 1].close) / 60) * 60 : 0;
  const pct = (m: number) => `${((m - start) / (end - start)) * 100}%`;
  const sessionName = (open: string) => {
    const h = minutes(open) / 60;
    return h < 12 ? t("sessionMorning") : h < 16 ? t("sessionAfternoon") : t("sessionEvening");
  };

  // Between gold hairlines — not a card — like the board at the temple gate.
  // The minimum height keeps the page from jumping when "now" arrives.
  return (
    <section className="mx-auto max-w-6xl px-4 pt-5 sm:px-6" aria-label={t("hoursTitle")}>
      <div className="min-h-[6.5rem] border-y border-gold/40 py-3 sm:min-h-[5.75rem]">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          {status ? (
            <p className="inline-flex flex-wrap items-center gap-x-2 text-sm" aria-live="polite">
              <span className={`inline-flex items-center gap-1.5 font-semibold ${tone.text}`}>
                <span className="relative flex h-2.5 w-2.5" aria-hidden>
                  {tone.ping ? <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${tone.ping}`} /> : null}
                  <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${tone.dot}`} />
                </span>
                {label}
              </span>
              {detail ? <span className="text-ink/70">· {detail}</span> : null}
            </p>
          ) : (
            <span />
          )}
          {mapsUrl ? (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-maroon underline decoration-gold underline-offset-4 hover:decoration-maroon">
              {t("addressCta")} →
            </a>
          ) : null}
        </div>

        {sessions?.length ? (
          <div className="mt-3">
            {/* The day at a glance; the sessions below say the same in words. */}
            <div className="relative h-2 rounded-full bg-ink/10" aria-hidden>
              {sessions.map((s) => {
                const past = nowMin >= minutes(s.close);
                const current = nowMin >= minutes(s.open) && !past;
                return (
                  <span
                    key={s.open}
                    className={`absolute inset-y-0 rounded-full ${current ? "bg-green-600" : past ? "bg-gold/35" : "bg-gold"}`}
                    style={{ left: pct(minutes(s.open)), width: `calc(${pct(minutes(s.close))} - ${pct(minutes(s.open))})` }}
                  />
                );
              })}
              {nowMin >= start && nowMin <= end ? (
                <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: pct(nowMin) }}>
                  <span className="block h-4 w-4 rounded-full border-2 border-kolam bg-maroon shadow" />
                  <span className="absolute left-1/2 top-full mt-0.5 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-wide text-maroon">{t("now")}</span>
                </span>
              ) : null}
            </div>
            <ul className="mt-5 flex flex-wrap justify-between gap-x-6 gap-y-1 text-sm">
              {sessions.map((s) => {
                const past = nowMin >= minutes(s.close);
                const current = nowMin >= minutes(s.open) && !past;
                return (
                  <li key={s.open} className={past ? "text-ink/45" : "text-ink/75"}>
                    {/* Kannada times already carry the part of the day. */}
                    {locale === "kn" ? null : <span className={past ? "" : "text-ink/55"}>{sessionName(s.open)} </span>}
                    <span className={`font-medium ${past ? "" : current ? "text-green-800" : "text-maroon"}`}>
                      {time(s.open)} – {time(s.close)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
