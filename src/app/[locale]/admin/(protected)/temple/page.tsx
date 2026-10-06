import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import TempleInfoForm from "@/components/admin/TempleInfoForm";
import { getTempleInfo } from "@/lib/data/temple-info";
import type { TempleInfo } from "@/lib/content-types";

export default async function AdminTemplePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const info = await getTempleInfo();
  return <Content info={info} />;
}

function Content({ info }: { info: TempleInfo }) {
  const t = useTranslations("admin");

  return (
    <div>
      <AdminPageHeader title={t("nav.temple")} />
      <p className="mb-6 text-sm text-ink/60">
        Shown on the home page, the Temple &amp; Contact page and the site footer.
      </p>
      <TempleInfoForm info={info} />
    </div>
  );
}
