import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import SectionHeading from "@/components/SectionHeading";
import Card from "@/components/ui/Card";
import { events } from "@/lib/placeholder-data";
import type { Locale } from "@/i18n/routing";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <EventsContent />;
}

function EventsContent() {
  const t = useTranslations("events");
  const locale = useLocale() as Locale;
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <SectionHeading title={t("pageTitle")} subtitle={t("pageSubtitle")} />
      <div className="mt-8 space-y-4">
        {sorted.map((event) => {
          const date = new Date(event.date);
          return (
            <Card key={event.id} className="flex flex-col gap-4 overflow-hidden sm:flex-row">
              <div className="relative h-40 w-full sm:h-auto sm:w-56 sm:shrink-0">
                <Image src={event.image} alt={event.title[locale]} fill className="object-cover" />
              </div>
              <div className="flex flex-1 flex-col justify-center gap-2 p-5 sm:pl-0">
                <div className="flex items-center gap-3">
                  <div className="flex w-14 flex-col items-center rounded-lg bg-maroon text-cream">
                    <span className="pt-1.5 text-[10px] font-semibold uppercase tracking-wide">
                      {date.toLocaleDateString("en", { month: "short" })}
                    </span>
                    <span className="pb-1.5 font-display text-xl leading-none">
                      {date.getDate()}
                    </span>
                  </div>
                  <p className="font-display text-xl text-maroon">{event.title[locale]}</p>
                </div>
                <p className="text-sm text-ink/70">{event.description[locale]}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
