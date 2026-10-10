"use client";

import { useTranslations } from "next-intl";
import { DHANURMASA, TIRUPPAVAI } from "@/lib/panchang/dhanurmasa";
import { label } from "@/lib/panchang/names";
import ShareButton from "@/components/ShareButton";
import { verseLines } from "@/lib/panchang/verses";

const glass =
  "rounded-3xl border border-white/10 bg-[#0b0820]/70 shadow-[0_0_40px_rgba(90,70,220,0.18)] backdrop-blur-md";

// Through Dhanurmasa: which day of the month it is, and that day's
// Tiruppavai pasuram with its meaning in Kannada and English.
export default function DhanurmasaCard({ day, date, locale, className = "" }: { day: number; date: string; locale: string; className?: string }) {
  const t = useTranslations("panchangam");
  const pasuram = TIRUPPAVAI[Math.min(day, 30) - 1];
  const number = Math.min(day, 30);
  const gists = locale === "kn" ? [pasuram.gist.kn, pasuram.gist.en] : [pasuram.gist.en, pasuram.gist.kn];

  return (
    <section className={`${glass} relative overflow-hidden border-amber-300/30 p-5 sm:p-6 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative */}
      <img src="/images/emblem-naamam.png" alt="" aria-hidden className="pointer-events-none absolute -right-4 bottom-0 h-40 w-auto opacity-[0.08]" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-amber-200/70">{label(DHANURMASA.name, locale)}</p>
          <h2 className="font-display mt-1 text-lg text-amber-200">{t("dhanurmasa.day", { day })}</h2>
        </div>
        <ShareButton
          tone="dark"
          title={`${label(DHANURMASA.name, locale)} · ${t("dhanurmasa.day", { day })}`}
          text={[t("dhanurmasa.pasuram", { n: number }), ...verseLines(pasuram, locale).map((l) => l.text), pasuram.tamil, ...gists].join("\n\n")}
          path={`/panchangam?date=${date}`}
          className="relative z-10"
        />
      </div>
      <p className="mt-3 text-xs uppercase tracking-wider text-indigo-100/55">{t("dhanurmasa.pasuram", { n: number })}</p>
      <blockquote className="mt-1 border-l-2 border-amber-300/50 pl-4 text-[15px] text-amber-50">
        {/* Always in Kannada script; the English site shows it romanised first. */}
        {verseLines(pasuram, locale).map((line, i) => (
          <span key={line.lang} lang={line.lang} className={`block ${i ? "mt-1 text-sm text-amber-50/80" : ""}`} style={line.lang === "kn" ? { fontFamily: "var(--font-temple-kannada), var(--font-temple-sans), sans-serif" } : undefined}>
            {line.text}…
          </span>
        ))}
        <span lang="ta" className="mt-1 block text-xs text-indigo-100/55">
          {pasuram.tamil}…
        </span>
      </blockquote>
      <div className="mt-3 space-y-2 text-sm leading-relaxed">
        <p className="text-white/85">{gists[0]}</p>
        <p className="text-indigo-100/60">{gists[1]}</p>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-indigo-100/55">{label(DHANURMASA.about, locale)}</p>
    </section>
  );
}
