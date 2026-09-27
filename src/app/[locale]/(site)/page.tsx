import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import SectionHeading from "@/components/SectionHeading";
import Card from "@/components/ui/Card";
import DivineHero from "@/components/DivineHero";
import { templeInfo } from "@/lib/placeholder-data";
import { getPoojas } from "@/lib/data/poojas";
import { getEvents } from "@/lib/data/events";
import { getGalleryItems } from "@/lib/data/gallery";
import type { Locale } from "@/i18n/routing";
import type { Pooja, TempleEvent } from "@/lib/placeholder-data";
import type { GalleryItem } from "@/lib/gallery-types";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [poojas, events, gallery] = await Promise.all([getPoojas(), getEvents(), getGalleryItems()]);

  return <HomeContent poojas={poojas} events={events} gallery={gallery} />;
}

function HomeContent({
  poojas,
  events,
  gallery,
}: {
  poojas: Pooja[];
  events: TempleEvent[];
  gallery: GalleryItem[];
}) {
  const t = useTranslations("home");
  const tPoojas = useTranslations("poojas");
  const locale = useLocale() as Locale;

  const todayPoojas = poojas.slice(0, 3);
  const upcomingEvents = [...events]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);
  const galleryPreview = gallery.slice(0, 4);

  return (
    <div className="animate-divine-fade-up">
      <DivineHero />

      {/* Quick links */}
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6">
        <h2 className="sr-only">{t("quickLinksTitle")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              href: "/poojas",
              labelKey: "poojas",
              icon: (
                <span className="relative flex h-6 w-6 shrink-0 overflow-hidden rounded-full bg-divine-gradient">
                  <Image src="/images/emblem-icon-square.png" alt="" fill sizes="24px" className="object-cover" />
                </span>
              ),
            },
            { href: "/events", labelKey: "events", icon: "📅" },
            { href: "/gallery", labelKey: "gallery", icon: "🖼️" },
            { href: "/songs", labelKey: "songs", icon: "🎶" },
          ].map((item) => (
            <QuickLink key={item.href} href={item.href} icon={item.icon} labelKey={item.labelKey} />
          ))}
        </div>
      </section>

      {/* Today's poojas */}
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <SectionHeading
          eyebrow={tPoojas("timingsLabel")}
          title={t("todayPoojaTitle")}
          cta={
            <Link href="/poojas" className="text-sm font-semibold text-maroon hover:underline">
              {tPoojas("pageTitle")} →
            </Link>
          }
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {todayPoojas.map((pooja) => (
            <Card key={pooja.id} className="overflow-hidden">
              <div className="relative h-36 w-full">
                <Image src={pooja.image} alt={pooja.name[locale]} fill className="object-cover" />
              </div>
              <div className="p-4">
                <p className="font-display text-lg text-maroon">{pooja.name[locale]}</p>
                <p className="mt-1 text-xs font-medium text-saffron">{pooja.timing}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Upcoming events */}
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
                <Image src={event.image} alt={event.title[locale]} fill className="object-cover" />
              </div>
              <div className="p-4">
                <p className="font-display text-lg text-maroon">{event.title[locale]}</p>
                <p className="mt-1 text-xs text-ink/60">
                  {new Date(event.date).toLocaleDateString(locale === "kn" ? "kn-IN" : "en-IN", {
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

      {/* Gallery preview */}
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
              <Image src={item.image} alt="" fill className="object-cover" />
            </div>
          ))}
        </div>
      </section>

      {/* Address teaser */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Card className="flex flex-col items-start gap-4 bg-divine-radial p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-xl text-maroon">{t("addressTitle")}</p>
            <p className="mt-1 text-sm text-ink/70">
              {templeInfo.addressLine1}, {templeInfo.addressLine2}
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
      className="flex flex-col items-center gap-2 rounded-2xl border border-gold/25 bg-white/70 py-6 text-center transition-transform hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="flex h-8 items-center justify-center text-2xl">{icon}</span>
      <span className="text-sm font-medium text-ink/80">{t(labelKey)}</span>
    </Link>
  );
}
