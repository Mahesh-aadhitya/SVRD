import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import SectionHeading from "@/components/SectionHeading";
import BookingFlow from "@/components/BookingFlow";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <BookingContent />;
}

function BookingContent() {
  const t = useTranslations("booking");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <SectionHeading title={t("pageTitle")} subtitle={t("pageSubtitle")} />
      <Suspense fallback={null}>
        <BookingFlow />
      </Suspense>
    </div>
  );
}
