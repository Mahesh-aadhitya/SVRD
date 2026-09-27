import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import SectionHeading from "@/components/SectionHeading";
import Card from "@/components/ui/Card";
import { templeInfo } from "@/lib/placeholder-data";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AboutContent />;
}

function AboutContent() {
  const t = useTranslations("about");
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    templeInfo.mapsQuery
  )}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <SectionHeading title={t("pageTitle")} />

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <Card className="p-6">
          <p className="font-display text-lg text-maroon">{t("addressTitle")}</p>
          <p className="mt-2 text-sm text-ink/70">
            {templeInfo.addressLine1}
            <br />
            {templeInfo.addressLine2}
          </p>
          <a
            href={mapsHref}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-maroon px-4 py-2 text-sm font-semibold text-cream hover:bg-maroon-dark"
          >
            {t("directionsCta")}
          </a>
        </Card>

        <Card className="p-6">
          <p className="font-display text-lg text-maroon">{t("contactTitle")}</p>
          <p className="mt-2 text-sm text-ink/70">{templeInfo.phone}</p>
          <p className="text-sm text-ink/70">{templeInfo.email}</p>
        </Card>

        <Card className="p-6 sm:col-span-2">
          <p className="font-display text-lg text-maroon">{t("timingsTitle")}</p>
          <div className="mt-3 space-y-2">
            {templeInfo.timings.map((slot) => (
              <div
                key={slot.day}
                className="flex items-center justify-between border-b border-gold/15 pb-2 text-sm last:border-0"
              >
                <span className="text-ink/70">{slot.day}</span>
                <span className="font-medium text-maroon-dark">{slot.hours}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden sm:col-span-2">
          <div className="aspect-[16/7] w-full">
            <iframe
              title="Temple location map"
              className="h-full w-full"
              loading="lazy"
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                templeInfo.mapsQuery
              )}&output=embed`}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
