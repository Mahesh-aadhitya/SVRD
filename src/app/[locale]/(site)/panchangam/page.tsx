import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PanchangamView from "@/components/panchangam/PanchangamView";
import { computePanchang, isValidIsoDate, TEMPLE_LOCATION } from "@/lib/panchang/compute";
import { todayInIndia } from "@/lib/dates";
import { getTempleInfo } from "@/lib/data/temple-info";

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
  // The temple's own pin from the admin's Temple info (Kolar until it's set).
  const templeLocation =
    info?.lat != null && info.lon != null ? { name: tMeta("siteTitle"), lat: info.lat, lon: info.lon, tzOffsetMin: 330 } : TEMPLE_LOCATION;

  return (
    <PanchangamView
      initialDate={date}
      initialDay={computePanchang(date, templeLocation)}
      templeLocation={templeLocation}
      locale={locale}
      siteTitle={tMeta("siteTitle")}
    />
  );
}
