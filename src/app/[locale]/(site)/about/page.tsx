import { useTranslations, useLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import SectionHeading from "@/components/SectionHeading";
import Card from "@/components/ui/Card";
import { getTempleInfo } from "@/lib/data/temple-info";
import type { Locale } from "@/i18n/routing";
import { timingDay, timingHours } from "@/lib/temple-timings";
import { mapDirectionsHref, mapEmbedSrc } from "@/lib/temple-map";
import type { TempleInfo } from "@/lib/content-types";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const info = await getTempleInfo();
  return <AboutContent info={info} />;
}

function AboutContent({ info }: { info: TempleInfo }) {
  const t = useTranslations("about");
  const locale = useLocale() as Locale;
  const about = info.about[locale] || info.about.en;
  const hasPin = info.lat != null && info.lon != null;
  // Straight into the route from the visitor's location to this temple.
  const mapsHref = hasPin ? mapDirectionsHref(info) : info.mapsUrl;
  const hasMap = hasPin;
  const hasAddress = !!(info.addressLine1 || info.addressLine2);
  const hasContact = !!(info.phone || info.email);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <SectionHeading title={t("pageTitle")} />

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {about ? (
          <Card className="p-6 sm:col-span-2">
            <p className="font-display text-lg text-maroon">{t("historyTitle")}</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink/75">{about}</p>
          </Card>
        ) : null}

        {hasAddress ? (
          <Card className="p-6">
            <p className="font-display text-lg text-maroon">{t("addressTitle")}</p>
            <p className="mt-2 text-sm text-ink/70">
              {info.addressLine1}
              {info.addressLine1 && info.addressLine2 ? <br /> : null}
              {info.addressLine2}
            </p>
            {hasMap || info.mapsUrl ? (
              <a
                href={mapsHref}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-maroon px-4 py-2 text-sm font-semibold text-cream hover:bg-maroon-dark"
              >
                {t("directionsCta")}
              </a>
            ) : null}
          </Card>
        ) : null}

        {hasContact ? (
          <Card className="p-6">
            <p className="font-display text-lg text-maroon">{t("contactTitle")}</p>
            {info.phone ? (
              <a href={`tel:${info.phone.replace(/\s/g, "")}`} className="mt-2 block text-sm text-ink/70 hover:text-maroon">
                {info.phone}
              </a>
            ) : null}
            {info.email ? (
              <a href={`mailto:${info.email}`} className="block text-sm text-ink/70 hover:text-maroon">
                {info.email}
              </a>
            ) : null}
          </Card>
        ) : null}

        {info.timings.length > 0 ? (
          <Card className="p-6 sm:col-span-2">
            <p className="font-display text-lg text-maroon">{t("timingsTitle")}</p>
            <div className="mt-3 space-y-2">
              {info.timings.map((slot) => (
                <div
                  key={slot.day}
                  className="flex flex-wrap items-center justify-between gap-x-4 border-b border-gold/15 pb-2 text-sm last:border-0"
                >
                  <span className="text-ink/70">{timingDay(slot, locale)}</span>
                  <span className="font-medium text-maroon-dark">{timingHours(slot, locale)}</span>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {hasMap ? (
          <Card className="overflow-hidden sm:col-span-2">
            <div className="aspect-[16/7] w-full">
              <iframe
                title="Temple location map"
                className="h-full w-full"
                loading="lazy"
                src={mapEmbedSrc(info.mapsPlace, info.lat!, info.lon!)}
              />
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
