import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import LiveControlPanel from "@/components/admin/LiveControlPanel";

export default async function AdminLivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Content />;
}

function Content() {
  const t = useTranslations("admin");

  return (
    <div>
      <AdminPageHeader title={t("nav.live")} />
      <LiveControlPanel />
    </div>
  );
}
