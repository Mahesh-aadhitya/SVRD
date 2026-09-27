import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import SectionHeading from "@/components/SectionHeading";
import BookingFlow from "@/components/BookingFlow";
import { getActiveSevas } from "@/lib/data/sevas";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sevas = await getActiveSevas();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <BookingContent sevas={sevas} />
    </div>
  );
}

function BookingContent({ sevas }: { sevas: Awaited<ReturnType<typeof getActiveSevas>> }) {
  const t = useTranslations("booking");

  return (
    <>
      <SectionHeading title={t("pageTitle")} subtitle={t("pageSubtitle")} />
      <Suspense fallback={null}>
        <BookingFlow sevas={sevas} />
      </Suspense>
    </>
  );
}
