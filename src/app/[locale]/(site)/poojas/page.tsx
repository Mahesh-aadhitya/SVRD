import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import SectionHeading from "@/components/SectionHeading";
import Card from "@/components/ui/Card";
import { getPoojas } from "@/lib/data/poojas";
import type { Locale } from "@/i18n/routing";
import type { Pooja } from "@/lib/placeholder-data";

export default async function PoojasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const poojas = await getPoojas();
  return <PoojasContent poojas={poojas} />;
}

function PoojasContent({ poojas }: { poojas: Pooja[] }) {
  const t = useTranslations("poojas");
  const locale = useLocale() as Locale;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <SectionHeading title={t("pageTitle")} subtitle={t("pageSubtitle")} />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {poojas.map((pooja) => (
          <Card key={pooja.id} className="flex flex-col overflow-hidden">
            <div className="relative h-40 w-full">
              <Image src={pooja.image} alt={pooja.name[locale]} fill className="object-cover" />
              {pooja.isBookable ? (
                <span className="absolute right-3 top-3 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-maroon-dark shadow-sm">
                  {t("bookableTag")}
                </span>
              ) : null}
            </div>
            <div className="flex flex-1 flex-col p-5">
              <p className="font-display text-xl text-maroon">{pooja.name[locale]}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-saffron">
                {t("timingsLabel")}: {pooja.timing}
              </p>
              <p className="mt-3 flex-1 text-sm text-ink/70">{pooja.description[locale]}</p>
              {pooja.isBookable ? (
                <Link
                  href={{ pathname: "/booking", query: { seva: pooja.id } }}
                  className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-maroon px-4 py-2 text-sm font-semibold text-cream hover:bg-maroon-dark"
                >
                  {t("bookCta")}
                </Link>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
