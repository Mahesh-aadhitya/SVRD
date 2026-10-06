"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { computePanchang, TEMPLE_LOCATION } from "@/lib/panchang/compute";
import { formatSpan, formatTime } from "@/lib/panchang/format";
import { NAKSHATRA_NAMES, PAKSHAS, VARAS, label, tithiName } from "@/lib/panchang/names";
import { todayInIndia } from "@/lib/dates";

/**
 * Home-page glimpse of today's panchangam, linking to the full page. The
 * home page is statically cached, so the server-rendered date can be a day
 * old — the browser moves it on to today's date after hydration.
 */
export default function PanchangTeaser({ locale, initialDate }: { locale: string; initialDate: string }) {
  const t = useTranslations("panchangam");
  const [date, setDate] = useState(initialDate);
  useEffect(() => {
    setDate(todayInIndia()); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);
  const day = useMemo(() => computePanchang(date, TEMPLE_LOCATION), [date]);
  const tithi = day.tithi[0].index;
  const loc = day.location;

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <Link
        href="/panchangam"
        className="group relative block overflow-hidden rounded-3xl border border-gold/40 bg-[#05030f] p-6 text-white shadow-lg transition-transform hover:-translate-y-0.5"
      >
        {/* A few stars and nebula glows, echoing the Brahmanda page. */}
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(1.5px 1.5px at 14% 22%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 78% 18%, #fff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 62% 74%, #fde7b0 50%, transparent 51%), radial-gradient(1px 1px at 32% 82%, #cfe0ff 50%, transparent 51%), radial-gradient(1px 1px at 90% 60%, #fff 50%, transparent 51%), radial-gradient(ellipse 50% 70% at 0% 0%, rgba(110,52,170,0.5), transparent 70%), radial-gradient(ellipse 50% 70% at 100% 100%, rgba(30,110,150,0.45), transparent 70%)",
          }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className={`text-xs uppercase text-amber-200/80 ${locale === "kn" ? "" : "tracking-[0.3em]"}`}>{t("todayPanchanga")}</p>
            <p className="font-display mt-1 text-2xl text-amber-100">
              {label(VARAS[day.weekday], locale)} · {tithi === 14 || tithi === 29 ? "" : `${label(PAKSHAS[day.paksha], locale).split(" ")[0]} `}
              {label(tithiName(tithi), locale)}
            </p>
            <p className="mt-1 text-sm text-indigo-100/80">
              {t("nakshatra")}: {label(NAKSHATRA_NAMES[day.nakshatra[0].index], locale)} · {t("sunrise")} {formatTime(day.sunrise, loc, locale)} ·{" "}
              {t("rahuKalam")} {formatSpan(day.rahuKalam, day, locale)}
            </p>
          </div>
          <span className="shrink-0 self-start rounded-full bg-gradient-to-r from-amber-300 to-orange-400 px-5 py-2 text-sm font-semibold text-[#1a0f05] sm:self-auto">
            {t("pageTitle")} →
          </span>
        </div>
      </Link>
    </section>
  );
}
