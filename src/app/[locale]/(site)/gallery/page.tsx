import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import SectionHeading from "@/components/SectionHeading";
import GalleryGrid from "@/components/GalleryGrid";

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <GalleryContent />;
}

function GalleryContent() {
  const t = useTranslations("gallery");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <SectionHeading title={t("pageTitle")} subtitle={t("pageSubtitle")} />
      <GalleryGrid />
    </div>
  );
}
