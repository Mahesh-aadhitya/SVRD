"use client";

import { useTranslations } from "next-intl";
import { label } from "@/lib/panchang/names";
import type { Verse } from "@/lib/panchang/verses";
import ShareButton from "@/components/ShareButton";

const glass =
  "rounded-3xl border border-white/10 bg-[#0b0820]/70 shadow-[0_0_40px_rgba(90,70,220,0.18)] backdrop-blur-md";

// The day's verse: the original (Kannada script for Kannada readers,
// romanised otherwise, plus the Alwars' Tamil), then its meaning in both
// Kannada and English — the page's language first.
export default function VerseCard({ verse, locale, date, className = "" }: { verse: Verse; locale: string; date: string; className?: string }) {
  const t = useTranslations("panchangam");
  const meanings: ["kn" | "en", string][] = locale === "kn" ? [["kn", verse.meaning.kn], ["en", verse.meaning.en]] : [["en", verse.meaning.en], ["kn", verse.meaning.kn]];

  return (
    <section className={`${glass} relative overflow-hidden p-5 sm:p-6 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative watermark */}
      <img
        src="/images/emblem-chakra.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-48 w-auto opacity-[0.07]"
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs uppercase tracking-widest text-amber-200/70">{t("verseOfDay")}</p>
        <ShareButton
          tone="dark"
          title={`📿 ${label(verse.source, locale)}`}
          text={[locale === "kn" ? verse.kn : verse.roman, `${t("meaningIn.kn")}: ${verse.meaning.kn}`, `${t("meaningIn.en")}: ${verse.meaning.en}`].join("\n\n")}
          path={`/panchangam?date=${date}`}
          className="relative z-10"
        />
      </div>
      <h2 className="font-display mt-1 text-lg text-amber-200">{label(verse.source, locale)}</h2>
      <blockquote className="mt-3 whitespace-pre-line border-l-2 border-amber-300/50 pl-4 text-[15px] leading-relaxed text-amber-50 sm:text-base">
        {locale === "kn" ? verse.kn : verse.roman}
      </blockquote>
      {verse.tamil ? (
        <p lang="ta" className="mt-2 whitespace-pre-line pl-4 text-xs leading-relaxed text-indigo-100/55">
          {verse.tamil}
        </p>
      ) : null}
      <div className="mt-4 space-y-3">
        {meanings.map(([lang, text]) => (
          <div key={lang}>
            <p className="text-[11px] uppercase tracking-wider text-indigo-100/50">{t(`meaningIn.${lang}`)}</p>
            <p lang={lang} className="mt-0.5 text-sm leading-relaxed text-white/85">
              {text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
