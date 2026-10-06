import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import SectionHeading from "@/components/SectionHeading";
import NoticeCard from "@/components/NoticeCard";
import { getActiveNotices } from "@/lib/data/notices";
import type { Notice } from "@/lib/content-types";

export default async function NoticesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const notices = await getActiveNotices();
  return <NoticesContent notices={notices} />;
}

function NoticesContent({ notices }: { notices: Notice[] }) {
  const t = useTranslations("notices");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <SectionHeading title={t("pageTitle")} subtitle={t("pageSubtitle")} />
      {notices.length === 0 ? (
        <p className="mt-8 text-center text-sm text-ink/55">{t("empty")}</p>
      ) : (
        <div className="mt-8 space-y-4">
          {notices.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} />
          ))}
        </div>
      )}
    </div>
  );
}
