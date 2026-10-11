import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHeading from "@/components/SectionHeading";
import Card from "@/components/ui/Card";
import { getTempleInfo } from "@/lib/data/temple-info";
import type { TempleInfo } from "@/lib/content-types";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "footer" });
  return { title: t("contact") };
}

// The temple's address, phone and email (from admin → temple info).
export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const info = await getTempleInfo();
  return <ContactContent info={info} />;
}

function ContactContent({ info }: { info: TempleInfo }) {
  const t = useTranslations("footer");
  const tMeta = useTranslations("meta");
  const row = "flex gap-3 text-sm text-ink/75";
  const label = "w-20 shrink-0 font-semibold text-maroon";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <SectionHeading title={t("contact")} subtitle={t("contactSubtitle")} />
      <Card className="mt-8 space-y-3 p-6 sm:p-8">
        <p className="font-display text-xl text-maroon">{tMeta("siteTitle")}</p>
        {info.addressLine1 || info.addressLine2 ? (
          <p className={row}>
            <span className={label}>{t("address")}</span>
            <span>
              {info.addressLine1}
              {info.addressLine1 && info.addressLine2 ? <br /> : null}
              {info.addressLine2}
            </span>
          </p>
        ) : null}
        {info.phone ? (
          <p className={row}>
            <span className={label}>{t("phone")}</span>
            <a href={`tel:${info.phone.replace(/\s/g, "")}`} className="hover:text-maroon hover:underline">
              {info.phone}
            </a>
          </p>
        ) : null}
        {info.email ? (
          <p className={row}>
            <span className={label}>{t("email")}</span>
            <a href={`mailto:${info.email}`} className="break-all hover:text-maroon hover:underline">
              {info.email}
            </a>
          </p>
        ) : null}
      </Card>
    </div>
  );
}
