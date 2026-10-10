import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import SectionHeading from "@/components/SectionHeading";
import ZoomablePortrait from "@/components/acharya/ZoomablePortrait";
import YouTubeRecordings from "@/components/acharya/YouTubeRecordings";
import { PRABANDHAM_TANIANS, RECORDINGS } from "@/lib/panchang/recordings";
import { ACHARYAS, acharyaPath, mediaFor, tirunakshatramOf, type Acharya } from "@/lib/panchang/acharyas";
import { NAKSHATRA_NAMES, label } from "@/lib/panchang/names";
import { nextTirunakshatram } from "@/lib/panchang/tirunakshatram-dates";
import { templeLocationFrom } from "@/lib/panchang/compute";
import { getAcharyaMedia } from "@/lib/data/acharya-media";
import { getTempleInfo } from "@/lib/data/temple-info";
import { formatIso, todayInIndia } from "@/lib/dates";

// The "next tirunakshatram" dates and "today" badges move with the calendar,
// so the prerendered page is refreshed every hour.
export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "panchangam" });
  return { title: t("acharya.indexTitle"), description: t("acharya.indexSubtitle") };
}

export default async function AcharyasPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tMeta, uploads, info] = await Promise.all([
    getTranslations({ locale, namespace: "panchangam" }),
    getTranslations({ locale, namespace: "meta" }),
    getAcharyaMedia(),
    getTempleInfo().catch(() => null),
  ]);
  const loc = templeLocationFrom(info, tMeta("siteTitle"));
  const today = todayInIndia();
  const nextOf = new Map(
    ACHARYAS.map((a) => [a.slug, a.tirunakshatram === undefined ? null : nextTirunakshatram(a.tirunakshatram, today, loc)]),
  );

  const groups: [string, string, Acharya[]][] = (
    [
      ["alwars", "alwar"],
      ["acharyas", "acharya"],
      ["recent", "recent"],
      ["nityasuris", "nityasuri"],
    ] as const
  ).map(([key, kind]) => [t(`acharya.${key}`), t(`acharya.${key}Note`), ACHARYAS.filter((a) => a.kind === kind)]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/panchangam" className="text-sm font-semibold text-maroon underline-offset-4 hover:underline">
        ← {t("pageTitle")}
      </Link>
      <SectionHeading className="mt-3" title={t("acharya.indexTitle")} subtitle={t("acharya.indexSubtitle")} />

      <div className="mt-8 space-y-12">
        {groups.map(([title, note, list]) => (
          <section key={title}>
            <h2 className="font-display text-2xl text-maroon">{title}</h2>
            <p className="mt-0.5 text-sm text-ink/60">{note}</p>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((a) => {
                const next = nextOf.get(a.slug);
                const tn = tirunakshatramOf(a);
                const media = mediaFor(a, uploads);
                const isToday = next === today;
                return (
                  <li key={a.slug}>
                    <Link
                      href={acharyaPath(a.slug)}
                      className={`flex h-full items-center gap-4 rounded-2xl border bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                        isToday ? "border-maroon ring-2 ring-gold/60" : "border-gold/25"
                      }`}
                    >
                      <ZoomablePortrait name={label(a.name, locale)} imageUrl={media.imageUrl} fullImageUrl={media.imageFullUrl} size={64} />
                      <span className="min-w-0">
                        <span className="block font-display text-lg leading-tight text-maroon">{label(a.name, locale)}</span>
                        <span className="mt-0.5 block text-xs text-ink/55">
                          {tn ? `${label(tn.month, locale)} · ${label(NAKSHATRA_NAMES[tn.nakshatra], locale)}` : t("acharya.tirunakshatramUnknown")}
                          {media.audioUrl || RECORDINGS[a.slug]?.length ? ` · 🎧 ${t("acharya.listenShort")}` : ""}
                        </span>
                        {isToday ? (
                          <span className="mt-1.5 inline-block rounded-full bg-maroon px-2 py-0.5 text-[11px] font-bold text-gold-light">
                            🪔 {t("acharya.todayBadge")}
                          </span>
                        ) : next ? (
                          <span className="mt-1.5 block text-[11px] font-medium text-saffron">
                            {t("acharya.next", { date: formatIso(next, locale, { day: "numeric", month: "short", year: "numeric" }) })}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        <section className="max-w-2xl">
          <h2 className="font-display text-2xl text-maroon">{t("acharya.tanians")}</h2>
          <p className="mt-0.5 text-sm text-ink/60">{t("acharya.taniansNote")}</p>
          <YouTubeRecordings className="mt-4" recordings={PRABANDHAM_TANIANS} locale={locale} title={t("acharya.tanians")} />
        </section>
      </div>
    </div>
  );
}
