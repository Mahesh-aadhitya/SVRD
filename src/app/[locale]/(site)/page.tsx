import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import SectionHeading from "@/components/SectionHeading";
import Card from "@/components/ui/Card";
import DivineHero from "@/components/DivineHero";
import ContentImage from "@/components/ContentImage";
import { DiyaIcon, CalendarIcon, ArchFrameIcon, BellIcon } from "@/components/QuickLinkIcons";
import { getListedSevas } from "@/lib/data/sevas";
import { getEvents } from "@/lib/data/events";
import { getGalleryItems } from "@/lib/data/gallery";
import { getTempleInfo } from "@/lib/data/temple-info";
import { getHighlights } from "@/lib/data/highlights";
import WhatsNew from "@/components/highlights/WhatsNew";
import PanchangTeaser from "@/components/panchangam/PanchangTeaser";
import type { Highlight } from "@/lib/highlight-types";
import { todayInIndia } from "@/lib/dates";
import type { Locale } from "@/i18n/routing";
import type { TempleEvent, TempleInfo } from "@/lib/content-types";
import type { Seva } from "@/lib/seva-types";
import type { GalleryItem } from "@/lib/gallery-types";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [sevas, events, gallery, templeInfo, highlights] = await Promise.all([
    getListedSevas(),
    getEvents(),
    getGalleryItems(),
    getTempleInfo(),
    getHighlights(),
  ]);
  const today = todayInIndia();

  return (
    <HomeContent
      nityaSevas={sevas.filter((s) => s.frequency === "nitya")}
      events={events.filter((e) => e.date >= today)}
      gallery={gallery}
      templeInfo={templeInfo}
      highlights={highlights}
    />
  );
}

function HomeContent({
  nityaSevas,
  events,
  gallery,
  templeInfo,
  highlights,
}: {
  nityaSevas: Seva[];
  events: TempleEvent[];
  gallery: GalleryItem[];
  templeInfo: TempleInfo;
  highlights: Highlight[];
}) {
  const t = useTranslations("home");
  const tSevas = useTranslations("sevas");
  const locale = useLocale() as Locale;

  const dailySevas = nityaSevas.slice(0, 3);
  const upcomingEvents = [...events]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);
  const galleryPreview = gallery.slice(0, 4);

  return (
    <div className="animate-divine-fade-up">
      <DivineHero />

      {/* What's new: live darshan, ticket releases, messages and festivals
          as notification tiles, right below the hero. */}
      <WhatsNew initial={highlights} />

      {/* Quick links */}
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6">
        <h2 className="sr-only">{t("quickLinksTitle")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { href: "/sevas", labelKey: "sevas", Icon: DiyaIcon },
            { href: "/events", labelKey: "events", Icon: CalendarIcon },
            { href: "/gallery", labelKey: "gallery", Icon: ArchFrameIcon },
            { href: "/songs", labelKey: "songs", Icon: BellIcon },
          ].map(({ href, labelKey, Icon }) => (
            <QuickLink key={href} href={href} icon={<Icon className="h-7 w-7" />} labelKey={labelKey} />
          ))}
        </div>
      </section>

      <PanchangTeaser locale={locale} initialDate={todayInIndia()} />

      {/* Daily (nitya) sevas */}
      {dailySevas.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <SectionHeading
            eyebrow={tSevas("groups.nitya.badge")}
            title={t("todayPoojaTitle")}
            cta={
              <Link href="/sevas" className="text-sm font-semibold text-maroon hover:underline">
                {tSevas("allSevas")} →
              </Link>
            }
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {dailySevas.map((seva) => (
              <Card key={seva.id} className="overflow-hidden">
                <div className="relative h-36 w-full">
                  <ContentImage src={seva.imageUrl} alt={seva.name[locale]} />
                </div>
                <div className="p-4">
                  <p className="font-display text-lg text-maroon">{seva.name[locale]}</p>
                  {seva.timing ? <p className="mt-1 text-xs font-medium text-saffron">{seva.timing}</p> : null}
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {/* Upcoming events */}
      {upcomingEvents.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <SectionHeading
            title={t("upcomingEventsTitle")}
            cta={
              <Link href="/events" className="text-sm font-semibold text-maroon hover:underline">
                {t("upcomingEventsCta")} →
              </Link>
            }
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {upcomingEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                <div className="relative h-32 w-full">
                  <ContentImage src={event.image} alt={event.title[locale]} />
                </div>
                <div className="p-4">
                  <p className="font-display text-lg text-maroon">{event.title[locale]}</p>
                  <p className="mt-1 text-xs text-ink/60">
                    {new Date(`${event.date}T00:00:00`).toLocaleDateString(locale === "kn" ? "kn-IN" : "en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {/* Gallery preview */}
      {galleryPreview.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <SectionHeading
            title={t("galleryPreviewTitle")}
            cta={
              <Link href="/gallery" className="text-sm font-semibold text-maroon hover:underline">
                {t("galleryPreviewCta")} →
              </Link>
            }
          />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {galleryPreview.map((item) => (
              <div key={item.id} className="relative aspect-square overflow-hidden rounded-xl">
                <Image src={item.image} alt="" fill sizes="(min-width: 640px) 25vw, 50vw" className="object-cover" />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Address teaser */}
      {templeInfo.addressLine1 || templeInfo.addressLine2 ? (
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <Card className="flex flex-col items-start gap-4 bg-divine-radial p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-xl text-maroon">{t("addressTitle")}</p>
              <p className="mt-1 text-sm text-ink/70">
                {[templeInfo.addressLine1, templeInfo.addressLine2].filter(Boolean).join(", ")}
              </p>
            </div>
            <Link
              href="/about"
              className="shrink-0 rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark"
            >
              {t("addressCta")}
            </Link>
          </Card>
        </section>
      ) : null}
    </div>
  );
}

function QuickLink({
  href,
  icon,
  labelKey,
}: {
  href: string;
  icon: React.ReactNode;
  labelKey: string;
}) {
  const t = useTranslations("nav");
  return (
    <Link
      href={href}
      className="group flex flex-col items-center gap-2.5 rounded-2xl border border-gold/25 bg-white/70 py-6 text-center transition-transform hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-maroon text-gold-light ring-2 ring-gold/40 ring-offset-2 ring-offset-cream transition-colors group-hover:bg-maroon-dark">
        {icon}
      </span>
      <span className="text-sm font-medium text-ink/80">{t(labelKey)}</span>
    </Link>
  );
}
