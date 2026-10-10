import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import SectionHeading from "@/components/SectionHeading";
import ContentImage from "@/components/ContentImage";
import ShareButton from "@/components/ShareButton";
import { ChipCount, ChipRow, chipClass } from "@/components/ui/Chip";
import { getListedSevas } from "@/lib/data/sevas";
import { formatIso, nowInIndia, todayInIndia } from "@/lib/dates";
import { formatTiming, isReleasedOn, SEVA_FREQUENCIES, todayStillBookable, weekdayName, type Seva, type SevaFrequency } from "@/lib/seva-types";
import type { Locale } from "@/i18n/routing";

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// The next date a devotee can book, or null when booking isn't open (today
// only before 3 PM and while one of its time slots is still to start).
function nextOpenDate(seva: Seva, today: string, now: string) {
  if (!seva.isActive || !seva.releaseEndDate || seva.releaseEndDate < today) return null;
  for (let d = seva.releaseStartDate && seva.releaseStartDate > today ? seva.releaseStartDate : today; d <= seva.releaseEndDate; d = addDays(d, 1)) {
    if (d === today && !todayStillBookable(seva, now)) continue;
    if (isReleasedOn(seva, d) && !(d in seva.blockedDates)) return d;
  }
  return null;
}

export default async function SevasPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [{ type }, sevas] = await Promise.all([searchParams, getListedSevas()]);
  const today = todayInIndia();
  const now = nowInIndia();
  const open = Object.fromEntries(sevas.map((s) => [s.id, nextOpenDate(s, today, now)]));
  const frequency = SEVA_FREQUENCIES.find((f) => f === type) ?? null;
  return <Content sevas={sevas} open={open} frequency={frequency} />;
}

function Content({ sevas, open, frequency }: { sevas: Seva[]; open: Record<string, string | null>; frequency: SevaFrequency | null }) {
  const t = useTranslations("sevas");
  const all = SEVA_FREQUENCIES.map((f) => [f, sevas.filter((s) => s.frequency === f)] as const).filter(([, list]) => list.length > 0);
  // One type, or every type in its own section ("All", the default).
  const groups = frequency ? all.filter(([f]) => f === frequency) : all;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <SectionHeading title={t("pageTitle")} subtitle={t("pageSubtitle")} />

      {all.length > 1 ? (
        <nav className="mt-6" aria-label={t("pageTitle")}>
          <ChipRow label={t("typeLabel")}>
            {all.map(([f, list]) => (
              <Link key={f} href={{ pathname: "/sevas", query: { type: f } }} scroll={false} className={chipClass(frequency === f)}>
                {t(`groups.${f}.title`)}
                <ChipCount count={list.length} active={frequency === f} />
              </Link>
            ))}
            <Link href="/sevas" scroll={false} className={chipClass(frequency === null)}>
              {t("allSevas")}
              <ChipCount count={sevas.length} active={frequency === null} />
            </Link>
          </ChipRow>
        </nav>
      ) : null}

      {/* Any seva on a day of the devotee's choosing, on request (when the admin allows any). */}
      {sevas.some((s) => s.allowRequests) ? (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-gold/40 bg-gradient-to-r from-[#fbf1de] to-[#f4e4bd] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg text-maroon">🪔 {t("bannerTitle")}</p>
            <p className="mt-0.5 text-sm text-ink/70">{t("bannerBody")}</p>
          </div>
          <Link href="/seva-request" className="shrink-0 self-start rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark sm:self-auto">
            {t("bannerCta")}
          </Link>
        </div>
      ) : null}

      {groups.length === 0 ? <p className="mt-10 text-center text-sm text-ink/55">{t("empty")}</p> : null}

      <div className="mt-8 space-y-12">
        {groups.map(([f, list]) => (
          <section key={f} id={f} className="scroll-mt-24">
            <h2 className="font-display text-2xl text-maroon">{t(`groups.${f}.title`)}</h2>
            <p className="mt-0.5 text-sm text-ink/60">{t(`groups.${f}.subtitle`)}</p>
            {/* Phones: a sideways swipe row, the next card peeking in; larger screens: a grid. */}
            <div className="-mx-4 mt-5 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto overscroll-x-contain px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden">
              {list.map((seva) => (
                <SevaCard key={seva.id} seva={seva} frequency={f} nextDate={open[seva.id]} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function SevaCard({ seva, frequency, nextDate }: { seva: Seva; frequency: SevaFrequency; nextDate: string | null }) {
  const t = useTranslations("sevas");
  const locale = useLocale() as Locale;
  const schedule = seva.schedule[locale] || seva.schedule.en;

  return (
    <article
      id={`seva-${seva.id}`}
      className="flex w-[82%] max-w-sm shrink-0 snap-start scroll-mt-24 flex-col overflow-hidden rounded-2xl border border-gold/25 bg-white/85 shadow-sm sm:w-auto sm:max-w-none"
    >
      <div className="relative h-56 w-full overflow-hidden">
        <ContentImage src={seva.imageUrl} alt={seva.name[locale]} focus={seva.imageFocus} />
        <span className="absolute left-3 top-3 rounded-full bg-cream/95 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-maroon shadow-sm">
          {t(`groups.${frequency}.badge`)}
        </span>
        {nextDate ? (
          <span className="absolute right-3 top-3 rounded-full bg-maroon px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-gold-light shadow-sm">
            {t("open")}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-xl text-maroon">{seva.name[locale]}</h3>
          <ShareButton
            compact
            title={seva.name[locale]}
            text={[schedule, seva.timing ? formatTiming(seva.timing, locale) : null, seva.description[locale]].filter(Boolean).join("\n")}
            path={`/sevas#seva-${seva.id}`}
          />
        </div>
        <dl className="mt-2 space-y-1 text-sm">
          {schedule ? (
            <div className="flex gap-2">
              <dt className="sr-only">{t("when")}</dt>
              <dd className="text-ink/75">🗓 {schedule}</dd>
            </div>
          ) : null}
          {seva.timing ? (
            <div className="flex gap-2">
              <dt className="sr-only">{t("timing")}</dt>
              <dd className="font-medium text-saffron">🕉 {formatTiming(seva.timing, locale)}</dd>
            </div>
          ) : null}
        </dl>
        <p className="mt-3 line-clamp-3 text-sm text-ink/65">{seva.description[locale]}</p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <p className="text-sm">
            {seva.price === 0 ? (
              <span className="font-semibold text-ink/70">{t("free")}</span>
            ) : (
              <>
                <span className="text-lg font-bold text-maroon">₹{seva.price}</span> <span className="text-xs text-ink/50">{t("perTicket")}</span>
              </>
            )}
          </p>
          {nextDate ? (
            <div className="text-right">
              <Link
                href={{ pathname: "/booking", query: { seva: seva.id } }}
                className="inline-block rounded-full bg-maroon px-5 py-2 text-sm font-semibold text-cream hover:bg-maroon-dark"
              >
                {t("book")}
              </Link>
              <p className="mt-1 text-[11px] text-ink/50">
                {t("nextDate", { date: formatIso(nextDate, locale, { weekday: "short", day: "numeric", month: "short" }) })}
              </p>
            </div>
          ) : (
            <span className="rounded-full bg-black/[0.04] px-3 py-1.5 text-xs font-medium text-ink/50">{t("notOpen")}</span>
          )}
        </div>
        {frequency === "request" ? (
          <p className="mt-3 text-xs text-ink/60">
            🗓{" "}
            {t("requestRule", {
              days: seva.releaseWeekdays?.length ? seva.releaseWeekdays.map((d) => weekdayName(d, locale, "short")).join(", ") : t("everyDay"),
              notice: seva.bookMinDays,
            })}
          </p>
        ) : null}
        {/* Sevas the admin allows can be asked for on a special day — on-request ones too, for a day their rules don't offer. */}
        {seva.allowRequests ? (
          <Link
            href={{ pathname: "/seva-request", query: { seva: seva.id } }}
            className="mt-3 self-start text-xs font-semibold text-maroon/80 underline decoration-gold underline-offset-4 hover:text-maroon"
          >
            🪔 {t("requestOther")}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
