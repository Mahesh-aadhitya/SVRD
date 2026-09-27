import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import SectionHeading from "@/components/SectionHeading";
import SongList from "@/components/SongList";

export default async function SongsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SongsContent />;
}

function SongsContent() {
  const t = useTranslations("songs");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <SectionHeading title={t("pageTitle")} subtitle={t("pageSubtitle")} />
      <SongList />
    </div>
  );
}
