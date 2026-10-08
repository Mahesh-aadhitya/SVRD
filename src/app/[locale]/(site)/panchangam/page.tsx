import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PanchangamView from "@/components/panchangam/PanchangamView";
import { computePanchang, isValidIsoDate, templeLocationFrom } from "@/lib/panchang/compute";
import { todayInIndia } from "@/lib/dates";
import { getTempleInfo } from "@/lib/data/temple-info";
import { getVerseForDay } from "@/lib/data/verses";
import { occasionFor } from "@/lib/panchang/verses";
import { getAcharyaMedia } from "@/lib/data/acharya-media";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "panchangam" });
  return { title: t("pageTitle"), description: t("subtitle") };
}

export default async function PanchangamPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ date?: string | string[] }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { date: requested } = await searchParams;
  const date = typeof requested === "string" && isValidIsoDate(requested) ? requested : todayInIndia();
  const [tMeta, info] = await Promise.all([getTranslations({ locale, namespace: "meta" }), getTempleInfo().catch(() => null)]);
  const templeLocation = templeLocationFrom(info, tMeta("siteTitle"));

  const initialDay = computePanchang(date, templeLocation);
  const [initialVerse, acharyaMedia] = await Promise.all([getVerseForDay(date, occasionFor(initialDay.observances)), getAcharyaMedia()]);

  return (
    <PanchangamView
      initialDate={date}
      initialDay={initialDay}
      initialVerse={initialVerse}
      templeLocation={templeLocation}
      locale={locale}
      acharyaMedia={acharyaMedia}
    />
  );
}
