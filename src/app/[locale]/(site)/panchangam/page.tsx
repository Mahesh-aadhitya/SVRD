import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PanchangamView from "@/components/panchangam/PanchangamView";
import { computePanchang, isValidIsoDate, TEMPLE_LOCATION } from "@/lib/panchang/compute";
import { todayInIndia } from "@/lib/dates";

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
  const tMeta = await getTranslations({ locale, namespace: "meta" });

  return (
    <PanchangamView
      initialDate={date}
      initialDay={computePanchang(date, TEMPLE_LOCATION)}
      locale={locale}
      siteTitle={tMeta("siteTitle")}
    />
  );
}
