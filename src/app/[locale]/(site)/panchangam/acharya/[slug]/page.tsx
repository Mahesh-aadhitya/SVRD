import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import ShareButton from "@/components/ShareButton";
import ZoomablePortrait from "@/components/acharya/ZoomablePortrait";
import VerseAudio from "@/components/acharya/VerseAudio";
import YouTubeRecordings from "@/components/acharya/YouTubeRecordings";
import { RECORDINGS } from "@/lib/panchang/recordings";
import { ACHARYAS, acharyaBySlug, acharyaPath, mediaFor, tirunakshatramOf } from "@/lib/panchang/acharyas";
import { NAKSHATRA_NAMES, label } from "@/lib/panchang/names";
import { nextTirunakshatram } from "@/lib/panchang/tirunakshatram-dates";
import { templeLocationFrom } from "@/lib/panchang/compute";
import { getAcharyaMedia } from "@/lib/data/acharya-media";
import { getTempleInfo } from "@/lib/data/temple-info";
import { formatIso, todayInIndia } from "@/lib/dates";
import { verseLines } from "@/lib/panchang/verses";

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const a = acharyaBySlug(slug);
  if (!a) return {};
  const { imageUrl } = mediaFor(a, await getAcharyaMedia());
  const name = label(a.name, locale);
  return {
    title: name,
    description: label(a.summary, locale),
    openGraph: { title: name, description: label(a.summary, locale), ...(imageUrl ? { images: [imageUrl] } : {}) },
  };
}

export default async function AcharyaPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const a = acharyaBySlug(slug);
  if (!a) notFound();

  const [t, tMeta, uploads, info] = await Promise.all([
    getTranslations({ locale, namespace: "panchangam" }),
    getTranslations({ locale, namespace: "meta" }),
    getAcharyaMedia(),
    getTempleInfo().catch(() => null),
  ]);
  const L = (n: { en: string; kn: string }) => label(n, locale);
  const today = todayInIndia();
  const next = a.tirunakshatram === undefined ? null : nextTirunakshatram(a.tirunakshatram, today, templeLocationFrom(info, tMeta("siteTitle")));
  const tn = tirunakshatramOf(a);
  const star = tn ? `${L(tn.month)} · ${L(NAKSHATRA_NAMES[tn.nakshatra])}` : t("acharya.tirunakshatramUnknown");
  const name = L(a.name);
  const verse = a.composition;
  const meanings = verse ? (locale === "kn" ? [verse.meaning.kn, verse.meaning.en] : [verse.meaning.en, verse.meaning.kn]) : [];
  const media = mediaFor(a, uploads);

  const index = ACHARYAS.findIndex((x) => x.slug === a.slug);
  const prev = ACHARYAS[(index - 1 + ACHARYAS.length) % ACHARYAS.length];
  const after = ACHARYAS[(index + 1) % ACHARYAS.length];

  const facts: [string, string][] = [
    [t("acharya.tirunakshatram"), star],
    ...(a.alsoKnownAs ? ([[t("acharya.alsoKnownAs"), L(a.alsoKnownAs)]] as [string, string][]) : []),
    ...(a.birthplace ? ([[t("acharya.birthplace"), L(a.birthplace)]] as [string, string][]) : []),
    ...(a.amsam ? ([[t("acharya.amsam"), L(a.amsam)]] as [string, string][]) : []),
    ...(a.period ? ([[t("acharya.period"), L(a.period)]] as [string, string][]) : []),
  ];

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <Link href="/panchangam/acharya" className="text-sm font-semibold text-maroon underline-offset-4 hover:underline">
        ← {t("acharya.all")}
      </Link>

      {/* Portrait and name */}
      <header className="mt-5 flex flex-col items-center gap-5 rounded-3xl border border-gold/30 bg-white/80 p-5 text-center shadow-sm sm:flex-row sm:items-start sm:gap-7 sm:p-7 sm:text-left">
        <div className="flex flex-col items-center gap-1">
          <ZoomablePortrait name={name} imageUrl={media.imageUrl} fullImageUrl={media.imageFullUrl} size={132} />
          {media.imageCredit ? (
            <a href={media.imageCredit.sourceUrl} target="_blank" rel="noopener noreferrer" className="max-w-40 truncate text-[10px] text-ink/40 hover:underline">
              {t("acharya.pictureCredit", { author: media.imageCredit.author, license: media.imageCredit.license })}
            </a>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-saffron">
            {t(`acharya.${({ alwar: "alwars", acharya: "acharyas", nityasuri: "nityasuris", recent: "recent" } as const)[a.kind]}`)}
          </p>
          <h1 className="mt-1 font-display text-3xl leading-tight text-maroon sm:text-4xl">{name}</h1>
          <p className="mt-2 text-sm text-ink/75 sm:text-base">{L(a.summary)}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            {next === today ? (
              <span className="rounded-full bg-maroon px-3 py-1 text-xs font-bold uppercase tracking-wide text-gold-light">
                🪔 {t("acharya.todayBadge")}
              </span>
            ) : next ? (
              <Link
                href={{ pathname: "/panchangam", query: { date: next } }}
                className="rounded-full border border-gold/50 bg-cream px-3 py-1 text-xs font-semibold text-maroon hover:border-maroon/50"
              >
                🗓 {t("acharya.next", { date: formatIso(next, locale, { weekday: "short", day: "numeric", month: "long", year: "numeric" }) })}
              </Link>
            ) : null}
            <ShareButton
              title={`🙏 ${name}`}
              text={`${L(a.summary)}\n${t("acharya.tirunakshatram")}: ${star}`}
              path={acharyaPath(a.slug)}
              imageUrl={media.imageUrl ?? undefined}
            />
          </div>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="space-y-6">
          <section>
            <h2 className="font-display text-xl text-maroon">{t("acharya.life")}</h2>
            <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-ink/80">
              {a.life.map((p, i) => (
                <p key={i}>{L(p)}</p>
              ))}
            </div>
          </section>

          {/* The composition shown as the verse of the day on the tirunakshatram */}
          {verse ? (
          <section className="relative overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-cream to-white p-5 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative watermark */}
            <img src="/images/chakra-watermark.png" alt="" aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-40 w-auto opacity-[0.06]" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-saffron">📿 {t("acharya.composition")}</p>
            <h2 className="mt-1 font-display text-lg text-maroon">{L(verse.source)}</h2>
            {/* Always in Kannada script; the English site shows it romanised first. */}
            <blockquote className="mt-3 space-y-3 border-l-2 border-gold pl-4">
              {verseLines(verse, locale).map((line, i) => (
                <p
                  key={line.lang}
                  lang={line.lang}
                  className={`whitespace-pre-line break-words leading-relaxed ${i ? "text-sm text-ink/70" : "text-[15px] text-ink"}`}
                  style={line.lang === "kn" ? { fontFamily: "var(--font-temple-kannada), var(--font-temple-sans), sans-serif" } : undefined}
                >
                  {line.text}
                </p>
              ))}
            </blockquote>
            {verse.tamil ? (
              <p lang="ta" className="mt-2 whitespace-pre-line pl-4 text-xs leading-relaxed text-ink/55">
                {verse.tamil}
              </p>
            ) : null}
            <div className="mt-4 space-y-2">
              {meanings.map((m, i) => (
                <p key={i} className={`text-sm leading-relaxed ${i ? "text-ink/55" : "text-ink/80"}`}>
                  {m}
                </p>
              ))}
            </div>
            {media.audioUrl ? (
              <VerseAudio
                className="mt-4"
                src={media.audioUrl}
                title={media.audioCredit?.title ? L(media.audioCredit.title) : t("acharya.listen")}
                credit={
                  media.audioCredit
                    ? { text: t("acharya.audioCredit", { author: media.audioCredit.author, license: media.audioCredit.license }), href: media.audioCredit.sourceUrl }
                    : null
                }
              />
            ) : null}
            <p className="mt-3 text-[11px] text-ink/45">{t("acharya.verseNote")}</p>
          </section>
          ) : null}

          {/* Further tanians, e.g. one recited daily */}
          {(a.moreTanians ?? []).map((tanian) => (
            <section key={tanian.id} className="rounded-2xl border border-gold/30 bg-white/80 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-saffron">📿 {t("acharya.tanians")}</p>
              <h2 className="mt-1 font-display text-lg text-maroon">{L(tanian.source)}</h2>
              <blockquote className="mt-3 space-y-3 border-l-2 border-gold pl-4">
                {verseLines(tanian, locale).map((line, i) => (
                  <p
                    key={line.lang}
                    lang={line.lang}
                    className={`whitespace-pre-line break-words leading-relaxed ${i ? "text-sm text-ink/70" : "text-[15px] text-ink"}`}
                    style={line.lang === "kn" ? { fontFamily: "var(--font-temple-kannada), var(--font-temple-sans), sans-serif" } : undefined}
                  >
                    {line.text}
                  </p>
                ))}
              </blockquote>
              <div className="mt-4 space-y-2">
                {(locale === "kn" ? [tanian.meaning.kn, tanian.meaning.en] : [tanian.meaning.en, tanian.meaning.kn]).map((m, i) => (
                  <p key={i} className={`text-sm leading-relaxed ${i ? "text-ink/55" : "text-ink/80"}`}>
                    {m}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <YouTubeRecordings recordings={RECORDINGS[a.slug] ?? []} locale={locale} />
        </div>

        <aside className="space-y-5">
          <dl className="space-y-3 rounded-2xl border border-gold/25 bg-white/80 p-4 text-sm">
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink/45">{k}</dt>
                <dd className="mt-0.5 text-ink/85">{v}</dd>
              </div>
            ))}
          </dl>
          {a.works.length ? (
            <section className="rounded-2xl border border-gold/25 bg-white/80 p-4">
              <h2 className="font-display text-base text-maroon">{t("acharya.works")}</h2>
              <ul className="mt-2 space-y-1.5 text-sm text-ink/80">
                {a.works.map((w, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-gold">✦</span>
                    <span>{L(w)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>

      <nav className="mt-10 flex items-stretch justify-between gap-3 border-t border-gold/25 pt-5 text-sm">
        <Link href={acharyaPath(prev.slug)} className="flex min-w-0 flex-col rounded-xl px-2 py-1 hover:bg-gold/10">
          <span className="text-xs text-ink/45">←</span>
          <span className="truncate font-semibold text-maroon">{L(prev.name)}</span>
        </Link>
        <Link href={acharyaPath(after.slug)} className="flex min-w-0 flex-col items-end rounded-xl px-2 py-1 text-right hover:bg-gold/10">
          <span className="text-xs text-ink/45">→</span>
          <span className="truncate font-semibold text-maroon">{L(after.name)}</span>
        </Link>
      </nav>
    </article>
  );
}
