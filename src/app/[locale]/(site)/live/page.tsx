import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import SectionHeading from "@/components/SectionHeading";
import Card from "@/components/ui/Card";
import LiveComments from "@/components/LiveComments";
import { liveConfig } from "@/lib/placeholder-data";
import type { Locale } from "@/i18n/routing";

export default async function LivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LiveContent />;
}

function LiveContent() {
  const t = useTranslations("live");
  const locale = useLocale() as Locale;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <SectionHeading title={t("pageTitle")} subtitle={t("pageSubtitle")} />

      <div className="mt-6 overflow-hidden rounded-2xl bg-black shadow-lg">
        {liveConfig.isLive && liveConfig.youtubeId ? (
          <div className="aspect-video w-full">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${liveConfig.youtubeId}?autoplay=1`}
              title="Live darshan"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-divine-gradient px-6 text-center text-cream">
            <Image src="/images/emblem-chakra.png" alt="" width={56} height={60} className="opacity-90" />
            <p className="font-display text-xl">{t("offlineTitle")}</p>
            <p className="max-w-sm text-sm text-cream/75">{t("offlineSubtitle")}</p>
            <p className="mt-2 rounded-full bg-cream/10 px-4 py-1.5 text-xs font-medium text-gold-light">
              {t("scheduledLabel")}: {liveConfig.scheduledAt}
            </p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <p className="font-display text-lg text-maroon">{t("commentsTitle")}</p>
        <LiveComments />
      </div>

      <div className="mt-10">
        <p className="font-display text-lg text-maroon">{t("archiveTitle")}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {liveConfig.archive.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="relative aspect-video w-full bg-black">
                <Image
                  src="/images/placeholder-gallery-4.svg"
                  alt={item.title[locale]}
                  fill
                  className="object-cover opacity-80"
                />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/85">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 translate-x-0.5 fill-maroon">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </span>
              </div>
              <p className="p-3 text-sm font-medium text-ink/80">{item.title[locale]}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
